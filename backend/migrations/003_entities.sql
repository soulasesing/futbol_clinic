-- Tabla de equipos
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  entrenador_id UUID REFERENCES coaches(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_teams ON teams
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_teams
BEFORE INSERT ON teams
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Tabla de entrenadores
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_coaches ON coaches
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_coaches
BEFORE INSERT ON coaches
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Tabla de partidos
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipo_local_id UUID REFERENCES teams(id),
  equipo_visitante_id UUID REFERENCES teams(id),
  fecha TIMESTAMP NOT NULL,
  lugar VARCHAR(255),
  resultado VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_matches ON matches
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_matches
BEFORE INSERT ON matches
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Tabla de entrenamientos
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES teams(id),
  fecha TIMESTAMP NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_trainings ON trainings
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_trainings
BEFORE INSERT ON trainings
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Tabla de asistencia
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  training_id UUID REFERENCES trainings(id),
  player_id UUID REFERENCES players(id),
  presente BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_attendance ON attendance
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_attendance
BEFORE INSERT ON attendance
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Tabla de estadísticas
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  match_id UUID REFERENCES matches(id),
  goles INT DEFAULT 0,
  asistencias INT DEFAULT 0,
  tarjetas_amarillas INT DEFAULT 0,
  tarjetas_rojas INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_stats ON stats
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_stats
BEFORE INSERT ON stats
FOR EACH ROW EXECUTE FUNCTION set_tenant_id(); 