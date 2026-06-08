-- ============================================================================
-- finanzas-pareja · seed.sql · v1
-- Ejecutar DESPUÉS de schema.sql y DESPUÉS de crear los 2 usuarios en
-- Supabase → Auth → Users.
--
-- ANTES de ejecutar, sustituye abajo:
--   - u1 / u2  : los User UID reales (Auth → Users → columna "User UID")
--   - email / nombre de cada uno
-- ============================================================================

-- Silenciar los triggers de actividad durante la siembra (evita ruido inicial
-- en la campana). Se reactivan al final.
alter table categorias    disable trigger trg_act_categorias;
alter table subcategorias disable trigger trg_act_subcategorias;

do $$
declare
  v_hogar uuid;
  v_cat   uuid;
  u1 uuid := '00000000-0000-0000-0000-000000000001';  -- TODO: UID real de Ángel
  u2 uuid := '00000000-0000-0000-0000-000000000002';  -- TODO: UID real de la pareja
begin
  -- Hogar compartido.
  insert into hogares (nombre, moneda) values ('Nuestro hogar', 'EUR')
  returning id into v_hogar;

  -- Perfiles enlazados a Auth + al hogar (idioma ES por defecto).
  insert into usuarios (id, email, nombre, hogar_id, idioma) values
    (u1, 'angel@example.com',  'Ángel',  v_hogar, 'es'),   -- TODO: email/nombre reales
    (u2, 'pareja@example.com', 'Pareja', v_hogar, 'es')    -- TODO: email/nombre reales
  on conflict (id) do update
    set hogar_id = excluded.hogar_id,
        email    = excluded.email,
        nombre   = excluded.nombre;

  -- Categorías de GASTO por defecto (editables).
  insert into categorias (hogar_id, nombre, tipo, orden) values
    (v_hogar, 'Vivienda',    'gasto', 1),
    (v_hogar, 'Comida',      'gasto', 2),
    (v_hogar, 'Transporte',  'gasto', 3),
    (v_hogar, 'Ocio',        'gasto', 4),
    (v_hogar, 'Salud',       'gasto', 5),
    (v_hogar, 'Suministros', 'gasto', 6),
    (v_hogar, 'Compras',     'gasto', 7);

  -- Categorías de INGRESO.
  insert into categorias (hogar_id, nombre, tipo, orden) values
    (v_hogar, 'Nómina',         'ingreso', 1),
    (v_hogar, 'Otros ingresos', 'ingreso', 2);

  -- Subcategorías de ejemplo: Comida.
  select id into v_cat from categorias
    where hogar_id = v_hogar and nombre = 'Comida' limit 1;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Súper',        1),
    (v_cat, v_hogar, 'Restaurantes', 2);

  -- Subcategorías de ejemplo: Transporte.
  select id into v_cat from categorias
    where hogar_id = v_hogar and nombre = 'Transporte' limit 1;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Gasolina',           1),
    (v_cat, v_hogar, 'Transporte público', 2);
end $$;

-- Reactivar los triggers de actividad.
alter table categorias    enable trigger trg_act_categorias;
alter table subcategorias enable trigger trg_act_subcategorias;
