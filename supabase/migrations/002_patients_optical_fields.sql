-- ============================================================
-- Campos ópticos en prescriptions + dirección/obra social en patients
-- ============================================================

ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS lens_type     text CHECK (lens_type IN ('monofocal','bifocal','progresivo','ocupacional')),
  ADD COLUMN IF NOT EXISTS lens_material text CHECK (lens_material IN ('cr39','policarbonato','trivex','alto_indice_167','alto_indice_174','cristal_mineral')),
  ADD COLUMN IF NOT EXISTS treatments    text[] NOT NULL DEFAULT '{}';

-- issued_by ya existe (médico que recetó) — no se duplica

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS address         text,
  ADD COLUMN IF NOT EXISTS obra_social     text,
  ADD COLUMN IF NOT EXISTS obra_social_num text;
