-- =====================================================
-- FUTBOL CLINIC - DATABASE INITIALIZATION FOR DOCKER
-- =====================================================
-- This script will be automatically executed when PostgreSQL container starts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default locale and encoding
SET client_encoding = 'UTF8';
SET timezone = 'UTC';

-- Create the main database if it doesn't exist
-- Note: This runs in the context of the postgres database
-- The futbol_clinic database is created by POSTGRES_DB env var

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Initializing Futbol Clinic Database...';
    RAISE NOTICE 'Extensions enabled: uuid-ossp';
    RAISE NOTICE 'Timezone set to: %', current_setting('timezone');
    RAISE NOTICE 'Database initialization completed successfully!';
END
$$;
