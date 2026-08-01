-- Bring legacy parent users under the managed family-access workflow.
-- Rollback: remove generated guardians/households only after identifying records
-- with no guardian_players links and verifying they were created by this backfill.

DO $$
DECLARE
  parent_user RECORD;
  new_household_id UUID;
  first_name_value TEXT;
  last_name_value TEXT;
BEGIN
  FOR parent_user IN
    SELECT u.id, u.tenant_id, u.nombre, u.email
    FROM users u
    WHERE u.rol = 'parent'
      AND NOT EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.tenant_id = u.tenant_id AND g.user_id = u.id
      )
  LOOP
    new_household_id := gen_random_uuid();
    first_name_value := split_part(COALESCE(NULLIF(parent_user.nombre, ''), 'Representante'), ' ', 1);
    last_name_value := trim(substring(
      COALESCE(NULLIF(parent_user.nombre, ''), 'Representante') FROM
      length(first_name_value) + 1
    ));
    IF last_name_value = '' THEN
      last_name_value := 'Familia';
    END IF;

    INSERT INTO households
      (id, tenant_id, name, billing_email)
    VALUES
      (
        new_household_id,
        parent_user.tenant_id,
        'Familia ' || last_name_value,
        parent_user.email
      );

    INSERT INTO guardians
      (tenant_id, household_id, user_id, first_name, last_name, email, is_primary)
    VALUES
      (
        parent_user.tenant_id,
        new_household_id,
        parent_user.id,
        first_name_value,
        last_name_value,
        parent_user.email,
        TRUE
      );
  END LOOP;
END $$;
