-- ============================================================================
-- finanzas-pareja · migration 001 · add concepto to movimientos
-- Ejecutar en Supabase → SQL Editor (idempotente).
-- ============================================================================

-- 1) Añadir columna concepto (texto libre, opcional)
alter table movimientos add column if not exists concepto text;

-- 2) Índice para búsquedas rápidas por concepto
create index if not exists idx_movimientos_concepto on movimientos using gin(to_tsvector('spanish', coalesce(concepto, '')));

-- 3) Actualizar trigger de actividad para incluir concepto en el resumen
create or replace function registrar_actividad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion  text;
  v_entidad text;
  v_rec     record;
  v_cat     text;
  v_imp     text;
begin
  if    (tg_op = 'INSERT') then v_accion := 'crear';
  elsif (tg_op = 'UPDATE') then v_accion := 'editar';
  else                          v_accion := 'borrar';
  end if;

  if (tg_op = 'DELETE') then v_rec := old; else v_rec := new; end if;

  if (tg_table_name = 'movimientos') then
    v_entidad := 'movimiento';
    select nombre into v_cat from categorias where id = v_rec.categoria_id;
    v_imp := replace(trim(to_char(v_rec.importe, 'FM999999990.00')), '.', ',');
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' ' || v_rec.tipo
        || ' ' || coalesce(v_rec.concepto, coalesce(v_cat, '(sin categoría)'))
        || ' ' || v_imp || ' €',
      to_jsonb(v_rec)
    );
  elsif (tg_table_name = 'categorias') then
    v_entidad := 'categoria';
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' categoría ' || coalesce(v_rec.nombre, ''),
      to_jsonb(v_rec)
    );
  elsif (tg_table_name = 'subcategorias') then
    v_entidad := 'subcategoria';
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' subcategoría ' || coalesce(v_rec.nombre, ''),
      to_jsonb(v_rec)
    );
  elsif (tg_table_name = 'presupuestos') then
    v_entidad := 'presupuesto';
    select nombre into v_cat from categorias where id = v_rec.categoria_id;
    v_imp := replace(trim(to_char(v_rec.importe, 'FM999999990.00')), '.', ',');
    insert into actividad (hogar_id, actor_id, accion, entidad, entidad_id, resumen, payload)
    values (
      v_rec.hogar_id, auth.uid(), v_accion, v_entidad, v_rec.id,
      initcap(v_accion) || ' presupuesto ' || coalesce(v_cat, '') || ' '
        || v_rec.mes || '/' || v_rec.anio || ' ' || v_imp || ' €',
      to_jsonb(v_rec)
    );
  end if;

  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;
