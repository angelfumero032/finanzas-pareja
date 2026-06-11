-- Migration 011: Notas compartidas del mes (V1)
-- Tabla para que la pareja anote contexto en cada período (vacaciones, gasto extra, etc.)
-- Ejecutar en Supabase → SQL Editor (después de 010).
-- Idempotente: IF NOT EXISTS en tabla y políticas.

CREATE TABLE IF NOT EXISTS notas_mes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  hogar_id    uuid        NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  anio        int         NOT NULL,
  mes         int         NOT NULL CHECK (mes BETWEEN 1 AND 12),
  texto       text        NOT NULL DEFAULT '',
  actualizado_en timestamptz DEFAULT now(),
  UNIQUE (hogar_id, anio, mes)
);

ALTER TABLE notas_mes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notas_mes' AND policyname = 'notas_select'
  ) THEN
    CREATE POLICY notas_select ON notas_mes
      FOR SELECT USING (hogar_id = mi_hogar());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notas_mes' AND policyname = 'notas_write'
  ) THEN
    CREATE POLICY notas_write ON notas_mes
      FOR ALL USING (hogar_id = mi_hogar()) WITH CHECK (hogar_id = mi_hogar());
  END IF;
END $$;

-- Índice para carga rápida de la nota del mes actual
CREATE INDEX IF NOT EXISTS idx_notas_mes_hogar ON notas_mes (hogar_id, anio, mes);
