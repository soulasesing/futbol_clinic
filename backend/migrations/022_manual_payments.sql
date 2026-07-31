-- Manual payment workflow and immutable financial ledger. Additive only.
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  account_type VARCHAR(20) NOT NULL,
  instructions TEXT NOT NULL,
  bank_name VARCHAR(120),
  account_holder VARCHAR(150),
  account_number VARCHAR(120),
  wallet_identifier VARCHAR(150),
  qr_url TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (account_type IN ('bank', 'wallet', 'cash')),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS fee_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  default_amount_cents BIGINT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (default_amount_cents IS NULL OR default_amount_cents >= 0),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
  player_id UUID REFERENCES players(id) ON DELETE RESTRICT,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  total_cents BIGINT NOT NULL,
  due_on DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (total_cents > 0),
  CHECK (status IN ('open', 'partially_paid', 'paid', 'void')),
  UNIQUE (id, tenant_id),
  FOREIGN KEY (household_id, tenant_id) REFERENCES households(id, tenant_id),
  FOREIGN KEY (player_id, tenant_id) REFERENCES players(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS charge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  charge_id UUID NOT NULL REFERENCES charges(id) ON DELETE CASCADE,
  fee_concept_id UUID REFERENCES fee_concepts(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_amount_cents BIGINT NOT NULL,
  amount_cents BIGINT GENERATED ALWAYS AS (quantity::bigint * unit_amount_cents) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (quantity > 0),
  CHECK (unit_amount_cents >= 0),
  UNIQUE (id, tenant_id),
  FOREIGN KEY (charge_id, tenant_id) REFERENCES charges(id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
  charge_id UUID NOT NULL REFERENCES charges(id) ON DELETE RESTRICT,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payment_account_id UUID REFERENCES payment_accounts(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  provider VARCHAR(80) NOT NULL DEFAULT 'manual',
  channel VARCHAR(30) NOT NULL,
  external_reference VARCHAR(255),
  proof_storage_key TEXT NOT NULL,
  proof_filename VARCHAR(255),
  proof_mime_type VARCHAR(120),
  proof_size_bytes BIGINT,
  payer_note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  idempotency_key VARCHAR(120) NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents > 0),
  CHECK (proof_size_bytes IS NULL OR proof_size_bytes > 0),
  CHECK (channel IN ('bank_transfer', 'wallet', 'cash', 'other')),
  CHECK (status IN ('pending', 'approved', 'rejected')),
  UNIQUE (id, tenant_id),
  FOREIGN KEY (household_id, tenant_id) REFERENCES households(id, tenant_id),
  FOREIGN KEY (charge_id, tenant_id) REFERENCES charges(id, tenant_id),
  UNIQUE (tenant_id, submitted_by, idempotency_key)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
  submission_id UUID NOT NULL UNIQUE REFERENCES payment_submissions(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  provider VARCHAR(80) NOT NULL,
  channel VARCHAR(30) NOT NULL,
  external_reference VARCHAR(255),
  received_at TIMESTAMPTZ NOT NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents > 0),
  UNIQUE (id, tenant_id),
  FOREIGN KEY (household_id, tenant_id) REFERENCES households(id, tenant_id),
  FOREIGN KEY (submission_id, tenant_id) REFERENCES payment_submissions(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  charge_id UUID NOT NULL REFERENCES charges(id) ON DELETE RESTRICT,
  charge_item_id UUID REFERENCES charge_items(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents > 0),
  FOREIGN KEY (payment_id, tenant_id) REFERENCES payments(id, tenant_id),
  FOREIGN KEY (charge_id, tenant_id) REFERENCES charges(id, tenant_id),
  FOREIGN KEY (charge_item_id, tenant_id) REFERENCES charge_items(id, tenant_id),
  UNIQUE NULLS NOT DISTINCT (payment_id, charge_id, charge_item_id)
);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  provider VARCHAR(80) NOT NULL DEFAULT 'manual',
  channel VARCHAR(30) NOT NULL,
  external_reference VARCHAR(255),
  reason TEXT NOT NULL,
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents > 0),
  FOREIGN KEY (payment_id, tenant_id) REFERENCES payments(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
  receipt_number VARCHAR(80) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (payment_id, tenant_id) REFERENCES payments(id, tenant_id),
  UNIQUE (tenant_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS family_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL,
  event_id UUID NOT NULL,
  response VARCHAR(10) NOT NULL,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (event_type IN ('training', 'match')),
  CHECK (response IN ('yes', 'no')),
  FOREIGN KEY (guardian_id, tenant_id) REFERENCES guardians(id, tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id, tenant_id) REFERENCES players(id, tenant_id) ON DELETE CASCADE,
  UNIQUE (tenant_id, guardian_id, player_id, event_type, event_id)
);

CREATE INDEX IF NOT EXISTS idx_charges_household ON charges(tenant_id, household_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON payment_submissions(tenant_id, status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_allocations_charge ON payment_allocations(tenant_id, charge_id);
CREATE INDEX IF NOT EXISTS idx_family_event_rsvps_event
  ON family_event_rsvps(tenant_id, event_type, event_id, player_id);

CREATE OR REPLACE FUNCTION reject_immutable_finance_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% records are immutable', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'payment_accounts','fee_concepts','charges','charge_items','payment_submissions',
    'payments','payment_allocations','payment_refunds','payment_receipts',
    'family_event_rsvps'
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

  FOREACH table_name IN ARRAY ARRAY[
    'audit_events','payments','payment_allocations','payment_refunds','payment_receipts'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'immutable_' || table_name AND NOT tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_immutable_finance_mutation()',
        'immutable_' || table_name, table_name
      );
    END IF;
  END LOOP;
END $$;
