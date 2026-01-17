#!/bin/bash

# Script to run migrations using Docker
# This script copies migration files into the container and runs them

CONTAINER_NAME="futbol_clinic_db"
DB_USER="postgres"
DB_NAME="futbol_clinic"

echo "Running migrations in Docker container: $CONTAINER_NAME"

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "Error: Container $CONTAINER_NAME is not running"
    echo "Start it with: docker-compose up -d database"
    exit 1
fi

# Run migrations one by one
MIGRATIONS=(
    "001_init.sql"
    "002_players_and_reset.sql"
    "003_entities.sql"
    "004_add_document_url.sql"
    "005_categories.sql"
    "006_add_team_description.sql"
    "007_player_teams.sql"
    "008_add_coach_foto_url.sql"
    "009_super_admin.sql"
    "010_fix_set_tenant_id.sql"
    "011_add_player_parent_fields.sql"
    "012_add_branding_colors.sql"
    "013_physical_tests.sql"
    "014_add_parent_phone.sql"
    "015_update_trainings.sql"
    "016_improve_trainings_recurrence.sql"
    "017_match_convocations.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "Running migration: $migration"
    docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "backend/migrations/$migration"
    if [ $? -eq 0 ]; then
        echo "✓ $migration completed"
    else
        echo "✗ Error running $migration"
        exit 1
    fi
done

echo ""
echo "All migrations completed successfully!"
