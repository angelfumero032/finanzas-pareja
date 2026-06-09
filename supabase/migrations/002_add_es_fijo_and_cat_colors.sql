-- ============================================================================
-- Migration 002 — es_fijo + category colors
-- Run in Supabase → SQL Editor
-- ============================================================================

-- 1) Fixed/recurring flag on movements
alter table movimientos add column if not exists es_fijo boolean not null default false;

-- 2) Update activity trigger to include es_fijo in the summary when set
-- (no changes needed — the trigger captures full to_jsonb(v_rec) payload)

-- 3) Set color for existing categories that have none (assigns palette defaults)
-- This is just a helper — the UI will let users change them freely afterward.
-- Colors map: Vivienda, Comida/Alimentación, Transporte, Ocio, Salud,
--             Suministros, Compras, Hogar, Ropa, Tecnología, Mascotas,
--             Personal, Educación, Ahorro, Otros
-- We update by name pattern (case-insensitive) if color is null.
update categorias set color = '#6366f1' where lower(nombre) like '%viviend%'  and color is null;
update categorias set color = '#10b981' where lower(nombre) like '%comid%'    and color is null;
update categorias set color = '#10b981' where lower(nombre) like '%aliment%'  and color is null;
update categorias set color = '#f59e0b' where lower(nombre) like '%transport%' and color is null;
update categorias set color = '#ec4899' where lower(nombre) like '%ocio%'     and color is null;
update categorias set color = '#ef4444' where lower(nombre) like '%salud%'    and color is null;
update categorias set color = '#14b8a6' where lower(nombre) like '%suministr%' and color is null;
update categorias set color = '#f97316' where lower(nombre) like '%compras%'  and color is null;
update categorias set color = '#8b5cf6' where lower(nombre) like '%hogar%'    and color is null;
update categorias set color = '#f472b6' where lower(nombre) like '%ropa%'     and color is null;
update categorias set color = '#06b6d4' where lower(nombre) like '%tecnolog%' and color is null;
update categorias set color = '#84cc16' where lower(nombre) like '%mascot%'   and color is null;
update categorias set color = '#a78bfa' where lower(nombre) like '%personal%' and color is null;
update categorias set color = '#fb923c' where lower(nombre) like '%educaci%'  and color is null;
update categorias set color = '#22d3ee' where lower(nombre) like '%ahorro%'   and color is null;

-- Fallback: any gasto category still without color gets a neutral color
update categorias set color = '#94a3b8'
  where tipo = 'gasto' and color is null;
update categorias set color = '#22c55e'
  where tipo = 'ingreso' and color is null;
