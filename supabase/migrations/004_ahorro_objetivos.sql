-- ============================================================================
-- Migration 004 — Hucha común (shared savings pot) + Objetivos (goals)
-- Run in Supabase → SQL Editor (after migration 003)
-- ============================================================================

-- 1) Objetivos — savings goals with a target budget and optional monthly target
create table if not exists objetivos (
  id              uuid primary key default gen_random_uuid(),
  hogar_id        uuid not null references hogares(id) on delete cascade,
  nombre          text not null,
  emoji           text,
  presupuesto     numeric(12,2) check (presupuesto >= 0),       -- target amount (optional)
  aporte_mensual  numeric(12,2) check (aporte_mensual >= 0),    -- intended monthly contribution (optional)
  fecha_objetivo  date,                                          -- optional deadline
  activo          boolean not null default true,
  orden           int not null default 0,
  creado_en       timestamptz not null default now()
);
create index if not exists idx_objetivos_hogar on objetivos(hogar_id);

-- 2) Aportes — manual contributions to the shared pot, optionally tied to a goal
--    Always a deliberate user action: nothing is moved automatically.
create table if not exists ahorro_aportes (
  id           uuid primary key default gen_random_uuid(),
  hogar_id     uuid not null references hogares(id) on delete cascade,
  objetivo_id  uuid references objetivos(id) on delete set null, -- null = general pot
  importe      numeric(12,2) not null check (importe <> 0),      -- negative = withdrawal
  fecha        date not null default current_date,
  anio         int generated always as (extract(year from fecha)::int) stored,
  mes          int generated always as (extract(month from fecha)::int) stored,
  nota         text,
  creado_por   uuid references usuarios(id) on delete set null,
  creado_en    timestamptz not null default now()
);
create index if not exists idx_aportes_hogar on ahorro_aportes(hogar_id);
create index if not exists idx_aportes_objetivo on ahorro_aportes(objetivo_id);

-- RLS: same household access pattern
alter table objetivos enable row level security;
drop policy if exists objetivos_all on objetivos;
create policy objetivos_all on objetivos for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());
grant select, insert, update, delete on objetivos to authenticated;

alter table ahorro_aportes enable row level security;
drop policy if exists aportes_all on ahorro_aportes;
create policy aportes_all on ahorro_aportes for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());
grant select, insert, update, delete on ahorro_aportes to authenticated;

-- Realtime so the pot syncs live between partners
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ahorro_aportes'
  ) then
    alter publication supabase_realtime add table public.ahorro_aportes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'objetivos'
  ) then
    alter publication supabase_realtime add table public.objetivos;
  end if;
end $$;

alter table ahorro_aportes replica identity full;
alter table objetivos replica identity full;
