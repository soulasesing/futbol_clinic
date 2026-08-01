-- Public academy landing pages, announcements and pricing.
-- Rollback: drop landing_pricing_plans, landing_posts and landing columns from tenants.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS landing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS landing_headline VARCHAR(180),
  ADD COLUMN IF NOT EXISTS landing_subheadline TEXT,
  ADD COLUMN IF NOT EXISTS landing_cta_label VARCHAR(80) NOT NULL DEFAULT 'Acceder a la academia';

CREATE TABLE IF NOT EXISTS landing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  excerpt VARCHAR(320) NOT NULL,
  content TEXT,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('draft', 'published'))
);

CREATE TABLE IF NOT EXISTS landing_pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(320),
  price_label VARCHAR(100) NOT NULL,
  billing_period VARCHAR(40),
  features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cta_label VARCHAR(80) NOT NULL DEFAULT 'Solicitar información',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_landing_posts_public
  ON landing_posts(tenant_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_pricing_public
  ON landing_pricing_plans(tenant_id, is_active, sort_order);

DO $$
DECLARE current_table TEXT;
BEGIN
  FOREACH current_table IN ARRAY ARRAY['landing_posts', 'landing_pricing_plans'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', current_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', current_table);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = current_table
        AND policyname = 'tenant_isolation_' || current_table
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO PUBLIC USING (tenant_id = app_current_tenant_id()) WITH CHECK (tenant_id = app_current_tenant_id())',
        'tenant_isolation_' || current_table,
        current_table
      );
    END IF;
  END LOOP;
END $$;
