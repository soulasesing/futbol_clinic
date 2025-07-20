-- Tabla intermedia para jugadores y equipos (muchos a muchos)
CREATE TABLE player_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, team_id, tenant_id)
);

-- RLS para player_teams
ALTER TABLE player_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_player_teams ON player_teams
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE TRIGGER set_tenant_id_player_teams
BEFORE INSERT ON player_teams
FOR EACH ROW EXECUTE FUNCTION set_tenant_id(); 