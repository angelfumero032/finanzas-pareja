-- ============================================================================
-- Migration 005 — Presupuestos por subcategoría
-- Run in Supabase → SQL Editor (after migration 004)
-- ============================================================================

create table if not exists presupuestos_subcat (
  id              uuid primary key default gen_random_uuid(),
  hogar_id        uuid not null references hogares(id) on delete cascade,
  subcategoria_id uuid not null references subcategorias(id) on delete cascade,
  anio            int not null,
  mes             int not null check (mes between 1 and 12),
  importe         numeric(12,2) not null default 0 check (importe >= 0),
  creado_en       timestamptz not null default now(),
  unique (hogar_id, subcategoria_id, anio, mes)
);
create index if not exists idx_presub_hogar_mes on presupuestos_subcat(hogar_id, anio, mes);

alter table presupuestos_subcat enable row level security;
drop policy if exists presub_all on presupuestos_subcat;
create policy presub_all on presupuestos_subcat for all
  using (hogar_id = mi_hogar()) with check (hogar_id = mi_hogar());
grant select, insert, update, delete on presupuestos_subcat to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'presupuestos_subcat'
  ) then
    alter publication supabase_realtime add table public.presupuestos_subcat;
  end if;
end $$;

alter table presupuestos_subcat replica identity full;
