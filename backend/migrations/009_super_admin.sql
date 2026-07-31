-- Permitir tenant_id NULL en users para super admin
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- El super administrador se provisiona explícitamente mediante una operación
-- segura. Las migraciones nunca deben crear cuentas con credenciales conocidas.