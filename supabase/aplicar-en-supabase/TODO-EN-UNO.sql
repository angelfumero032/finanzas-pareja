-- ============================================================
-- FINANZAS-PAREJA: TODAS LAS MIGRACIONES PENDIENTES (005 a 014)
-- Pegar ESTE ARCHIVO COMPLETO en Supabase SQL Editor y pulsar Run.
-- Es idempotente: si algo ya estaba aplicado, no pasa nada.
-- Generado: 2026-06-11
-- ============================================================

-- ────────────────────────── 005_presupuestos_subcat ──────────────────────────
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

-- ────────────────────────── 006_plantillas_frecuencia ──────────────────────────
-- Migration 006: Añadir frecuencia a plantillas_fijas
-- Permite gastos recurrentes con periodicidad mensual, bimestral, trimestral, semestral o anual.
-- mes_inicio: 1-12; el gasto se genera en meses cuya distancia desde mes_inicio es múltiplo de la frecuencia.

alter table plantillas_fijas
  add column if not exists frecuencia text not null default 'mensual'
    check (frecuencia in ('mensual','bimestral','trimestral','semestral','anual')),
  add column if not exists mes_inicio int not null default 1
    check (mes_inicio between 1 and 12);

comment on column plantillas_fijas.frecuencia is
  'Periodicidad: mensual | bimestral (c/2m) | trimestral (c/3m) | semestral (c/6m) | anual (c/12m)';
comment on column plantillas_fijas.mes_inicio is
  'Mes de referencia (1-12) a partir del cual se calcula el ciclo de frecuencia';

-- ────────────────────────── 007_cat_emoji ──────────────────────────
-- Migration 007: Añadir campo icono (emoji) a categorías
alter table categorias
  add column if not exists icono text;

comment on column categorias.icono is
  'Emoji o icono corto (1-2 caracteres) para identificar visualmente la categoría';

-- ────────────────────────── 008_efectivo ──────────────────────────
-- Migration 008 (v2): Campo metodo de pago en movimientos
-- Valores: tarjeta | efectivo | transferencia | bizum
-- Idempotente: se puede ejecutar varias veces sin romper nada.

ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS metodo_pago text NOT NULL DEFAULT 'tarjeta';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movimientos_metodo_pago_check'
  ) THEN
    ALTER TABLE movimientos DROP CONSTRAINT movimientos_metodo_pago_check;
  END IF;
  ALTER TABLE movimientos ADD CONSTRAINT movimientos_metodo_pago_check
    CHECK (metodo_pago IN ('tarjeta', 'efectivo', 'transferencia', 'bizum'));
END $$;

-- ────────────────────────── 009_default_categories ──────────────────────────
-- Migration 009 (v2): Categorias y subcategorias por defecto
-- Reescrita para funcionar desde el SQL Editor (la version anterior usaba
-- auth.uid(), que es NULL en el editor y fallaba siempre).
-- Se aplica a TODOS los hogares existentes. Idempotente: solo inserta lo
-- que no exista ya (por nombre). No modifica ni borra nada.

DO $$
DECLARE
  hid uuid;
  cid uuid;
  c record;
  s record;
