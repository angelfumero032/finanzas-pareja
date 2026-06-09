-- ============================================================================
-- finanzas-pareja · seed_extra.sql
-- Añade categorías y subcategorías que falten al hogar ya existente.
-- Idempotente: no duplica ni modifica lo ya existente.
-- NO toca usuarios, movimientos ni presupuestos existentes.
--
-- Ejecutar en Supabase → SQL Editor (solo una vez en producción).
-- ============================================================================

alter table categorias    disable trigger trg_act_categorias;
alter table subcategorias disable trigger trg_act_subcategorias;

do $$
declare
  v_hogar uuid;
  v_cat   uuid;
begin
  -- Hogar existente (único hogar en la BD)
  select id into v_hogar from hogares limit 1;

  if v_hogar is null then
    raise exception 'No se encontró ningún hogar. Ejecuta seed.sql primero.';
  end if;

  -- ── Categorías de GASTO: añadir solo las que falten ──────────────────────

  insert into categorias (hogar_id, nombre, tipo, orden)
  select v_hogar, nombre, 'gasto', orden
  from (values
    ('Vivienda',     1),
    ('Suministros',  2),
    ('Comida',       3),
    ('Transporte',   4),
    ('Salud',        5),
    ('Ocio',         6),
    ('Compras',      7),
    ('Mascotas',     8),
    ('Educación',    9),
    ('Hijos',       10),
    ('Imprevistos', 11),
    ('Personal',    12)
  ) as nuevas(nombre, orden)
  where not exists (
    select 1 from categorias c
    where c.hogar_id = v_hogar and lower(c.nombre) = lower(nuevas.nombre) and c.tipo = 'gasto'
  );

  -- ── Categorías de INGRESO: añadir solo las que falten ────────────────────

  insert into categorias (hogar_id, nombre, tipo, orden)
  select v_hogar, nombre, 'ingreso', orden
  from (values
    ('Nómina',          1),
    ('Extra/Bonus',     2),
    ('Otros ingresos',  3)
  ) as nuevas(nombre, orden)
  where not exists (
    select 1 from categorias c
    where c.hogar_id = v_hogar and lower(c.nombre) = lower(nuevas.nombre) and c.tipo = 'ingreso'
  );

  -- ── Subcategorías por categoría ──────────────────────────────────────────

  -- Vivienda
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'vivienda' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Alquiler/Hipoteca', 1), ('Comunidad', 2), ('Seguro hogar', 3),
      ('Reparación/Mant.', 4), ('Limpieza hogar', 5)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

  -- Suministros
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'suministros' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Luz', 1), ('Agua', 2), ('Gas', 3), ('Internet', 4), ('Móvil', 5), ('TV/Plataformas', 6)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

  -- Comida
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'comida' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Súper', 1), ('Restaurantes', 2), ('Café', 3), ('A domicilio', 4), ('Frutería/Mercado', 5)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

  -- Transporte
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'transporte' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Gasolina', 1), ('Parking', 2), ('Bus/Metro/Tren', 3),
      ('Taxi/Uber', 4), ('Peaje', 5), ('ITV/Revisión', 6)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

  -- Salud
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'salud' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Farmacia', 1), ('Médico/Especialista', 2), ('Dentista', 3),
      ('Gimnasio', 4), ('Óptica', 5)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

  -- Ocio
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'ocio' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Cine/Teatro', 1), ('Suscripciones', 2), ('Viajes', 3),
      ('Hobby/Afición', 4), ('Deporte', 5), ('Bares/Salidas', 6)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

  -- Compras
  select id into v_cat from categorias where hogar_id = v_hogar and lower(nombre) = 'compras' and tipo = 'gasto' limit 1;
  if v_cat is not null then
    insert into subcategorias (categoria_id, hogar_id, nombre, orden)
    select v_cat, v_hogar, nombre, orden
    from (values
      ('Ropa', 1), ('Calzado', 2), ('Hogar/Decoración', 3),
      ('Tecnología', 4), ('Regalos', 5)
    ) as s(nombre, orden)
    where not exists (
      select 1 from subcategorias x where x.categoria_id = v_cat and lower(x.nombre) = lower(s.nombre)
    );
  end if;

end $$;

alter table categorias    enable trigger trg_act_categorias;
alter table subcategorias enable trigger trg_act_subcategorias;
