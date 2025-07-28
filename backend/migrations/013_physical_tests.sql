-- Tabla de pruebas físicas
CREATE TABLE physical_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  fecha_prueba DATE NOT NULL,
  
  -- Medidas corporales
  altura DECIMAL(5,2),  -- en centímetros
  peso DECIMAL(5,2),    -- en kilogramos
  imc DECIMAL(4,2),     -- Índice de masa corporal
  
  -- Velocidad y agilidad
  velocidad_40m DECIMAL(4,2),  -- tiempo en segundos
  agilidad_illinois DECIMAL(4,2), -- tiempo en segundos
  salto_vertical INT,           -- en centímetros
  
  -- Resistencia
  yo_yo_test INT,              -- distancia en metros
  cooper_test INT,             -- distancia en metros
  
  -- Fuerza
  flexiones INT,               -- número de repeticiones
  abdominales INT,             -- número de repeticiones en 1 minuto
  
  -- Técnica
  precision_tiro INT,          -- puntuación de 0-10
  control_balon INT,           -- puntuación de 0-10
  pase_precision INT,          -- puntuación de 0-10
  
  -- Observaciones
  observaciones TEXT,
  evaluador VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS para pruebas físicas
ALTER TABLE physical_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_physical_tests ON physical_tests
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Trigger para asignar tenant_id automáticamente
CREATE TRIGGER set_tenant_id_physical_tests
BEFORE INSERT ON physical_tests
FOR EACH ROW EXECUTE FUNCTION set_tenant_id(); 