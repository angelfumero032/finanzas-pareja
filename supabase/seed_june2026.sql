-- ============================================================================
-- seed_june2026.sql — Datos de muestra para junio 2026
-- Pareja española, gastos e ingresos realistas para un mes completo.
-- IMPORTANTE: Sustituye los UUIDs de categorías por los reales de tu hogar.
-- Ejecutar DESPUÉS de seed.sql (hogar + usuarios) y de las migraciones 001-003.
-- ============================================================================
-- USO:
--   1. Abre Supabase SQL Editor.
--   2. Ejecuta primero este bloque para ver tus categorías reales:
--      SELECT id, nombre, tipo FROM categorias WHERE hogar_id = mi_hogar();
--   3. Sustituye los cat_* y subcat_* con los UUIDs que obtengas.
--   4. Ejecuta el bloque DO $$ ... $$ de abajo.
-- ============================================================================

DO $$
DECLARE
  hid   uuid := mi_hogar();

  -- ── Ajusta estos UUIDs con los de tu hogar ──────────────────────────────
  -- Ejecuta: SELECT id, nombre FROM categorias WHERE hogar_id = mi_hogar();
  cat_vivienda      uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%vivienda%'   LIMIT 1);
  cat_suministros   uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%suministro%' LIMIT 1);
  cat_aliment       uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%aliment%'    LIMIT 1);
  cat_transporte    uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%transport%'  LIMIT 1);
  cat_salud         uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%salud%'      LIMIT 1);
  cat_ocio          uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%ocio%'       LIMIT 1);
  cat_personal      uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%personal%'   LIMIT 1);
  cat_hogar         uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND nombre ILIKE '%hogar%'      LIMIT 1);
  cat_nomina        uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND tipo = 'ingreso' AND nombre ILIKE '%nómin%' LIMIT 1);
  cat_otros_ing     uuid := (SELECT id FROM categorias WHERE hogar_id = hid AND tipo = 'ingreso' AND nombre ILIKE '%otro%'  LIMIT 1);

  uid1  uuid := (SELECT id FROM usuarios WHERE hogar_id = hid ORDER BY creado_en LIMIT 1);
  uid2  uuid := (SELECT id FROM usuarios WHERE hogar_id = hid ORDER BY creado_en OFFSET 1 LIMIT 1);
BEGIN

-- ── INGRESOS ──────────────────────────────────────────────────────────────
INSERT INTO movimientos (hogar_id, tipo, importe, fecha, anio, mes, categoria_id, concepto, es_fijo, pendiente, creado_por)
VALUES
  (hid, 'ingreso', 2100.00, '2026-06-02', 2026, 6, cat_nomina,    'Nómina junio - Ángel',  true,  false, uid1),
  (hid, 'ingreso', 1850.00, '2026-06-02', 2026, 6, cat_nomina,    'Nómina junio - Pareja', true,  false, uid2),
  (hid, 'ingreso',  150.00, '2026-06-15', 2026, 6, cat_otros_ing, 'Devolución Hacienda',   false, false, uid1);

-- ── GASTOS FIJOS (pendiente → se cargarán a lo largo del mes) ─────────────
INSERT INTO movimientos (hogar_id, tipo, importe, fecha, anio, mes, categoria_id, concepto, es_fijo, pendiente, creado_por)
VALUES
  (hid, 'gasto',  950.00, '2026-06-01', 2026, 6, cat_vivienda,   'Alquiler junio',        true, false, uid1),
  (hid, 'gasto',   85.00, '2026-06-05', 2026, 6, cat_suministros,'Luz (Endesa)',           true, false, uid1),
  (hid, 'gasto',   42.00, '2026-06-07', 2026, 6, cat_suministros,'Gas (Naturgy)',          true, false, uid1),
  (hid, 'gasto',   38.00, '2026-06-08', 2026, 6, cat_suministros,'Internet + TV (Movistar)',true,false, uid1),
  (hid, 'gasto',   22.50, '2026-06-10', 2026, 6, cat_suministros,'Teléfono móvil (Ángel)', true, false, uid1),
  (hid, 'gasto',   18.00, '2026-06-10', 2026, 6, cat_suministros,'Teléfono móvil (Pareja)',true, false, uid2),
  (hid, 'gasto',  175.00, '2026-06-15', 2026, 6, cat_salud,      'Seguro médico',          true, false, uid1),
  (hid, 'gasto',   13.99, '2026-06-20', 2026, 6, cat_ocio,       'Netflix',                true, false, uid2),
  (hid, 'gasto',    9.99, '2026-06-20', 2026, 6, cat_ocio,       'Spotify familia',        true, false, uid2),
  -- Pendientes (aún no cargados en cuenta)
  (hid, 'gasto',   55.00, '2026-06-25', 2026, 6, cat_suministros,'Agua (Ayuntamiento)',    true, true,  uid1),
  (hid, 'gasto',   28.00, '2026-06-28', 2026, 6, cat_personal,   'Gimnasio (Ángel)',       true, true,  uid1),
  (hid, 'gasto',   28.00, '2026-06-28', 2026, 6, cat_personal,   'Gimnasio (Pareja)',      true, true,  uid2);

