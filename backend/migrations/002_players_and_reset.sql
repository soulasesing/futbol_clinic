-- Agregar campos para recuperación de contraseña
ALTER TABLE users
  ADD COLUMN reset_token VARCHAR(255),
  ADD COLUMN reset_token_expires TIMESTAMP;

-- Tabla de jugadores
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  cedula VARCHAR(50) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  foto_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cedula, tenant_id)
);

-- RLS para jugadores
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_players ON players
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Trigger para asignar tenant_id automáticamente
CREATE TRIGGER set_tenant_id_players
BEFORE INSERT ON players
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();