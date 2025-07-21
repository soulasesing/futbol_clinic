-- Permitir tenant_id NULL en users para super admin
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- Crear usuario super_admin inicial (ajusta el password hash y email según tu entorno)
INSERT INTO users (id, tenant_id, nombre, email, password_hash, rol, is_active)
VALUES (
  gen_random_uuid(),
  NULL,
  'Super Admin',
  'superadmin@futbolclinic.com',
  '$2b$10$zt.B/1cZ2Y4I/RBRdCFlr.I5isn5r/CLOMrIxRGv4Wkzy545i48YW', -- Cambia por un hash real
  'super_admin',
  TRUE
); 