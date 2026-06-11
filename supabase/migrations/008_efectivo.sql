-- Migration 008: Campo método de pago (tarjeta / efectivo)
-- Permite distinguir gastos e ingresos en efectivo de los digitales/tarjeta.

alter table movimientos
  add column if not exists metodo_pago text not null default 'tarjeta'
    check (metodo_pago in ('tarjeta', 'efectivo'));

comment on column movimientos.metodo_pago is
  'Método de pago: tarjeta (digital) | efectivo. Default tarjeta para no romper datos existentes.';
