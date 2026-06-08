-- ============================================================================
-- finanzas-pareja · schema.sql · v1
-- Esquema Postgres para Supabase: tablas + RLS + triggers de actividad.
--
-- REVISAR antes de aplicar. Ejecutar en Supabase → SQL Editor.
-- Modelo: un "hogar" (la pareja) con 2 usuarios; TODO es compartido por hogar_id.
-- RLS = solo los miembros del hogar acceden (cierra el acceso a terceros).
-- Moneda €; idioma por usuario (ES por defecto).
-- Idempotente: se puede ejecutar varias veces sin romper.
-- ============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1) Tablas
-- ---------------------------------------------------------------------------

-- El hogar compartido por la pareja.
create table if not exists hogares (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null default 'Nuestro hogar',
  moneda    text not null default 'EUR',
  creado_en timestamptz not null default now()
);

-- Perfil de usuario (espejo de auth.users; id = auth.uid()).
create table if not exists usuarios (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  nombre             text,
  hogar_id           uuid references hogares(id) on delete set null,
  idioma             text not null default 'es' check (idioma in ('es','en')),
  preferencias       jsonb not null default '{}'::jsonb,   -- tema, anti-ruido, etc.
  actividad_vista_en timestamptz not null default now(),    -- para contador de no-leídos
  creado_en          timestamptz not null default now()
);

-- Categorías (gasto o ingreso), editables. Borrado suave con "archivada".
create table if not exists categorias (
  id        uuid primary key default gen_random_uuid(),
  hogar_id  uuid not null references hogares(id) on delete cascade,
  nombre    text not null,
  tipo      text not null default 'gasto' check (tipo in ('gasto','ingreso')),
  color     text,
  icono     text,
  orden     int  not null default 0,
  archivada boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists idx_categorias_hogar on categorias(hogar_id);

create table if not exists subcategorias (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  hogar_id     uuid not null references hogares(id) on delete cascade,  -- denormalizado para RLS
  nombre       text not null,
  orden        int  not null default 0,
  archivada    boolean not null default false,
  creado_en    timestamptz not null default now()
);
create index if not exists idx_subcategorias_cat   on subcategorias(categoria_id);
create index if not exists idx_subcategorias_hogar on subcategorias(hogar_id);

-- Tope por categoría y por mes (cambia cada mes).
create table if not exists presupuestos (
  id           uuid primary key default gen_random_uuid(),
  hogar_id     uuid not null references hogares(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  anio         int  not null,
  mes          int  not null check (mes between 1 and 12),
  importe      numeric(12,2) not null default 0,
  creado_en    timestamptz not null default now(),
  unique (hogar_id, categoria_id, anio, mes)
);
create index if not exists idx_presupuestos_periodo on presupuestos(hogar_id, anio, mes);

-- Cada ingreso/gasto. anio/mes se derivan de fecha (trigger BEFORE) para filtrar rápido.
create table if not exists movimientos (
  id              uuid primary key default gen_random_uuid(),
  hogar_id        uuid not null references hogares(id) on delete cascade,
  tipo            text not null default 'gasto' check (tipo in ('gasto','ingreso')),
  importe         numeric(12,2) not null check (importe >= 0),  -- positivo; el tipo da el signo
  fecha           date not null default current_date,
  anio            int,   -- lo rellena el trigger desde fecha
  mes             int,   -- lo rellena el trigger desde fecha
  categoria_id    uuid references categorias(id) on delete set null,
  subcategoria_id uuid references subcategorias(id) on delete set null,
  nota            text,
  creado_por      uuid references usuarios(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_movimientos_periodo on movimientos(hogar_id, anio, mes);
create index if not exists idx_movimientos_cat     on movimientos(categoria_id);

-- Metadatos por mes (cerrar mes, notas). Ligera/opcional en v1: navegar entre
-- meses es un filtro por anio/mes, no necesita join.
create table if not exists periodos (
  id        uuid primary key default gen_random_uuid(),
  hogar_id  uuid not null references hogares(id) on delete cascade,
  anio      int  not null,
  mes       int  not null check (mes between 1 and 12),
  cerrado   boolean not null default false,
  notas     text,
  creado_en timestamptz not null default now(),
  unique (hogar_id, anio, mes)
);

-- Registro de cada cambio → campana + feed + notificaciones Realtime.
create table if not exists actividad (
  id         uuid primary key default gen_random_uuid(),
  hogar_id   uuid not null references hogares(id) on delete cascade,
  actor_id   uuid references usuarios(id) on delete set null,
  accion     text not null check (accion in ('crear','editar','borrar')),
  entidad    text not null check (entidad in ('movimiento','categoria','subcategoria','presupuesto')),
  entidad_id uuid,
  resumen    text,
  payload    jsonb,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_actividad_hogar on actividad(hogar_id, creado_en desc);

-- ---------------------------------------------------------------------------
-- 2) Helper: hogar del usuario autenticado.
--    SECURITY DEFINER para NO entrar en recursión de RLS al leer usuarios
--    desde sus propias políticas.
-- ---------------------------------------------------------------------------
create or replace function mi_hogar()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hogar_id from public.usuarios where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- 3) Triggers
-- ---------------------------------------------------------------------------

-- 3a) movimientos: derivar anio/mes de fecha y refrescar actualizado_en.
create or replace function movimientos_set_campos()
returns trigger
language plpgsql
as $$
begin
  new.anio := extract(year from new.fecha)::int;
  new.mes  := extract(month from new.fecha)::int;
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists trg_mov_campos on movimientos;
create trigger trg_mov_campos
  before insert or update on movimientos
  for each row execute function movimientos_set_campos();

-- 3b) Registro de actividad para cada cambio (genérico por tabla).
--     actor_id = auth.uid() (NULL si se ejecuta desde el SQL editor, p.ej. en el seed).
create or replace function registrar_actividad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion  text;
  v_entidad text;
  v_rec     record;
  v_cat     text;
  v_imp     text;
begin
  if    (tg_op = 'INSERT') then v_accion := 'crear';
  elsif (tg_op = 'UPDATE') then v_accion := 'editar';
  else                          v_accion := 'borrar';
  end if;

  if (tg_op = 'DELETE') then v_rec := old; else v_rec := new; end if;

  if (tg_table_name = 'movimientos') then
    v_entidad := 'movimiento';
    select nombre into v_cat from categorias where id = v_rec.categoria_id;
    v_imp := replace(trim(to_char(v_rec.importe, 'FM999999990.00')), '.', ',');
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' ' || v_rec.tipo || ' ' || coalesce(v_cat, '(sin categoría)')
        || ' ' || v_imp || ' €',
      to_jsonb(v_rec)
    );
  elsif (tg_table_name = 'categorias') then
    v_entidad := 'categoria';
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' categoría ' || coalesce(v_rec.nombre, ''),
      to_jsonb(v_rec)
    );
  elsif (tg_table_name = 'subcategorias') then
    v_entidad := 'subcategoria';
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' subcategoría ' || coalesce(v_rec.nombre, ''),
      to_jsonb(v_rec)
    );
  elsif (tg_table_name = 'presupuestos') then
    v_entidad := 'presupuesto';
    select nombre into v_cat from categorias where id = v_rec.categoria_id;
    v_imp := replace(trim(to_char(v_rec.importe, 'FM999999990.00')), '.', ',');
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' presupuesto ' || coalesce(v_cat, '') || ' '
        || v_rec.mes || '/' || v_rec.anio || ' ' || v_imp || ' €',
      to_jsonb(v_rec)
    );
  end if;

  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;

