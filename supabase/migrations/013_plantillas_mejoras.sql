-- Migration 013: Mejoras en plantillas_fijas (Z4 + D2)
-- Z4: añade método de pago por defecto a cada plantilla
-- D2: añade tipo (gasto / ingreso) para poder crear plantillas de ingresos
-- Ejecutar en Supabase → SQL Editor (después de 012).
-- Idempotente: ADD COLUMN IF NOT EXISTS.

-- Z4: método de pago (por defecto tarjeta, igual que los movimientos nuevos)
ALTER TABLE plantillas_fijas
  ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'tarjeta'
  CHECK (metodo_pago IN ('tarjeta', 'efectivo', 'transferencia', 'bizum'));

-- D2: tipo de movimiento que genera la plantilla (por defecto gasto)
ALTER TABLE plantillas_fijas
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'gasto'
  CHECK (tipo IN ('gasto', 'ingreso'));

-- Notas de uso:
-- - metodo_pago: al generar el movimiento desde la plantilla, se traspasa
--   al campo metodo_pago del movimiento generado.
-- - tipo: PlantillasModal.jsx línea 51 filtra `c.tipo === 'gasto'` en las
--   categorías mostradas. Con este campo se puede mostrar también categorías
--   de ingreso cuando tipo = 'ingreso'.
