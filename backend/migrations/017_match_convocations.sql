-- Migración: Sistema de Convocatorias para Partidos
-- Permite a los entrenadores convocar jugadores específicos para cada partido

-- Crear tabla matches si no existe (fallback en caso de que no se haya ejecutado 003_entities.sql)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipo_local_id UUID REFERENCES teams(id),
  equipo_visitante_id UUID REFERENCES teams(id),
  fecha TIMESTAMP NOT NULL,
  lugar VARCHAR(255),
  resultado VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS si no está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'matches' 
    AND policyname = 'tenant_isolation_matches'
  ) THEN
    ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation_matches ON matches
      USING (tenant_id = current_setting('app.current_tenant')::uuid);
  END IF;
END $$;

-- Crear trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'matches' 
    AND trigger_name = 'set_tenant_id_matches'
  ) THEN
    CREATE TRIGGER set_tenant_id_matches
    BEFORE INSERT ON matches
    FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
  END IF;
END $$;

-- Mejoras a la tabla de partidos (agregar nuevas columnas)
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS competition VARCHAR(100), -- nombre de la competición
  ADD COLUMN IF NOT EXISTS match_type VARCHAR(50) DEFAULT 'friendly', -- friendly, league, cup, tournament
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, postponed
  ADD COLUMN IF NOT EXISTS home_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referee VARCHAR(100),
  ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 90,
  ADD COLUMN IF NOT EXISTS kickoff_time TIME,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Tabla de convocatorias de partidos
CREATE TABLE match_convocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Estado de la convocatoria
  status VARCHAR(20) NOT NULL DEFAULT 'convocado', -- convocado, confirmado, ausente, lesionado
  
  -- Información táctica
  position VARCHAR(50), -- posición en la que jugará (portero, defensa, centrocampista, delantero)
  is_starter BOOLEAN DEFAULT false, -- titular o suplente
  jersey_number INT, -- número de camiseta para el partido
  
  -- Metadata
  convocation_date TIMESTAMP DEFAULT NOW(),
  confirmed_date TIMESTAMP,
  notes TEXT, -- notas del entrenador sobre el jugador
  
  -- Estadísticas del partido (se llenan después del partido)
  minutes_played INT DEFAULT 0,
  goals_scored INT DEFAULT 0,
  assists INT DEFAULT 0,
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constrains
  UNIQUE(match_id, player_id),
  UNIQUE(match_id, jersey_number) -- no dos jugadores con el mismo número en un partido
);

-- Índices para optimizar consultas
CREATE INDEX idx_match_convocations_match_id ON match_convocations(match_id);
CREATE INDEX idx_match_convocations_player_id ON match_convocations(player_id);
CREATE INDEX idx_match_convocations_status ON match_convocations(status);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_fecha ON matches(fecha);
CREATE INDEX idx_matches_team_ids ON matches(equipo_local_id, equipo_visitante_id);

-- Row Level Security para convocatorias
ALTER TABLE match_convocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_match_convocations ON match_convocations
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Trigger para asignar tenant_id automáticamente
CREATE TRIGGER set_tenant_id_match_convocations
BEFORE INSERT ON match_convocations
FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- Trigger para actualizar updated_at en matches
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_convocations_updated_at
BEFORE UPDATE ON match_convocations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener jugadores convocados para un partido
CREATE OR REPLACE FUNCTION get_match_convocations(match_uuid UUID)
RETURNS TABLE (
  convocation_id UUID,
  player_id UUID,
  player_name TEXT,
  player_position VARCHAR,
  convocation_status VARCHAR,
  is_starter BOOLEAN,
  jersey_number INT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    p.id,
    CONCAT(p.nombre, ' ', p.apellido),
    mc.position,
    mc.status,
    mc.is_starter,
    mc.jersey_number,
    mc.notes
  FROM match_convocations mc
  JOIN players p ON mc.player_id = p.id
  WHERE mc.match_id = match_uuid
  ORDER BY mc.is_starter DESC, mc.position, p.apellido, p.nombre;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de convocatorias por jugador
CREATE OR REPLACE FUNCTION get_player_convocation_stats(player_uuid UUID)
RETURNS TABLE (
  total_convocations BIGINT,
  total_confirmations BIGINT,
  total_absences BIGINT,
  total_minutes BIGINT,
  total_goals BIGINT,
  total_assists BIGINT,
  confirmation_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_convocations,
    COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as total_confirmations,
    COUNT(CASE WHEN status = 'ausente' THEN 1 END) as total_absences,
    COALESCE(SUM(minutes_played), 0) as total_minutes,
    COALESCE(SUM(goals_scored), 0) as total_goals,
    COALESCE(SUM(assists), 0) as total_assists,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN status = 'confirmado' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0 
    END as confirmation_rate
  FROM match_convocations
  WHERE player_id = player_uuid;
END;
$$ LANGUAGE plpgsql;
