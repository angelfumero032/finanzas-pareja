-- ============================================================================
-- seed_categorias_rich.sql
-- Categorías y subcategorías ampliadas para hogar español.
-- OPCIONAL: aplica si quieres reemplazar las categorías por defecto con
-- una clasificación más completa.
--
-- ⚠ ANTES: asegúrate de que la tabla categorias está vacía o archiva las
--   existentes manualmente desde la app.
-- ============================================================================

do $$
declare
  v_hogar uuid;
  v_cat   uuid;
begin
  -- Obtener el hogar existente (asume que solo hay uno)
  select id into v_hogar from hogares limit 1;
  if v_hogar is null then
    raise exception 'No se encontró ningún hogar. Ejecuta seed.sql primero.';
  end if;

  -- Archivar categorías de gasto existentes (no las borramos para no romper FKs)
  update categorias set archivada = true
    where hogar_id = v_hogar and tipo = 'gasto';

  -- ── CATEGORÍAS DE GASTO ──────────────────────────────────────────────
  -- 1. Vivienda (fijos)
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Vivienda', 'gasto', '#6366f1', 1)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Alquiler / hipoteca', 1),
    (v_cat, v_hogar, 'Comunidad de vecinos', 2),
    (v_cat, v_hogar, 'Seguro de hogar',     3),
    (v_cat, v_hogar, 'IBI / Impuestos',     4),
    (v_cat, v_hogar, 'Reparaciones',        5);

  -- 2. Suministros (fijos)
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Suministros', 'gasto', '#14b8a6', 2)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Electricidad', 1),
    (v_cat, v_hogar, 'Gas',          2),
    (v_cat, v_hogar, 'Agua',         3),
    (v_cat, v_hogar, 'Internet',     4),
    (v_cat, v_hogar, 'Teléfono móvil',5);

  -- 3. Alimentación (variable)
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Alimentación', 'gasto', '#10b981', 3)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Supermercado',  1),
    (v_cat, v_hogar, 'Mercado',       2),
    (v_cat, v_hogar, 'Restaurantes',  3),
    (v_cat, v_hogar, 'Comida a domicilio', 4),
    (v_cat, v_hogar, 'Cafeterías',    5);

  -- 4. Transporte (mixto)
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Transporte', 'gasto', '#f59e0b', 4)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Gasolina',              1),
    (v_cat, v_hogar, 'Transporte público',    2),
    (v_cat, v_hogar, 'Parking / Peajes',      3),
    (v_cat, v_hogar, 'Mantenimiento coche',   4),
    (v_cat, v_hogar, 'Seguro coche',          5),
    (v_cat, v_hogar, 'Taxi / VTC',            6);

  -- 5. Salud
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Salud', 'gasto', '#ef4444', 5)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Farmacia',        1),
    (v_cat, v_hogar, 'Médico privado',  2),
    (v_cat, v_hogar, 'Dentista',        3),
    (v_cat, v_hogar, 'Seguro médico',   4),
    (v_cat, v_hogar, 'Óptica',          5);

  -- 6. Ocio & entretenimiento
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Ocio', 'gasto', '#ec4899', 6)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Suscripciones streaming', 1),
    (v_cat, v_hogar, 'Cine / Teatro / Música',  2),
    (v_cat, v_hogar, 'Deportes',                3),
    (v_cat, v_hogar, 'Libros / Medios',         4),
    (v_cat, v_hogar, 'Hobbies',                 5),
    (v_cat, v_hogar, 'Juegos',                  6);

  -- 7. Viajes & vacaciones
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Viajes', 'gasto', '#8b5cf6', 7)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Vuelos',          1),
    (v_cat, v_hogar, 'Alojamiento',     2),
    (v_cat, v_hogar, 'Actividades',     3),
    (v_cat, v_hogar, 'Comida viaje',    4);

  -- 8. Hogar & Compras
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Hogar & Compras', 'gasto', '#f97316', 8)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Muebles / Decoración', 1),
    (v_cat, v_hogar, 'Electrodomésticos',    2),
    (v_cat, v_hogar, 'Limpieza / Droguería', 3),
    (v_cat, v_hogar, 'Ropa / Zapatos',       4),
    (v_cat, v_hogar, 'Tecnología',           5);

  -- 9. Personal & Cuidado
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Personal', 'gasto', '#a78bfa', 9)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Peluquería / Estética', 1),
    (v_cat, v_hogar, 'Gimnasio / Fitness',    2),
    (v_cat, v_hogar, 'Farmacia personal',     3);

  -- 10. Educación
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Educación', 'gasto', '#fb923c', 10)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Matrícula / Cuotas', 1),
    (v_cat, v_hogar, 'Material / Libros',  2),
    (v_cat, v_hogar, 'Cursos / Formación', 3);

  -- 11. Mascotas
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Mascotas', 'gasto', '#84cc16', 11)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Veterinario',       1),
    (v_cat, v_hogar, 'Comida / Higiene',  2),
    (v_cat, v_hogar, 'Seguro mascota',    3);

  -- 12. Ahorro & Inversiones
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Ahorro & Inversiones', 'gasto', '#22d3ee', 12)
    returning id into v_cat;
  insert into subcategorias (categoria_id, hogar_id, nombre, orden) values
    (v_cat, v_hogar, 'Fondo emergencia',  1),
    (v_cat, v_hogar, 'Inversiones',       2),
    (v_cat, v_hogar, 'Plan de pensiones', 3);

  -- 13. Otros gastos
  insert into categorias (hogar_id, nombre, tipo, color, orden)
    values (v_hogar, 'Otros gastos', 'gasto', '#94a3b8', 13);

  -- ── CATEGORÍAS DE INGRESO ─────────────────────────────────────────────
  -- Archivar ingresos existentes si quieres reemplazarlos
  -- (comentado para no borrar por defecto)
  -- update categorias set archivada = true where hogar_id = v_hogar and tipo = 'ingreso';

  -- Solo añadimos si no hay ingresos activos
  if not exists (select 1 from categorias where hogar_id = v_hogar and tipo = 'ingreso' and archivada = false) then
    insert into categorias (hogar_id, nombre, tipo, color, orden) values
      (v_hogar, 'Nómina',              'ingreso', '#22c55e', 1),
      (v_hogar, 'Trabajo freelance',   'ingreso', '#4ade80', 2),
      (v_hogar, 'Inversiones',         'ingreso', '#86efac', 3),
      (v_hogar, 'Alquiler recibido',   'ingreso', '#a7f3d0', 4),
      (v_hogar, 'Otros ingresos',      'ingreso', '#6ee7b7', 5);
  end if;

end $$;
