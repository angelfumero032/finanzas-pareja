-- ============================================================================
-- Migration 003 — pendiente flag + recurring templates
-- Run in Supabase → SQL Editor (after migration 002)
-- ============================================================================

-- 1) "Pending" flag on movements
--    pendiente = true  → expense is planned/budgeted but not yet charged/paid
--    pendiente = false → already charged (default, all existing movements)
alter table movimientos add column if not exists pendiente boolean not null default false;

-- 2) Recurring templates — define a fixed expense once, use it every month
create table if not exists plantillas_fijas (
  id              uuid primary key default gen_random_uuid(),
  hogar_id        uuid not null references hogares(id) on delete cascade,
  nombre          text not null,
  importe         numeric(12,2) not null default 0 check (importe >= 0),
  categoria_id    uuid references categorias(id) on delete set null,
  subcategoria_id uuid references subcategorias(id) on delete set null,
  dia_mes         int default 1 check (dia_mes between 1 and 31),
  nota            text,
  activa          boolean not null default true,
  orden           int not null default 0,
  creado_en       timestamptz not null default now()
);
create index if not exists idx_plantillas_hogar on plantillas_fijas(hogar_id);

-- RLS: same household access pattern
alter table plantillas_fijas enable row level security;
drop policy if exists plantillas_all on plantillas_fijas;
create policy plantillas_all on plantillas_fijas for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());

grant select, insert, update, delete on plantillas_fijas to authenticated;

-- 3) Add plantillas_fijas to realtime so templates modal syncs live
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'plantillas_fijas'
  ) then
    alter publication supabase_realtime add table public.plantillas_fijas;
  end if;
end $$;

-- 4) Add replica identity so realtime DELETE events carry the full row
alter table plantillas_fijas replica identity full;
