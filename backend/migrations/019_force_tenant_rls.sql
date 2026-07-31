-- Enforce tenant RLS for non-superusers.
-- Rollback: ALTER each listed table NO FORCE ROW LEVEL SECURITY and recreate
-- the previous policies. Keep the helper function until old policies are restored.

CREATE OR REPLACE FUNCTION app_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')::UUID
$$;

REVOKE ALL ON FUNCTION app_current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_current_tenant_id() TO futbol_clinic_app;

CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := app_current_tenant_id();
  END IF;

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tenant_table TEXT;
  tenant_tables CONSTANT TEXT[] := ARRAY[
    'invitations',
    'players',
    'categories',
    'player_teams',
    'teams',
    'coaches',
    'matches',
    'trainings',
    'attendance',
    'stats',
    'physical_tests',
    'match_convocations'
  ];
BEGIN
  FOREACH tenant_table IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      'tenant_isolation_' || tenant_table,
      tenant_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO PUBLIC USING (tenant_id = app_current_tenant_id()) WITH CHECK (tenant_id = app_current_tenant_id())',
      'tenant_isolation_' || tenant_table,
      tenant_table
    );
  END LOOP;
END
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  TO PUBLIC
  USING (
    tenant_id = app_current_tenant_id()
    OR (tenant_id IS NULL AND rol = 'super_admin')
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    OR (tenant_id IS NULL AND rol = 'super_admin')
  );
