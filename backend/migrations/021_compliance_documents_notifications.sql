-- Compliance and communication records. Additive only.
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
  consent_type VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  version VARCHAR(40) NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('pending', 'granted', 'revoked', 'expired')),
  FOREIGN KEY (player_id, tenant_id) REFERENCES players(id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
  document_type VARCHAR(80) NOT NULL,
  storage_key TEXT NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(120),
  size_bytes BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (size_bytes IS NULL OR size_bytes >= 0),
  CHECK (status IN ('active', 'expired', 'superseded', 'deleted')),
  FOREIGN KEY (player_id, tenant_id) REFERENCES players(id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  provider_reference VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  CHECK (status IN ('pending', 'sent', 'failed', 'read', 'cancelled')),
  CHECK (user_id IS NOT NULL OR household_id IS NOT NULL),
  FOREIGN KEY (household_id, tenant_id) REFERENCES households(id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consents_player ON consents(tenant_id, player_id);
CREATE INDEX IF NOT EXISTS idx_documents_player ON documents(tenant_id, player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(tenant_id, user_id, status);

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['consents','documents','notifications'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
        AND policyname = 'tenant_isolation_' || table_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO PUBLIC USING (tenant_id = app_current_tenant_id()) WITH CHECK (tenant_id = app_current_tenant_id())',
        'tenant_isolation_' || table_name, table_name
      );
    END IF;
  END LOOP;
END $$;
