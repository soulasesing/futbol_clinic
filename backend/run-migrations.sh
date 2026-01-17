#!/bin/bash

# Script to run all database migrations in order
# Usage: ./run-migrations.sh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}Running database migrations...${NC}"
echo -e "${YELLOW}Database: $DATABASE_URL${NC}"
echo ""

# List of migration files in order
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

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "migrations/$migration" ]; then
        echo -e "${YELLOW}Running $migration...${NC}"
        psql "$DATABASE_URL" -f "migrations/$migration" 2>&1 | grep -v "NOTICE" || {
            echo -e "${RED}Error running $migration${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ $migration completed${NC}"
    else
        echo -e "${RED}Error: migrations/$migration not found${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}All migrations completed successfully!${NC}"
