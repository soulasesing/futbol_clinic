import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getMatches = async (tenantId: string) => {
  const query = `
    SELECT 
      m.*,
      tl.nombre as equipo_local_nombre,
      tv.nombre as equipo_visitante_nombre,
      tl.categoria as equipo_local_categoria,
      tv.categoria as equipo_visitante_categoria,
      (
        SELECT COUNT(*) 
        FROM match_convocations mc 
        WHERE mc.match_id = m.id
      ) as total_convocations,
      (
        SELECT COUNT(*) 
        FROM match_convocations mc 
        WHERE mc.match_id = m.id AND mc.status = 'confirmado'
      ) as confirmed_convocations
    FROM matches m
    LEFT JOIN teams tl ON m.equipo_local_id = tl.id
    LEFT JOIN teams tv ON m.equipo_visitante_id = tv.id
    WHERE m.tenant_id = $1
    ORDER BY m.fecha DESC, m.kickoff_time DESC
  `;
  
  const result = await pool.query(query, [tenantId]);
  return result.rows;
};

export const getMatchById = async (tenantId: string, matchId: string) => {
  const query = `
    SELECT 
      m.*,
      tl.nombre as equipo_local_nombre,
      tv.nombre as equipo_visitante_nombre,
      tl.categoria as equipo_local_categoria,
      tv.categoria as equipo_visitante_categoria
    FROM matches m
    LEFT JOIN teams tl ON m.equipo_local_id = tl.id
    LEFT JOIN teams tv ON m.equipo_visitante_id = tv.id
    WHERE m.id = $1 AND m.tenant_id = $2
  `;
  
  const result = await pool.query(query, [matchId, tenantId]);
  if (!result.rowCount || result.rowCount === 0) throw new Error('Partido no encontrado');
  return result.rows[0];
};

export const createMatch = async (tenantId: string, data: any) => {
  const { 
    equipo_local_id, 
    equipo_visitante_id, 
    fecha, 
    lugar, 
    resultado, 
    competition,
    match_type = 'friendly',
    status = 'scheduled',
    referee,
    weather_conditions,
    notes,
    duration_minutes = 90,
    kickoff_time
  } = data;
  
  const result = await pool.query(
    `INSERT INTO matches (
      id, tenant_id, equipo_local_id, equipo_visitante_id, fecha, lugar, resultado,
      competition, match_type, status, referee, weather_conditions, notes,
      duration_minutes, kickoff_time
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      uuidv4(), tenantId, equipo_local_id, equipo_visitante_id, fecha, lugar, resultado,
      competition, match_type, status, referee, weather_conditions, notes,
      duration_minutes, kickoff_time
    ]
  );
  return result.rows[0];
};

export const updateMatch = async (tenantId: string, id: string, data: any) => {
  const { 
    equipo_local_id, 
    equipo_visitante_id, 
    fecha, 
    lugar, 
    resultado,
    competition,
    match_type,
    status,
    home_score,
    away_score,
    referee,
    weather_conditions,
    notes,
    duration_minutes,
    kickoff_time
  } = data;
  
  const result = await pool.query(
    `UPDATE matches SET 
      equipo_local_id = $1, 
      equipo_visitante_id = $2, 
      fecha = $3, 
      lugar = $4, 
      resultado = $5,
      competition = $6,
      match_type = $7,
      status = $8,
      home_score = $9,
      away_score = $10,
      referee = $11,
      weather_conditions = $12,
      notes = $13,
      duration_minutes = $14,
      kickoff_time = $15,
      updated_at = NOW()
     WHERE id = $16 AND tenant_id = $17 
     RETURNING *`,
    [
      equipo_local_id, equipo_visitante_id, fecha, lugar, resultado,
      competition, match_type, status, home_score, away_score,
      referee, weather_conditions, notes, duration_minutes, kickoff_time,
      id, tenantId
    ]
  );
  if (!result.rowCount || result.rowCount === 0) throw new Error('Partido no encontrado');
  return result.rows[0];
};

export const deleteMatch = async (tenantId: string, id: string) => {
  // Primero eliminar las convocatorias relacionadas (por CASCADE ya se hace automáticamente)
  const result = await pool.query('DELETE FROM matches WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (!result.rowCount || result.rowCount === 0) throw new Error('Partido no encontrado');
};

// Nuevas funciones para el sistema de convocatorias

export const getTeamPlayers = async (tenantId: string, teamId: string) => {
  const query = `
    SELECT DISTINCT
      p.id,
      p.nombre,
      p.apellido,
      p.cedula,
      p.fecha_nacimiento,
      p.categoria,
      p.foto_url,
      EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as edad
    FROM players p
    JOIN player_teams pt ON p.id = pt.player_id
    WHERE pt.team_id = $1 AND p.tenant_id = $2
    ORDER BY p.apellido, p.nombre
  `;
  
  const result = await pool.query(query, [teamId, tenantId]);
  return result.rows;
};

export const getMatchConvocations = async (tenantId: string, matchId: string) => {
  const query = `
    SELECT 
      mc.*,
      p.nombre,
      p.apellido,
      p.foto_url,
      p.categoria,
      EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as edad
    FROM match_convocations mc
    JOIN players p ON mc.player_id = p.id
    WHERE mc.match_id = $1 AND mc.tenant_id = $2
    ORDER BY mc.is_starter DESC, mc.position, p.apellido, p.nombre
  `;
  
  const result = await pool.query(query, [matchId, tenantId]);
  return result.rows;
};

export const getMatchWithConvocations = async (tenantId: string, matchId: string) => {
  const match = await getMatchById(tenantId, matchId);
  const convocations = await getMatchConvocations(tenantId, matchId);
  return {
    ...match,
    convocations
  };
};

export const getMatchesByTeam = async (tenantId: string, teamId: string, limit = 10) => {
  const query = `
    SELECT 
      m.*,
      tl.nombre as equipo_local_nombre,
      tv.nombre as equipo_visitante_nombre
    FROM matches m
    LEFT JOIN teams tl ON m.equipo_local_id = tl.id
    LEFT JOIN teams tv ON m.equipo_visitante_id = tv.id
    WHERE (m.equipo_local_id = $1 OR m.equipo_visitante_id = $1) 
      AND m.tenant_id = $2
    ORDER BY m.fecha DESC, m.kickoff_time DESC
    LIMIT $3
  `;
  
  const result = await pool.query(query, [teamId, tenantId, limit]);
  return result.rows;
};

export const getUpcomingMatches = async (tenantId: string, limit = 5) => {
  const query = `
    SELECT 
      m.*,
      tl.nombre as equipo_local_nombre,
      tv.nombre as equipo_visitante_nombre,
      tl.categoria as equipo_local_categoria,
      tv.categoria as equipo_visitante_categoria,
      (
        SELECT COUNT(*) 
        FROM match_convocations mc 
        WHERE mc.match_id = m.id
      ) as total_convocations,
      (
        SELECT COUNT(*) 
        FROM match_convocations mc 
        WHERE mc.match_id = m.id AND mc.status = 'confirmado'
      ) as confirmed_convocations
    FROM matches m
    LEFT JOIN teams tl ON m.equipo_local_id = tl.id
    LEFT JOIN teams tv ON m.equipo_visitante_id = tv.id
    WHERE m.fecha >= CURRENT_DATE 
      AND m.tenant_id = $1
      AND m.status IN ('scheduled', 'confirmed')
    ORDER BY m.fecha ASC, m.kickoff_time ASC
    LIMIT $2
  `;
  
  const result = await pool.query(query, [tenantId, limit]);
  return result.rows;
}; 