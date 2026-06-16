-- ============================================================
-- Creación de tabla obras_sociales y campos ópticos/obra_social en patients y prescriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS obras_sociales (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  code             text,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  copago           numeric(12,2) NOT NULL DEFAULT 0,
  notes            text,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE obras_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obras_sociales_all" ON obras_sociales
  USING (tenant_id = public.get_auth_user_tenant());

CREATE INDEX IF NOT EXISTS obras_sociales_tenant_idx ON obras_sociales(tenant_id);

ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS lens_type     text CHECK (lens_type IN ('monofocal','bifocal','progresivo','ocupacional')),
  ADD COLUMN IF NOT EXISTS lens_material text CHECK (lens_material IN ('cr39','policarbonato','trivex','alto_indice_167','alto_indice_174','cristal_mineral')),
  ADD COLUMN IF NOT EXISTS treatments    text[] NOT NULL DEFAULT '{}';

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS address         text,
  ADD COLUMN IF NOT EXISTS obra_social_id  uuid REFERENCES obras_sociales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS obra_social_num text;
