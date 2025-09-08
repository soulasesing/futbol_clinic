-- Run all migrations in the correct order
-- Execute these one by one in your PostgreSQL database

-- 1. Basic setup and tenants
\i backend/migrations/001_init.sql

-- 2. Players and password reset
\i backend/migrations/002_players_and_reset.sql

-- 3. Core entities (teams, coaches, matches, trainings, etc.)
\i backend/migrations/003_entities.sql

-- 4. Document URL for players
\i backend/migrations/004_add_document_url.sql

-- 5. Categories
\i backend/migrations/005_categories.sql

-- 6. Team description
\i backend/migrations/006_add_team_description.sql

-- 7. Player-team relationships
\i backend/migrations/007_player_teams.sql

-- 8. Coach photo URL
\i backend/migrations/008_add_coach_foto_url.sql

-- 9. Super admin user
\i backend/migrations/009_super_admin.sql

-- 10. Fix tenant ID function
\i backend/migrations/010_fix_set_tenant_id.sql

-- 11. Player parent fields
\i backend/migrations/011_add_player_parent_fields.sql

-- 12. Branding colors for tenants
\i backend/migrations/012_add_branding_colors.sql

-- 13. Physical tests system
\i backend/migrations/013_physical_tests.sql

-- 14. Parent phone numbers
\i backend/migrations/014_add_parent_phone.sql

-- 15. Training improvements
\i backend/migrations/015_update_trainings.sql

-- 16. Training recurrence improvements  
\i backend/migrations/016_improve_trainings_recurrence.sql

-- 17. NEW: Match convocations system
\i backend/migrations/017_match_convocations.sql
