-- ============================================================
-- OpticWare - Schema inicial
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name   text NOT NULL,
  slug            text UNIQUE NOT NULL,
  logo_url        text,
  primary_color   text NOT NULL DEFAULT '#0F6E56',
  plan            text NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico','pro','cadena')),
  afip_api_key    text,        -- TusFácturas API key (guardada encriptada)
  afip_punto_venta integer,
  whatsapp_phone_id text,      -- Meta Cloud API phone_number_id
  whatsapp_token    text,      -- Meta Cloud API token (guardado encriptado)
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Los tenants solo se pueden leer/modificar desde server-side (service role)
-- La RLS sobre esta tabla la manejan los usuarios vía su tenant_id
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE USING (
    id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- USERS (tabla pública complementaria a auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text NOT NULL,
  role        text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','vendedor','recepcionista')),
  avatar_url  text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  dni         text,
  email       text,
  phone       text,
  birth_date  date,
  notes       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_all" ON patients
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX patients_tenant_idx ON patients(tenant_id);
CREATE INDEX patients_name_idx ON patients(tenant_id, last_name, first_name);

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  issued_by   text,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Ojo derecho (OD)
  od_sphere   numeric(5,2),
  od_cylinder numeric(5,2),
  od_axis     integer CHECK (od_axis BETWEEN 0 AND 180),
  od_addition numeric(5,2),
  od_pd       numeric(5,2),
  -- Ojo izquierdo (OI)
  oi_sphere   numeric(5,2),
  oi_cylinder numeric(5,2),
  oi_axis     integer CHECK (oi_axis BETWEEN 0 AND 180),
  oi_addition numeric(5,2),
  oi_pd       numeric(5,2),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescriptions_all" ON prescriptions
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX prescriptions_patient_idx ON prescriptions(patient_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text NOT NULL CHECK (category IN ('armazones','lentes','contactologia','accesorios','sol','otro')),
  sku         text,
  price       numeric(12,2) NOT NULL DEFAULT 0,
  cost        numeric(12,2),
  stock       integer NOT NULL DEFAULT 0,
  stock_min   integer NOT NULL DEFAULT 5,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_all" ON products
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX products_tenant_idx ON products(tenant_id);
CREATE INDEX products_category_idx ON products(tenant_id, category);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id        uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at      timestamptz NOT NULL,
  duration_minutes  integer NOT NULL DEFAULT 30,
  type              text NOT NULL DEFAULT 'otro'
                    CHECK (type IN ('examen_visual','control','entrega','eleccion','otro')),
  status            text NOT NULL DEFAULT 'pendiente'
                    CHECK (status IN ('pendiente','confirmado','presente','ausente','cancelado')),
  notes             text,
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_all" ON appointments
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX appointments_tenant_date_idx ON appointments(tenant_id, scheduled_at);
CREATE INDEX appointments_patient_idx ON appointments(patient_id);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id      uuid REFERENCES patients(id),
  prescription_id uuid REFERENCES prescriptions(id),
  status          text NOT NULL DEFAULT 'en_proceso'
                  CHECK (status IN ('en_proceso','en_produccion','listo','entregado','cancelado')),
  payment_method  text NOT NULL DEFAULT 'efectivo'
                  CHECK (payment_method IN ('efectivo','transferencia','mercadopago','obra_social','credito','debito')),
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  discount        numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  notes           text,
  invoice_id      uuid, -- se llena después de facturar
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_all" ON sales
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX sales_tenant_idx ON sales(tenant_id);
CREATE INDEX sales_patient_idx ON sales(patient_id);
CREATE INDEX sales_created_at_idx ON sales(tenant_id, created_at DESC);

-- ============================================================
-- SALE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id     uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  quantity    integer NOT NULL DEFAULT 1,
  unit_price  numeric(12,2) NOT NULL,
  subtotal    numeric(12,2) NOT NULL
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_items_all" ON sale_items
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id          uuid REFERENCES sales(id),
  invoice_number   text NOT NULL,
  invoice_type     text NOT NULL CHECK (invoice_type IN ('A','B','C')),
  client_name      text NOT NULL,
  client_cuit      text,
  client_condition text NOT NULL DEFAULT 'consumidor_final',
  includes_iva     boolean NOT NULL DEFAULT true,
  subtotal         numeric(12,2) NOT NULL,
  iva_amount       numeric(12,2) NOT NULL DEFAULT 0,
  total            numeric(12,2) NOT NULL,
  cae              text,
  cae_expiry       date,
  afip_status      text NOT NULL DEFAULT 'borrador'
                   CHECK (afip_status IN ('borrador','pendiente','aprobada','error')),
  afip_error       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_all" ON invoices
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX invoices_tenant_idx ON invoices(tenant_id);
CREATE INDEX invoices_sale_idx ON invoices(sale_id);

-- FK inversa: sales → invoices
ALTER TABLE sales ADD CONSTRAINT fk_sales_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id);

-- ============================================================
-- TRIGGER: auto-crear tenant y user al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_slug      text;
BEGIN
  -- Generar slug único desde el nombre del negocio
  v_slug := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'business_name', 'optica'),
    '[^a-z0-9]', '-', 'g'
  )) || '-' || substring(NEW.id::text, 1, 8);

  -- Crear el tenant
  INSERT INTO public.tenants (business_name, slug)
  VALUES (
    coalesce(NEW.raw_user_meta_data->>'business_name', 'Mi Óptica'),
    v_slug
  )
  RETURNING id INTO v_tenant_id;

  -- Crear el usuario
  INSERT INTO public.users (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_tenant_id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'
  );

  RETURN NEW;
END;
$$;

-- Asociar trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
