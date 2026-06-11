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
