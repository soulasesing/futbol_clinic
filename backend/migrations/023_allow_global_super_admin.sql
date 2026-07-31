-- Allow explicitly provisioned global super administrators while preserving
-- mandatory tenant context for every tenant-owned record.
-- Rollback: restore the strict set_tenant_id() implementation from migration 019.

CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND TG_TABLE_NAME = 'users' THEN
    IF NEW.rol = 'super_admin' THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := app_current_tenant_id();
  END IF;

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required';
  END IF;

  RETURN NEW;
END;
$$;
