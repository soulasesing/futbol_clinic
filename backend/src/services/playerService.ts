import { TransactionClient, withTenantTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

const privateFileId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  return value.match(/^\/api\/upload\/files\/([0-9a-f-]{36})$/i)?.[1];
};

const attachPrivateFiles = async (
  client: TransactionClient,
  tenantId: string,
  playerId: string,
  photoUrl: unknown,
  documentUrl: unknown
): Promise<void> => {
  const files = [
    { id: privateFileId(photoUrl), type: 'player-photo' },
    { id: privateFileId(documentUrl), type: 'player-document' },
  ].filter((file): file is { id: string; type: string } => Boolean(file.id));
  for (const file of files) {
    await client.query(
      `UPDATE documents SET player_id = $1
       WHERE id = $2 AND tenant_id = $3 AND document_type = $4`,
      [playerId, file.id, tenantId, file.type]
    );
  }
};

const coachPlayerAccessSql = `
  EXISTS (
    SELECT 1
    FROM users u
    JOIN coaches c ON LOWER(c.email) = LOWER(u.email) AND c.tenant_id = u.tenant_id
    JOIN coach_team_assignments cta
      ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
    JOIN player_teams pt
      ON pt.team_id = cta.team_id AND pt.tenant_id = cta.tenant_id
    WHERE u.id = $2 AND u.tenant_id = p.tenant_id AND pt.player_id = p.id
      AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
      AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
  )`;

export const getPlayers = async (tenantId: string, coachUserId?: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const selection = coachUserId
      ? `p.id, p.nombre, p.apellido, p.fecha_nacimiento, p.categoria,
         p.foto_url, p.correo_jugador`
      : 'p.*';
    const result = await client.query(
      `SELECT ${selection}
       FROM players p
       WHERE p.tenant_id = $1
         AND ($2::UUID IS NULL OR ${coachPlayerAccessSql})
       ORDER BY p.nombre, p.apellido`,
      [tenantId, coachUserId ?? null]
    );
    return result.rows;
  });

export const getPlayerTeams = async (
  tenantId: string,
  playerId: string,
  coachUserId?: string
) =>
  withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `SELECT t.* FROM teams t
     INNER JOIN player_teams pt ON pt.team_id = t.id
     INNER JOIN players p ON p.id = pt.player_id AND p.tenant_id = pt.tenant_id
     WHERE pt.player_id = $1 AND pt.tenant_id = $2 AND t.tenant_id = $2
       AND ($3::UUID IS NULL OR EXISTS (
         SELECT 1
         FROM users u
         JOIN coaches c ON LOWER(c.email) = LOWER(u.email) AND c.tenant_id = u.tenant_id
         JOIN coach_team_assignments cta
           ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
         WHERE u.id = $3 AND u.tenant_id = $2 AND cta.team_id = t.id
           AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
           AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
       ))`,
    [playerId, tenantId, coachUserId ?? null]
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

