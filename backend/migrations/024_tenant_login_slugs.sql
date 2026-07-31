-- Tenant-specific login URLs and public branding resolution.
-- Rollback: drop the index, constraints, login_enabled and slug columns.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE tenants
SET slug = CASE
  WHEN nombre = 'Academia de Fútbol Los Andes' THEN 'los-andes'
  WHEN nombre = 'Escuela Deportiva Caribe FC' THEN 'caribe-fc'
  ELSE 'escuela-' || SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 12)
END
WHERE slug IS NULL;

ALTER TABLE tenants
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT tenants_slug_format_check
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') NOT VALID;

CREATE UNIQUE INDEX tenants_slug_unique ON tenants (LOWER(slug));