BEGIN
  FOR hid IN SELECT id FROM hogares LOOP

    FOR c IN
      SELECT * FROM (VALUES
        ('Hogar',                    'gasto',   '#6366f1', 1),
        ('Alimentación',             'gasto',   '#f59e0b', 2),
        ('Transporte',               'gasto',   '#14b8a6', 3),
        ('Salud',                    'gasto',   '#10b981', 4),
        ('Ocio y entretenimiento',   'gasto',   '#8b5cf6', 5),
        ('Ropa y calzado',           'gasto',   '#ec4899', 6),
        ('Suscripciones',            'gasto',   '#6366f1', 7),
        ('Cuidado personal',         'gasto',   '#f97316', 8),
        ('Gastos inesperados',       'gasto',   '#ef4444', 9),
        ('Gastos extra programados', 'gasto',   '#84cc16', 10),
        ('Educación y formación',    'gasto',   '#64748b', 11),
        ('Trabajo y negocio',        'gasto',   '#0ea5e9', 12),
        ('Otros',                    'gasto',   '#94a3b8', 99),
        ('Ingresos extra',           'ingreso', '#10b981', 1)
      ) AS t(nombre, tipo, color, orden)
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM categorias
        WHERE hogar_id = hid AND nombre = c.nombre AND tipo = c.tipo
      ) THEN
        INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
        VALUES (hid, c.nombre, c.tipo, c.color, c.orden);
      END IF;
    END LOOP;

    FOR s IN
      SELECT * FROM (VALUES
        ('Hogar', 'Alquiler / Hipoteca', 1),
        ('Hogar', 'Electricidad', 2),
        ('Hogar', 'Agua', 3),
        ('Hogar', 'Gas', 4),
        ('Hogar', 'Internet', 5),
        ('Hogar', 'Limpieza', 6),
        ('Hogar', 'Mantenimiento', 7),
        ('Alimentación', 'Supermercado', 1),
        ('Alimentación', 'Restaurantes', 2),
        ('Alimentación', 'Comida a domicilio', 3),
        ('Alimentación', 'Cafeterías', 4),
        ('Transporte', 'Gasolina', 1),
        ('Transporte', 'Transporte público', 2),
        ('Transporte', 'Taxi / VTC', 3),
        ('Transporte', 'Seguro coche', 4),
        ('Transporte', 'Parking', 5),
        ('Transporte', 'Mantenimiento coche', 6),
        ('Salud', 'Farmacia', 1),
        ('Salud', 'Médico / Dentista', 2),
        ('Salud', 'Seguro médico', 3),
        ('Salud', 'Gimnasio', 4),
        ('Ocio y entretenimiento', 'Salidas y bares', 1),
        ('Ocio y entretenimiento', 'Viajes', 2),
        ('Ocio y entretenimiento', 'Cine / Espectáculos', 3),
        ('Ocio y entretenimiento', 'Libros y cultura', 4),
        ('Ocio y entretenimiento', 'Hobbies', 5),
        ('Suscripciones', 'Streaming (Netflix, etc.)', 1),
        ('Suscripciones', 'Música (Spotify, etc.)', 2),
        ('Suscripciones', 'Apps y software', 3),
        ('Suscripciones', 'Almacenamiento en la nube', 4),
        ('Suscripciones', 'Periódicos y revistas', 5),
        ('Cuidado personal', 'Peluquería', 1),
        ('Cuidado personal', 'Cosmética y cuidado', 2),
        ('Cuidado personal', 'Depilación / Estética', 3),
        ('Gastos inesperados', 'Reparaciones', 1),
        ('Gastos inesperados', 'Multas', 2),
        ('Gastos inesperados', 'Médico urgente', 3),
        ('Gastos extra programados', 'Vacaciones', 1),
        ('Gastos extra programados', 'Regalos', 2),
        ('Gastos extra programados', 'Navidad', 3),
        ('Gastos extra programados', 'Cumpleaños', 4),
        ('Gastos extra programados', 'Eventos especiales', 5),
        ('Educación y formación', 'Cursos y formación', 1),
        ('Educación y formación', 'Material escolar', 2),
        ('Educación y formación', 'Libros de texto', 3)
      ) AS t(cat_nombre, sub_nombre, orden)
    LOOP
      SELECT id INTO cid FROM categorias
      WHERE hogar_id = hid AND nombre = s.cat_nombre AND tipo = 'gasto'
      LIMIT 1;
      IF cid IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM subcategorias
        WHERE categoria_id = cid AND nombre = s.sub_nombre
      ) THEN
        INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden)
        VALUES (hid, cid, s.sub_nombre, s.orden);
      END IF;
    END LOOP;

  END LOOP;
END $$;

-- ────────────────────────── 010_indexes ──────────────────────────
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

-- ────────────────────────── 011_notas_mes ──────────────────────────
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

-- ────────────────────────── 012_meta_ahorro ──────────────────────────
-- Migration 012: Meta de ahorro mensual compartida (U7)
-- Mueve la meta de ahorro de localStorage (solo en un dispositivo) a la BD (compartida por la pareja).
-- Ejecutar en Supabase → SQL Editor (después de 011).
-- Idempotente: ADD COLUMN IF NOT EXISTS.

ALTER TABLE hogares
  ADD COLUMN IF NOT EXISTS meta_ahorro numeric CHECK (meta_ahorro IS NULL OR meta_ahorro > 0);

-- Notas de uso:
-- - NULL significa "sin meta definida" (comportamiento actual, sin romper nada)
-- - El frontend (AhorroSection.jsx) debe leer hogares.meta_ahorro en lugar de
--   localStorage.getItem(`savings_goal_${hogarId}`) para que ambos usuarios del
--   hogar vean y editen la misma meta.
-- - La columna está protegida por la RLS existente de hogares
--   (hogares_select + hogares_update usan mi_hogar()), no hace falta política nueva.

-- ────────────────────────── 013_plantillas_mejoras ──────────────────────────
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

-- ────────────────────────── 014_archivos_storage ──────────────────────────
-- Migration 014: Zona de archivos del hogar (Supabase Storage)
-- Crea el bucket privado 'archivos' y las politicas de acceso por hogar:
-- cada hogar solo ve/sube/borra dentro de su carpeta `<hogar_id>/...`.
-- Idempotente. Si da error "must be owner of table objects", crear las
-- politicas desde el dashboard (Storage -> Policies) con las mismas reglas.

INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos', 'archivos', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_select'
  ) THEN
    CREATE POLICY archivos_select ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_insert'
  ) THEN
    CREATE POLICY archivos_insert ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_update'
  ) THEN
    CREATE POLICY archivos_update ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_delete'
  ) THEN
    CREATE POLICY archivos_delete ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;
END $$;
