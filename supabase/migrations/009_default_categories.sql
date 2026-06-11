-- Migration 009: Categorías y subcategorías por defecto
-- Ejecutar en Supabase SQL Editor.
-- Solo inserta categorías que NO existan ya (por nombre) en vuestro hogar.
-- No modifica ni borra datos existentes.

DO $$
DECLARE
  hid uuid;
  -- IDs de categorías principales
  cat_hogar uuid; cat_alimentacion uuid; cat_transporte uuid; cat_salud uuid;
  cat_ocio uuid; cat_ropa uuid; cat_suscripciones uuid; cat_cuidado uuid;
  cat_inesperados uuid; cat_extras uuid; cat_educacion uuid; cat_trabajo uuid;
  cat_ingresos_extra uuid; cat_otros uuid;
BEGIN
  -- Obtener el hogar_id del usuario actual
  SELECT hogar_id INTO hid FROM usuarios WHERE id = auth.uid() LIMIT 1;
  IF hid IS NULL THEN RAISE EXCEPTION 'No se encontró hogar para este usuario'; END IF;

  -- Insertar categorías de GASTO (solo si no existen por nombre)
  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Hogar', 'gasto', '#6366f1', 1)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_hogar;
  IF cat_hogar IS NULL THEN SELECT id INTO cat_hogar FROM categorias WHERE hogar_id=hid AND nombre='Hogar' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Alimentación', 'gasto', '#f59e0b', 2)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_alimentacion;
  IF cat_alimentacion IS NULL THEN SELECT id INTO cat_alimentacion FROM categorias WHERE hogar_id=hid AND nombre='Alimentación' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Transporte', 'gasto', '#14b8a6', 3)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_transporte;
  IF cat_transporte IS NULL THEN SELECT id INTO cat_transporte FROM categorias WHERE hogar_id=hid AND nombre='Transporte' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Salud', 'gasto', '#10b981', 4)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_salud;
  IF cat_salud IS NULL THEN SELECT id INTO cat_salud FROM categorias WHERE hogar_id=hid AND nombre='Salud' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Ocio y entretenimiento', 'gasto', '#8b5cf6', 5)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_ocio;
  IF cat_ocio IS NULL THEN SELECT id INTO cat_ocio FROM categorias WHERE hogar_id=hid AND nombre='Ocio y entretenimiento' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Ropa y calzado', 'gasto', '#ec4899', 6)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_ropa;
  IF cat_ropa IS NULL THEN SELECT id INTO cat_ropa FROM categorias WHERE hogar_id=hid AND nombre='Ropa y calzado' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Suscripciones', 'gasto', '#6366f1', 7)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_suscripciones;
  IF cat_suscripciones IS NULL THEN SELECT id INTO cat_suscripciones FROM categorias WHERE hogar_id=hid AND nombre='Suscripciones' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Cuidado personal', 'gasto', '#f97316', 8)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_cuidado;
  IF cat_cuidado IS NULL THEN SELECT id INTO cat_cuidado FROM categorias WHERE hogar_id=hid AND nombre='Cuidado personal' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Gastos inesperados', 'gasto', '#ef4444', 9)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_inesperados;
  IF cat_inesperados IS NULL THEN SELECT id INTO cat_inesperados FROM categorias WHERE hogar_id=hid AND nombre='Gastos inesperados' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Gastos extra programados', 'gasto', '#84cc16', 10)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_extras;
  IF cat_extras IS NULL THEN SELECT id INTO cat_extras FROM categorias WHERE hogar_id=hid AND nombre='Gastos extra programados' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Educación y formación', 'gasto', '#64748b', 11)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_educacion;
  IF cat_educacion IS NULL THEN SELECT id INTO cat_educacion FROM categorias WHERE hogar_id=hid AND nombre='Educación y formación' AND tipo='gasto' LIMIT 1; END IF;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Trabajo y negocio', 'gasto', '#0ea5e9', 12)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_trabajo;
  IF cat_trabajo IS NULL THEN SELECT id INTO cat_trabajo FROM categorias WHERE hogar_id=hid AND nombre='Trabajo y negocio' AND tipo='gasto' LIMIT 1; END IF;

  -- Categorías de INGRESO
  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Ingresos extra', 'ingreso', '#10b981', 1)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_ingresos_extra;

  INSERT INTO categorias (hogar_id, nombre, tipo, color, orden)
  VALUES (hid, 'Otros', 'gasto', '#94a3b8', 99)
  ON CONFLICT DO NOTHING RETURNING id INTO cat_otros;

  -- ── Subcategorías ──────────────────────────────────────────────────
  -- Hogar
  IF cat_hogar IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_hogar, 'Alquiler / Hipoteca', 1),
      (hid, cat_hogar, 'Electricidad', 2),
      (hid, cat_hogar, 'Agua', 3),
      (hid, cat_hogar, 'Gas', 4),
      (hid, cat_hogar, 'Internet', 5),
      (hid, cat_hogar, 'Limpieza', 6),
      (hid, cat_hogar, 'Mantenimiento', 7)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Alimentación
  IF cat_alimentacion IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_alimentacion, 'Supermercado', 1),
      (hid, cat_alimentacion, 'Restaurantes', 2),
      (hid, cat_alimentacion, 'Comida a domicilio', 3),
      (hid, cat_alimentacion, 'Cafeterías', 4)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Transporte
  IF cat_transporte IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_transporte, 'Gasolina', 1),
      (hid, cat_transporte, 'Transporte público', 2),
      (hid, cat_transporte, 'Taxi / VTC', 3),
      (hid, cat_transporte, 'Seguro coche', 4),
      (hid, cat_transporte, 'Parking', 5),
      (hid, cat_transporte, 'Mantenimiento coche', 6)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Salud
  IF cat_salud IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_salud, 'Farmacia', 1),
      (hid, cat_salud, 'Médico / Dentista', 2),
      (hid, cat_salud, 'Seguro médico', 3),
      (hid, cat_salud, 'Gimnasio', 4)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Ocio
  IF cat_ocio IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_ocio, 'Salidas y bares', 1),
      (hid, cat_ocio, 'Viajes', 2),
      (hid, cat_ocio, 'Cine / Espectáculos', 3),
      (hid, cat_ocio, 'Libros y cultura', 4),
      (hid, cat_ocio, 'Hobbies', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Suscripciones
  IF cat_suscripciones IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_suscripciones, 'Streaming (Netflix, etc.)', 1),
      (hid, cat_suscripciones, 'Música (Spotify, etc.)', 2),
      (hid, cat_suscripciones, 'Apps y software', 3),
      (hid, cat_suscripciones, 'Almacenamiento en la nube', 4),
      (hid, cat_suscripciones, 'Periódicos y revistas', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Cuidado personal
  IF cat_cuidado IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_cuidado, 'Peluquería', 1),
      (hid, cat_cuidado, 'Cosmética y cuidado', 2),
      (hid, cat_cuidado, 'Depilación / Estética', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gastos inesperados
  IF cat_inesperados IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_inesperados, 'Reparaciones', 1),
      (hid, cat_inesperados, 'Multas', 2),
      (hid, cat_inesperados, 'Médico urgente', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gastos extra programados
  IF cat_extras IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_extras, 'Vacaciones', 1),
      (hid, cat_extras, 'Regalos', 2),
      (hid, cat_extras, 'Navidad', 3),
      (hid, cat_extras, 'Cumpleaños', 4),
      (hid, cat_extras, 'Eventos especiales', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Educación
  IF cat_educacion IS NOT NULL THEN
    INSERT INTO subcategorias (hogar_id, categoria_id, nombre, orden) VALUES
      (hid, cat_educacion, 'Cursos y formación', 1),
      (hid, cat_educacion, 'Material escolar', 2),
      (hid, cat_educacion, 'Libros de texto', 3)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
