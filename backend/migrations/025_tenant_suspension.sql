-- Add an explicit commercial access lifecycle without automated trials.
-- Rollback: DROP the status fields and tenants_status_check constraint.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('active', 'suspended')) NOT VALID;

UPDATE tenants
SET status = CASE WHEN login_enabled THEN 'active' ELSE 'suspended' END,
    suspended_at = CASE WHEN login_enabled THEN NULL ELSE COALESCE(suspended_at, NOW()) END
WHERE status IS DISTINCT FROM CASE WHEN login_enabled THEN 'active' ELSE 'suspended' END;
