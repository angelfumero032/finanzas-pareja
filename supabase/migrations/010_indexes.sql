-- Migration 010: Índices de optimización
-- Ejecutar en Supabase → SQL Editor (después de 009).
-- Todas las operaciones son idempotentes (IF NOT EXISTS).
-- No modifica datos ni estructura de tablas.

-- S1: Índice parcial para movimientos confirmados (pendiente = false).
--     Mejora loadYearData (vista anual) y cualquier consulta que filtre pendientes.
CREATE INDEX IF NOT EXISTS idx_movimientos_confirmados
  ON movimientos(hogar_id, anio, mes)
  WHERE pendiente = false;

-- S2: Búsqueda de texto completo con trigramas (BusquedaGlobal usa ilike('%...%')).
--     pg_trgm convierte el ilike en un index scan en lugar de full scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_movimientos_concepto_trgm
  ON movimientos USING gin(concepto gin_trgm_ops);

-- S3: Historial de aportes ordenado por fecha — evita ordenar en memoria.
--     Mejora la carga de AhorroSection.
DROP INDEX IF EXISTS idx_aportes_hogar;  -- reemplaza el índice simple por uno compuesto
CREATE INDEX IF NOT EXISTS idx_aportes_hogar_fecha
  ON ahorro_aportes(hogar_id, fecha DESC);

-- S5: Búsqueda por entidad_id en actividad — necesario para Z1 (navegar al movimiento).
CREATE INDEX IF NOT EXISTS idx_actividad_entidad_id
  ON actividad(entidad_id)
  WHERE entidad_id IS NOT NULL;
