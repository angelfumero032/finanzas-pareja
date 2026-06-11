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
