-- Secure, auditable parent invitations linked to guardian records.
-- Rollback: drop added invitation columns, indexes and foreign keys.

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS guardian_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_guardian_tenant_fk,
  ADD CONSTRAINT invitations_guardian_tenant_fk
    FOREIGN KEY (guardian_id, tenant_id)
    REFERENCES guardians(id, tenant_id)
    ON DELETE CASCADE
    NOT VALID;

CREATE INDEX IF NOT EXISTS idx_invitations_parent_status
  ON invitations(tenant_id, guardian_id, accepted, revoked_at, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardians_tenant_email
  ON guardians(tenant_id, LOWER(email))
  WHERE email IS NOT NULL;