drop trigger if exists trg_act_movimientos on movimientos;
create trigger trg_act_movimientos
  after insert or update or delete on movimientos
  for each row execute function registrar_actividad();

drop trigger if exists trg_act_categorias on categorias;
create trigger trg_act_categorias
  after insert or update or delete on categorias
  for each row execute function registrar_actividad();

drop trigger if exists trg_act_subcategorias on subcategorias;
create trigger trg_act_subcategorias
  after insert or update or delete on subcategorias
  for each row execute function registrar_actividad();

drop trigger if exists trg_act_presupuestos on presupuestos;
create trigger trg_act_presupuestos
  after insert or update or delete on presupuestos
  for each row execute function registrar_actividad();

-- ---------------------------------------------------------------------------
-- 4) RLS: solo miembros del hogar acceden. Cierra el acceso a terceros.
-- ---------------------------------------------------------------------------
alter table hogares       enable row level security;
alter table usuarios      enable row level security;
alter table categorias    enable row level security;
alter table subcategorias enable row level security;
alter table presupuestos  enable row level security;
alter table movimientos   enable row level security;
alter table periodos      enable row level security;
alter table actividad     enable row level security;

-- hogares: ver/editar el hogar propio.
drop policy if exists hogares_select on hogares;
create policy hogares_select on hogares for select using (id = mi_hogar());
drop policy if exists hogares_update on hogares;
create policy hogares_update on hogares for update using (id = mi_hogar()) with check (id = mi_hogar());

-- usuarios: ver los perfiles del hogar; editar solo el propio.
drop policy if exists usuarios_select on usuarios;
create policy usuarios_select on usuarios for select using (hogar_id = mi_hogar() or id = auth.uid());
drop policy if exists usuarios_update on usuarios;
create policy usuarios_update on usuarios for update using (id = auth.uid()) with check (id = auth.uid());

-- Tablas compartidas: todo para los miembros del hogar.
drop policy if exists categorias_all on categorias;
create policy categorias_all on categorias for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());

drop policy if exists subcategorias_all on subcategorias;
create policy subcategorias_all on subcategorias for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());

drop policy if exists presupuestos_all on presupuestos;
create policy presupuestos_all on presupuestos for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());

drop policy if exists movimientos_all on movimientos;
create policy movimientos_all on movimientos for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());

drop policy if exists periodos_all on periodos;
create policy periodos_all on periodos for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());

-- actividad: solo lectura para los miembros. La escritura la hacen los triggers
-- (SECURITY DEFINER, dueño de tabla → omiten RLS), no el cliente.
drop policy if exists actividad_select on actividad;
create policy actividad_select on actividad for select using (hogar_id = mi_hogar());

-- ---------------------------------------------------------------------------
-- 5) Privilegios para el rol "authenticated" (RLS sigue siendo la puerta real).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, usage on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Realtime: publicar las tablas que escucha el frontend (idempotente).
--    El cliente se suscribe a "actividad" y refresca el mes visible.
-- ---------------------------------------------------------------------------
alter table movimientos  replica identity full;
alter table presupuestos replica identity full;

do $$
declare t text;
begin
  foreach t in array array['actividad','movimientos','presupuestos','categorias','subcategorias']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