-- ── GASTOS VARIABLES ──────────────────────────────────────────────────────
INSERT INTO movimientos (hogar_id, tipo, importe, fecha, anio, mes, categoria_id, concepto, es_fijo, pendiente, creado_por)
VALUES
  -- Alimentación
  (hid, 'gasto',  98.40, '2026-06-02', 2026, 6, cat_aliment,   'Mercadona semana 1',     false, false, uid2),
  (hid, 'gasto',  12.60, '2026-06-03', 2026, 6, cat_aliment,   'Panadería',              false, false, uid2),
  (hid, 'gasto', 105.20, '2026-06-09', 2026, 6, cat_aliment,   'Mercadona semana 2',     false, false, uid2),
  (hid, 'gasto',  18.90, '2026-06-11', 2026, 6, cat_aliment,   'Frutería mercado',       false, false, uid1),
  (hid, 'gasto',  92.70, '2026-06-16', 2026, 6, cat_aliment,   'Mercadona semana 3',     false, false, uid2),
  (hid, 'gasto',  34.50, '2026-06-18', 2026, 6, cat_aliment,   'Lidl (bebidas + snacks)',false, false, uid1),
  (hid, 'gasto',  88.30, '2026-06-23', 2026, 6, cat_aliment,   'Mercadona semana 4',     false, false, uid2),
  -- Transporte
  (hid, 'gasto',  70.00, '2026-06-01', 2026, 6, cat_transporte,'Gasolina',               false, false, uid1),
  (hid, 'gasto',  54.00, '2026-06-08', 2026, 6, cat_transporte,'Abono transporte - junio',true, false, uid2),
  (hid, 'gasto',  14.80, '2026-06-14', 2026, 6, cat_transporte,'Parking centro',         false, false, uid1),
  (hid, 'gasto',  65.00, '2026-06-22', 2026, 6, cat_transporte,'Gasolina',               false, false, uid1),
  -- Ocio y restaurantes
  (hid, 'gasto',  46.00, '2026-06-07', 2026, 6, cat_ocio,      'Cena restaurante',       false, false, uid1),
  (hid, 'gasto',  28.50, '2026-06-13', 2026, 6, cat_ocio,      'Cine + palomitas',       false, false, uid2),
  (hid, 'gasto',  32.00, '2026-06-14', 2026, 6, cat_ocio,      'Brunch sábado',          false, false, uid2),
  (hid, 'gasto',  55.00, '2026-06-20', 2026, 6, cat_ocio,      'Concierto entradas',     false, false, uid1),
  (hid, 'gasto',  18.40, '2026-06-21', 2026, 6, cat_ocio,      'Vermú domingo',          false, false, uid1),
  -- Salud y farmacia
  (hid, 'gasto',  24.60, '2026-06-04', 2026, 6, cat_salud,     'Farmacia',               false, false, uid2),
  (hid, 'gasto',  45.00, '2026-06-17', 2026, 6, cat_salud,     'Dentista revisión',      false, false, uid1),
  -- Personal y cuidado
  (hid, 'gasto',  38.00, '2026-06-12', 2026, 6, cat_personal,  'Peluquería',             false, false, uid2),
  (hid, 'gasto',  62.40, '2026-06-19', 2026, 6, cat_personal,  'Ropa verano (ZARA)',     false, false, uid2),
  (hid, 'gasto',  25.90, '2026-06-10', 2026, 6, cat_personal,  'Corte de pelo',          false, false, uid1),
  -- Hogar
  (hid, 'gasto',  42.00, '2026-06-06', 2026, 6, cat_hogar,     'Limpieza hogar (Mercadona)',false,false,uid2),
  (hid, 'gasto',  89.99, '2026-06-15', 2026, 6, cat_hogar,     'Ikea — organizador baño',false, false, uid1);

RAISE NOTICE 'Seed junio 2026 completado. Movimientos insertados para hogar %', hid;
END $$;
