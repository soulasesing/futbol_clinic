import { TransactionClient, withTenantTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getPlayers = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query('SELECT * FROM players WHERE tenant_id = $1', [tenantId]);
    return result.rows;
  });

export const getPlayerTeams = async (tenantId: string, playerId: string) =>
  withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `SELECT t.* FROM teams t
     INNER JOIN player_teams pt ON pt.team_id = t.id
     WHERE pt.player_id = $1 AND pt.tenant_id = $2 AND t.tenant_id = $2`,
    [playerId, tenantId]
  );
  return result.rows;
  });

const setPlayerTeamsWithClient = async (
  client: TransactionClient,
  tenantId: string,
  playerId: string,
  teamIds: string[]
) => {
  // Eliminar relaciones actuales
  await client.query('DELETE FROM player_teams WHERE player_id = $1 AND tenant_id = $2', [playerId, tenantId]);
  // Insertar nuevas relaciones
  for (const teamId of teamIds) {
    await client.query(
      `INSERT INTO player_teams (tenant_id, player_id, team_id)
       SELECT $1, p.id, t.id
       FROM players p
       JOIN teams t ON t.id = $3 AND t.tenant_id = $1
       WHERE p.id = $2 AND p.tenant_id = $1`,
      [tenantId, playerId, teamId]
    );
  }
};

export const setPlayerTeams = async (tenantId: string, playerId: string, teamIds: string[]) =>
  withTenantTransaction(tenantId, (client) =>
    setPlayerTeamsWithClient(client, tenantId, playerId, teamIds)
  );

const resolveCategory = async (
  client: TransactionClient,
  tenantId: string,
  requestedCategory: string | undefined,
  teamIds: unknown,
  playerId?: string
): Promise<string> => {
  if (requestedCategory) return requestedCategory;
  if (Array.isArray(teamIds) && teamIds.length > 0) {
    const teamResult = await client.query(
      'SELECT nombre FROM teams WHERE id = $1 AND tenant_id = $2',
      [teamIds[0], tenantId]
    );
    if (teamResult.rows[0]?.nombre) return teamResult.rows[0].nombre;
  }
  if (playerId) {
    const playerResult = await client.query(
      'SELECT categoria FROM players WHERE id = $1 AND tenant_id = $2',
      [playerId, tenantId]
    );
    if (playerResult.rows[0]?.categoria) return playerResult.rows[0].categoria;
  }
  return 'Sin categoría';
};

export const createPlayer = async (tenantId: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
  const { 
    nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url, 
    team_ids, categoria, correo_jugador, padre_nombre, padre_apellido, padre_email, 
    padre_telefono, madre_nombre, madre_apellido, madre_email, madre_telefono 
  } = data;
  const finalCategoria = await resolveCategory(client, tenantId, categoria, team_ids);
  const result = await client.query(
    `INSERT INTO players (
      id, tenant_id, nombre, apellido, cedula, fecha_nacimiento, categoria, 
      foto_url, document_url, correo_jugador, padre_nombre, padre_apellido, 
      padre_email, padre_telefono, madre_nombre, madre_apellido, madre_email, madre_telefono
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      uuidv4(), tenantId, nombre, apellido, cedula, fecha_nacimiento, finalCategoria,
      foto_url, document_url, correo_jugador, padre_nombre, padre_apellido,
      padre_email, padre_telefono, madre_nombre, madre_apellido, madre_email, madre_telefono
    ]
  );
  const player = result.rows[0];
  if (Array.isArray(team_ids) && team_ids.length > 0) {
    await setPlayerTeamsWithClient(client, tenantId, player.id, team_ids);
  }
  return player;
  });

export const updatePlayer = async (tenantId: string, id: string, data: any) =>
  withTenantTransaction(tenantId, async (client) => {
  const { 
    nombre, apellido, cedula, fecha_nacimiento, foto_url, document_url, 
    team_ids, categoria, correo_jugador, padre_nombre, padre_apellido, padre_email, 
    padre_telefono, madre_nombre, madre_apellido, madre_email, madre_telefono 
  } = data;
  const finalCategoria = await resolveCategory(client, tenantId, categoria, team_ids, id);
  const result = await client.query(
    `UPDATE players SET 
      nombre = $1, apellido = $2, cedula = $3, fecha_nacimiento = $4, 
      categoria = $5, foto_url = $6, document_url = $7, correo_jugador = $8, 
      padre_nombre = $9, padre_apellido = $10, padre_email = $11, padre_telefono = $12,
      madre_nombre = $13, madre_apellido = $14, madre_email = $15, madre_telefono = $16
    WHERE id = $17 AND tenant_id = $18 RETURNING *`,
    [
      nombre, apellido, cedula, fecha_nacimiento, finalCategoria, foto_url, 
      document_url, correo_jugador, padre_nombre, padre_apellido, padre_email, 
      padre_telefono, madre_nombre, madre_apellido, madre_email, madre_telefono,
      id, tenantId
    ]
  );
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  if (Array.isArray(team_ids)) {
    await setPlayerTeamsWithClient(client, tenantId, id, team_ids);
  }
  return result.rows[0];
  });

export const deletePlayer = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
  const result = await client.query('DELETE FROM players WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  });

export const getPlayerById = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
  const result = await client.query('SELECT * FROM players WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  return result.rows[0];
  });

export const getBirthdays = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
  // Cumpleaños del mes
  const monthRes = await client.query(
    `SELECT id, nombre, apellido, foto_url, fecha_nacimiento, categoria
     FROM players
     WHERE tenant_id = $1 AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
     ORDER BY EXTRACT(DAY FROM fecha_nacimiento)`,
    [tenantId]
  );
  // Próximos cumpleaños (próximos 15 días)
  const upcomingRes = await client.query(
    `SELECT id, nombre, apellido, foto_url, fecha_nacimiento, categoria
     FROM players
     WHERE tenant_id = $1 AND (
       (EXTRACT(DOY FROM fecha_nacimiento) >= EXTRACT(DOY FROM CURRENT_DATE) AND EXTRACT(DOY FROM fecha_nacimiento) <= EXTRACT(DOY FROM CURRENT_DATE) + 15)
       OR
       (EXTRACT(DOY FROM fecha_nacimiento) < EXTRACT(DOY FROM CURRENT_DATE) AND EXTRACT(DOY FROM fecha_nacimiento) + 365 <= EXTRACT(DOY FROM CURRENT_DATE) + 15)
     )
     ORDER BY EXTRACT(DOY FROM fecha_nacimiento)`,
    [tenantId]
  );
  return {
    mes: monthRes.rows,
    proximos: upcomingRes.rows.filter(p => !monthRes.rows.some(m => m.id === p.id)),
  };
  });