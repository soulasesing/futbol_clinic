-- Security foundation: least-privilege role and cross-tenant constraints.
-- Rollback: drop constraints named *_tenant_fk, role grants, then the role.
-- Constraints are NOT VALID so existing rows are preserved; they still protect
-- all new and updated rows and can be validated after an integrity audit.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'futbol_clinic_app') THEN
    CREATE ROLE futbol_clinic_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'futbol_app') THEN
    GRANT futbol_clinic_app TO futbol_app;
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO futbol_clinic_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO futbol_clinic_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO futbol_clinic_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO futbol_clinic_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO futbol_clinic_app;

-- Disable the historical demo super-admin only when it still has the publicly
-- documented password hash. A legitimately rotated account is left untouched.
UPDATE users
SET is_active = FALSE
WHERE tenant_id IS NULL
  AND rol = 'super_admin'
  AND email = 'superadmin@futbolclinic.com'
  AND password_hash = '$2b$10$zt.B/1cZ2Y4I/RBRdCFlr.I5isn5r/CLOMrIxRGv4Wkzy545i48YW';

CREATE UNIQUE INDEX IF NOT EXISTS users_super_admin_email_unique
  ON users (LOWER(email))
  WHERE tenant_id IS NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check,
  ADD CONSTRAINT users_role_check
    CHECK (rol IN ('super_admin', 'admin', 'coach', 'parent')) NOT VALID;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check,
  ADD CONSTRAINT invitations_role_check
    CHECK (rol IN ('admin', 'coach', 'parent')) NOT VALID;

ALTER TABLE match_convocations
  ADD CONSTRAINT match_convocations_status_check
    CHECK (status IN ('convocado', 'confirmado', 'ausente', 'lesionado')) NOT VALID,
  ADD CONSTRAINT match_convocations_nonnegative_stats_check
    CHECK (
      COALESCE(minutes_played, 0) >= 0
      AND COALESCE(goals_scored, 0) >= 0
      AND COALESCE(assists, 0) >= 0
      AND COALESCE(yellow_cards, 0) >= 0
      AND COALESCE(red_cards, 0) >= 0
      AND (jersey_number IS NULL OR jersey_number > 0)
    ) NOT VALID;

ALTER TABLE physical_tests
  ADD CONSTRAINT physical_tests_scores_check
    CHECK (
      (precision_tiro IS NULL OR precision_tiro BETWEEN 0 AND 10)
      AND (control_balon IS NULL OR control_balon BETWEEN 0 AND 10)
      AND (pase_precision IS NULL OR pase_precision BETWEEN 0 AND 10)
    ) NOT VALID;

ALTER TABLE teams ADD CONSTRAINT teams_id_tenant_unique UNIQUE (id, tenant_id);
ALTER TABLE coaches ADD CONSTRAINT coaches_id_tenant_unique UNIQUE (id, tenant_id);
ALTER TABLE players ADD CONSTRAINT players_id_tenant_unique UNIQUE (id, tenant_id);
ALTER TABLE matches ADD CONSTRAINT matches_id_tenant_unique UNIQUE (id, tenant_id);
ALTER TABLE trainings ADD CONSTRAINT trainings_id_tenant_unique UNIQUE (id, tenant_id);

ALTER TABLE teams
  ADD CONSTRAINT teams_coach_tenant_fk
  FOREIGN KEY (entrenador_id, tenant_id)
  REFERENCES coaches (id, tenant_id) NOT VALID;

ALTER TABLE trainings
  ADD CONSTRAINT trainings_team_tenant_fk
  FOREIGN KEY (equipo_id, tenant_id)
  REFERENCES teams (id, tenant_id) NOT VALID;

ALTER TABLE matches
  ADD CONSTRAINT matches_home_team_tenant_fk
  FOREIGN KEY (equipo_local_id, tenant_id)
  REFERENCES teams (id, tenant_id) NOT VALID,
  ADD CONSTRAINT matches_away_team_tenant_fk
  FOREIGN KEY (equipo_visitante_id, tenant_id)
  REFERENCES teams (id, tenant_id) NOT VALID;

ALTER TABLE player_teams
  ADD CONSTRAINT player_teams_player_tenant_fk
  FOREIGN KEY (player_id, tenant_id)
  REFERENCES players (id, tenant_id) NOT VALID,
  ADD CONSTRAINT player_teams_team_tenant_fk
  FOREIGN KEY (team_id, tenant_id)
  REFERENCES teams (id, tenant_id) NOT VALID;

ALTER TABLE attendance
  ADD CONSTRAINT attendance_training_tenant_fk
  FOREIGN KEY (training_id, tenant_id)
  REFERENCES trainings (id, tenant_id) NOT VALID,
  ADD CONSTRAINT attendance_player_tenant_fk
  FOREIGN KEY (player_id, tenant_id)
  REFERENCES players (id, tenant_id) NOT VALID;

ALTER TABLE stats
  ADD CONSTRAINT stats_player_tenant_fk
  FOREIGN KEY (player_id, tenant_id)
  REFERENCES players (id, tenant_id) NOT VALID,
  ADD CONSTRAINT stats_match_tenant_fk
  FOREIGN KEY (match_id, tenant_id)
  REFERENCES matches (id, tenant_id) NOT VALID;

ALTER TABLE physical_tests
  ADD CONSTRAINT physical_tests_player_tenant_fk
  FOREIGN KEY (player_id, tenant_id)
  REFERENCES players (id, tenant_id) NOT VALID;

ALTER TABLE match_convocations
  ADD CONSTRAINT match_convocations_match_tenant_fk
  FOREIGN KEY (match_id, tenant_id)
  REFERENCES matches (id, tenant_id) NOT VALID,
  ADD CONSTRAINT match_convocations_player_tenant_fk
  FOREIGN KEY (player_id, tenant_id)
  REFERENCES players (id, tenant_id) NOT VALID;
