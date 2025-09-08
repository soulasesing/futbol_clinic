import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface ConvocationData {
  player_id: string;
  position?: string;
  is_starter?: boolean;
  jersey_number?: number;
  notes?: string;
}

export interface ConvocationUpdate {
  status?: 'convocado' | 'confirmado' | 'ausente' | 'lesionado';
  position?: string;
  is_starter?: boolean;
  jersey_number?: number;
  notes?: string;
  minutes_played?: number;
  goals_scored?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
}

// Crear convocatorias para un partido
export const addPlayersToMatch = async (
  tenantId: string, 
  matchId: string, 
  convocations: ConvocationData[]
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const convocation of convocations) {
      const { player_id, position, is_starter = false, jersey_number, notes } = convocation;
      
      // Verificar que el jugador no esté ya convocado
      const existingConvocation = await client.query(
        'SELECT id FROM match_convocations WHERE match_id = $1 AND player_id = $2',
        [matchId, player_id]
      );
      
      if (existingConvocation.rowCount && existingConvocation.rowCount > 0) {
        throw new Error(`El jugador ya está convocado para este partido`);
      }
      
      // Verificar que el número de camiseta no esté ocupado
      if (jersey_number) {
        const existingNumber = await client.query(
          'SELECT id FROM match_convocations WHERE match_id = $1 AND jersey_number = $2',
          [matchId, jersey_number]
        );
        
        if (existingNumber.rowCount && existingNumber.rowCount > 0) {
          throw new Error(`El número de camiseta ${jersey_number} ya está ocupado`);
        }
      }
      
      const result = await client.query(
        `INSERT INTO match_convocations (
          id, tenant_id, match_id, player_id, position, 
          is_starter, jersey_number, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          uuidv4(), tenantId, matchId, player_id, position,
          is_starter, jersey_number, notes
        ]
      );
      
      results.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Agregar un jugador individual a un partido
export const addSinglePlayerToMatch = async (
  tenantId: string,
  matchId: string,
  convocation: ConvocationData
) => {
  return addPlayersToMatch(tenantId, matchId, [convocation]);
};

// Remover jugador de un partido
export const removePlayerFromMatch = async (
  tenantId: string, 
  matchId: string, 
  playerId: string
) => {
  const result = await pool.query(
    'DELETE FROM match_convocations WHERE match_id = $1 AND player_id = $2 AND tenant_id = $3',
    [matchId, playerId, tenantId]
  );
  
  if (!result.rowCount || result.rowCount === 0) {
    throw new Error('Convocatoria no encontrada');
  }
};

// Actualizar estado de convocatoria
export const updateConvocationStatus = async (
  tenantId: string, 
  convocationId: string, 
  updates: ConvocationUpdate
) => {
  const setClause = [];
  const values = [];
  let paramCount = 1;
  
  // Construir cláusula SET dinámicamente
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      setClause.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });
  
  if (setClause.length === 0) {
    throw new Error('No hay datos para actualizar');
  }
  
  // Agregar updated_at
  setClause.push(`updated_at = NOW()`);
  
  values.push(convocationId, tenantId);
  
  const query = `
    UPDATE match_convocations 
    SET ${setClause.join(', ')}
    WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (!result.rowCount || result.rowCount === 0) {
    throw new Error('Convocatoria no encontrada');
  }
  
  return result.rows[0];
};

// Confirmar asistencia de un jugador
export const confirmPlayerAttendance = async (
  tenantId: string,
  convocationId: string
) => {
  return updateConvocationStatus(tenantId, convocationId, {
    status: 'confirmado',
  });
};

// Marcar jugador como ausente
export const markPlayerAbsent = async (
  tenantId: string,
  convocationId: string,
  reason?: string
) => {
  return updateConvocationStatus(tenantId, convocationId, {
    status: 'ausente',
    notes: reason
  });
};

// Obtener historial de convocatorias de un jugador
export const getPlayerMatchHistory = async (
  tenantId: string, 
  playerId: string, 
  limit = 20
) => {
  const query = `
    SELECT 
      mc.*,
      m.fecha,
      m.lugar,
      m.competition,
      m.match_type,
      m.status as match_status,
      m.home_score,
      m.away_score,
      tl.nombre as equipo_local_nombre,
      tv.nombre as equipo_visitante_nombre,
      CASE 
        WHEN m.equipo_local_id = (
          SELECT DISTINCT pt.team_id 
          FROM player_teams pt 
          WHERE pt.player_id = mc.player_id 
          LIMIT 1
        ) THEN 'local'
        ELSE 'visitante'
      END as team_side
    FROM match_convocations mc
    JOIN matches m ON mc.match_id = m.id
    LEFT JOIN teams tl ON m.equipo_local_id = tl.id
    LEFT JOIN teams tv ON m.equipo_visitante_id = tv.id
    WHERE mc.player_id = $1 AND mc.tenant_id = $2
    ORDER BY m.fecha DESC, m.kickoff_time DESC
    LIMIT $3
  `;
  
  const result = await pool.query(query, [playerId, tenantId, limit]);
  return result.rows;
};

// Obtener estadísticas de convocatorias por jugador
export const getPlayerConvocationStats = async (tenantId: string, playerId: string) => {
  const result = await pool.query(
    'SELECT * FROM get_player_convocation_stats($1)',
    [playerId]
  );
  
  return result.rows[0] || {
    total_convocations: 0,
    total_confirmations: 0,
    total_absences: 0,
    total_minutes: 0,
    total_goals: 0,
    total_assists: 0,
    confirmation_rate: 0
  };
};

// Obtener convocatorias por estado
export const getConvocationsByStatus = async (
  tenantId: string,
  matchId: string,
  status: 'convocado' | 'confirmado' | 'ausente' | 'lesionado'
) => {
  const query = `
    SELECT 
      mc.*,
      p.nombre,
      p.apellido,
      p.foto_url,
      p.categoria
    FROM match_convocations mc
    JOIN players p ON mc.player_id = p.id
    WHERE mc.match_id = $1 AND mc.tenant_id = $2 AND mc.status = $3
    ORDER BY mc.is_starter DESC, p.apellido, p.nombre
  `;
  
  const result = await pool.query(query, [matchId, tenantId, status]);
  return result.rows;
};

// Actualizar estadísticas del partido para un jugador
export const updateMatchStats = async (
  tenantId: string,
  convocationId: string,
  stats: {
    minutes_played?: number;
    goals_scored?: number;
    assists?: number;
    yellow_cards?: number;
    red_cards?: number;
  }
) => {
  return updateConvocationStatus(tenantId, convocationId, stats);
};

// Duplicar convocatorias de un partido anterior
export const duplicateConvocationsFromMatch = async (
  tenantId: string,
  sourceMatchId: string,
  targetMatchId: string
) => {
  const query = `
    INSERT INTO match_convocations (
      id, tenant_id, match_id, player_id, position, 
      is_starter, notes, status
    )
    SELECT 
      gen_random_uuid(), tenant_id, $2, player_id, position,
      is_starter, notes, 'convocado'
    FROM match_convocations
    WHERE match_id = $1 AND tenant_id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [sourceMatchId, targetMatchId, tenantId]);
  return result.rows;
};

// Obtener jugadores titulares y suplentes
export const getStartingLineupAndSubs = async (tenantId: string, matchId: string) => {
  const query = `
    SELECT 
      mc.*,
      p.nombre,
      p.apellido,
      p.foto_url,
      p.categoria
    FROM match_convocations mc
    JOIN players p ON mc.player_id = p.id
    WHERE mc.match_id = $1 AND mc.tenant_id = $2 AND mc.status = 'confirmado'
    ORDER BY mc.is_starter DESC, mc.position, p.apellido, p.nombre
  `;
  
  const result = await pool.query(query, [matchId, tenantId]);
  
  const starters = result.rows.filter(player => player.is_starter);
  const substitutes = result.rows.filter(player => !player.is_starter);
  
  return {
    starters,
    substitutes,
    total: result.rows.length
  };
};