export const createPlayer = async (
  tenantId: string,
  data: any,
  actorUserId: string
) =>
  withTenantTransaction(tenantId, async (client) => {
  if (data.privacy_consent_confirmed !== true) {
    throw new Error('Debes confirmar la autorización para tratar los datos del menor');
  }
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
  await attachPrivateFiles(client, tenantId, player.id, foto_url, document_url);
  await client.query(
    `INSERT INTO consents
       (tenant_id, player_id, consent_type, status, version, granted_at, metadata)
     VALUES ($1, $2, 'data_processing', 'granted', 'pilot-v1', NOW(), $3::jsonb)`,
    [
      tenantId,
      player.id,
      JSON.stringify({ source: 'academy_admin_attestation', actorUserId }),
    ]
  );
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
  await attachPrivateFiles(client, tenantId, id, foto_url, document_url);
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

export const getPlayerById = async (
  tenantId: string,
  id: string,
  coachUserId?: string
) =>
  withTenantTransaction(tenantId, async (client) => {
  const selection = coachUserId
    ? `p.id, p.nombre, p.apellido, p.fecha_nacimiento, p.categoria,
       p.foto_url, p.correo_jugador`
    : 'p.*';
  const result = await client.query(
    `SELECT ${selection} FROM players p
     WHERE p.id = $1 AND p.tenant_id = $2
       AND ($3::UUID IS NULL OR EXISTS (
         SELECT 1
         FROM users u
         JOIN coaches c ON LOWER(c.email) = LOWER(u.email) AND c.tenant_id = u.tenant_id
         JOIN coach_team_assignments cta
           ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
         JOIN player_teams pt
           ON pt.team_id = cta.team_id AND pt.tenant_id = cta.tenant_id
         WHERE u.id = $3 AND u.tenant_id = p.tenant_id AND pt.player_id = p.id
           AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
           AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
       ))`,
    [id, tenantId, coachUserId ?? null]
  );
  if (result.rowCount === 0) throw new Error('Jugador no encontrado');
  return result.rows[0];
  });

export const getBirthdays = async (tenantId: string, coachUserId?: string) =>
  withTenantTransaction(tenantId, async (client) => {
  // Cumpleaños del mes
  const monthRes = await client.query(
    `SELECT id, nombre, apellido, foto_url, fecha_nacimiento, categoria
     FROM players p
     WHERE p.tenant_id = $1
       AND ($2::UUID IS NULL OR ${coachPlayerAccessSql})
       AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
     ORDER BY EXTRACT(DAY FROM fecha_nacimiento)`,
    [tenantId, coachUserId ?? null]
  );
  // Próximos cumpleaños (próximos 15 días)
  const upcomingRes = await client.query(
    `SELECT id, nombre, apellido, foto_url, fecha_nacimiento, categoria
     FROM players p
     WHERE p.tenant_id = $1
       AND ($2::UUID IS NULL OR ${coachPlayerAccessSql})
       AND (
       (EXTRACT(DOY FROM fecha_nacimiento) >= EXTRACT(DOY FROM CURRENT_DATE) AND EXTRACT(DOY FROM fecha_nacimiento) <= EXTRACT(DOY FROM CURRENT_DATE) + 15)
       OR
       (EXTRACT(DOY FROM fecha_nacimiento) < EXTRACT(DOY FROM CURRENT_DATE) AND EXTRACT(DOY FROM fecha_nacimiento) + 365 <= EXTRACT(DOY FROM CURRENT_DATE) + 15)
     )
     ORDER BY EXTRACT(DOY FROM fecha_nacimiento)`,
    [tenantId, coachUserId ?? null]
  );
  return {
    mes: monthRes.rows,
    proximos: upcomingRes.rows.filter(p => !monthRes.rows.some(m => m.id === p.id)),
  };
  });

export const exportPlayerData = async (
  tenantId: string,
  playerId: string,
  actorUserId: string
) => withTenantTransaction(tenantId, async (client) => {
  const player = await client.query(
    'SELECT * FROM players WHERE id = $1 AND tenant_id = $2',
    [playerId, tenantId]
  );
  if (!player.rows[0]) throw new Error('Jugador no encontrado');
  const [teams, physicalTests, attendance, statistics, consents, documents, guardians] =
    await Promise.all([
      client.query(
        `SELECT t.id, t.nombre, t.categoria FROM teams t
         JOIN player_teams pt ON pt.team_id = t.id AND pt.tenant_id = t.tenant_id
         WHERE pt.player_id = $1 AND pt.tenant_id = $2`,
        [playerId, tenantId]
      ),
      client.query(
        'SELECT * FROM physical_tests WHERE player_id = $1 AND tenant_id = $2',
        [playerId, tenantId]
      ),
      client.query(
        'SELECT * FROM attendance WHERE player_id = $1 AND tenant_id = $2',
        [playerId, tenantId]
      ),
      client.query(
        'SELECT * FROM stats WHERE player_id = $1 AND tenant_id = $2',
        [playerId, tenantId]
      ),
      client.query(
        'SELECT * FROM consents WHERE player_id = $1 AND tenant_id = $2',
        [playerId, tenantId]
      ),
      client.query(
        `SELECT id, document_type, original_filename, mime_type, size_bytes,
                status, expires_at, created_at
         FROM documents WHERE player_id = $1 AND tenant_id = $2`,
        [playerId, tenantId]
      ),
      client.query(
        `SELECT g.id, g.first_name, g.last_name, g.email, g.phone,
                gp.relationship, gp.is_primary
         FROM guardian_players gp
         JOIN guardians g ON g.id = gp.guardian_id AND g.tenant_id = gp.tenant_id
         WHERE gp.player_id = $1 AND gp.tenant_id = $2`,
        [playerId, tenantId]
      ),
    ]);
  await client.query(
    `INSERT INTO audit_events
       (tenant_id, actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, 'privacy.export', 'player', $3, '{}'::jsonb)`,
    [tenantId, actorUserId, playerId]
  );
  return {
    exportedAt: new Date().toISOString(),
    player: player.rows[0],
    teams: teams.rows,
    physicalTests: physicalTests.rows,
    attendance: attendance.rows,
    statistics: statistics.rows,
    consents: consents.rows,
    documents: documents.rows,
    guardians: guardians.rows,
  };
});

export const getPlayerDocumentKeys = async (
  tenantId: string,
  playerId: string
): Promise<string[]> => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    'SELECT storage_key FROM documents WHERE player_id = $1 AND tenant_id = $2',
    [playerId, tenantId]
  );
  return result.rows.map((row) => row.storage_key as string);
});

export const erasePlayerData = async (
  tenantId: string,
  playerId: string,
  actorUserId: string,
  reason: string
): Promise<void> => withTenantTransaction(tenantId, async (client) => {
  const player = await client.query(
    `SELECT nombre, apellido FROM players
     WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
    [playerId, tenantId]
  );
  if (!player.rows[0]) throw new Error('Jugador no encontrado');
  await client.query(
    `INSERT INTO audit_events
       (tenant_id, actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, 'privacy.erase', 'player', $3, $4::jsonb)`,
    [
      tenantId,
      actorUserId,
      playerId,
      JSON.stringify({
        reason,
        deletedName: `${player.rows[0].nombre} ${player.rows[0].apellido}`,
      }),
    ]
  );
  await client.query(
    'DELETE FROM players WHERE id = $1 AND tenant_id = $2',
    [playerId, tenantId]
  );
});