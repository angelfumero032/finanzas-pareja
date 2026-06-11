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
