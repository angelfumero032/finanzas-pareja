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
