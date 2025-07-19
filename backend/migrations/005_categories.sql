-- Tabla de categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre VARCHAR(50) NOT NULL,
  edad_min INT NOT NULL,
  edad_max INT NOT NULL,
  anio_nacimiento_min INT NOT NULL,
  anio_nacimiento_max INT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nombre, tenant_id)
);

-- RLS para categorías
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_categories ON categories
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Trigger para asignar tenant_id automáticamente
CREATE TRIGGER set_tenant_id_categories
BEFORE INSERT ON categories
FOR EACH ROW EXECUTE FUNCTION set_tenant_id(); 