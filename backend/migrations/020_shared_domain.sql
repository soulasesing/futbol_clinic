-- Shared domain foundations. Additive only; rollback by dropping these tables in reverse order.
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on >= starts_on),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  billing_email VARCHAR(255),
  billing_phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, tenant_id)
);

CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS guardian_players (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL,
  can_view_finances BOOLEAN NOT NULL DEFAULT TRUE,
  can_submit_payments BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guardian_id, player_id),
  FOREIGN KEY (guardian_id, tenant_id) REFERENCES guardians(id, tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id, tenant_id) REFERENCES players(id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coach_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'coach',
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on),
  FOREIGN KEY (coach_id, tenant_id) REFERENCES coaches(id, tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (team_id, tenant_id) REFERENCES teams(id, tenant_id) ON DELETE CASCADE,
  UNIQUE NULLS NOT DISTINCT (tenant_id, coach_id, team_id, season_id, role)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_players_player ON guardian_players(tenant_id, player_id);
CREATE INDEX IF NOT EXISTS idx_guardians_household ON guardians(tenant_id, household_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(tenant_id, entity_type, entity_id);

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'locations','seasons','households','guardians','guardian_players',
    'coach_team_assignments','audit_events'
  ] LOOP
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
