import { withTenantTransaction } from '../utils/db';
import { Actor } from './domainService';

interface RsvpEvent {
  type: 'training' | 'match';
  eventId: string;
  playerId: string;
}

const requireParent = (actor: Actor): void => {
  if (actor.role !== 'parent') {
    throw new Error('FORBIDDEN: El portal familiar requiere rol parent');
  }
};

const parseRsvpEvent = (value: string): RsvpEvent => {
  const [type, eventId, playerId, ...rest] = value.split(':');
  if (
    rest.length > 0
    || (type !== 'training' && type !== 'match')
    || !eventId
    || !playerId
  ) {
    throw new Error('VALIDATION: Evento inválido');
  }
  return { type, eventId, playerId };
};

const numeric = (value: unknown): number => Number(value ?? 0);
const metricValue = (value: unknown, unit: string): string | undefined =>
  typeof value === 'string' || typeof value === 'number' ? `${value}${unit}` : undefined;

export const getPortal = async (actor: Actor): Promise<unknown> => {
  requireParent(actor);
  return withTenantTransaction(actor.tenantId, async (client) => {
    const childrenResult = await client.query(
      `SELECT DISTINCT p.id, concat_ws(' ', p.nombre, p.apellido) AS name,
              p.foto_url AS photo_url,
              teams.team_name
       FROM guardians g
       JOIN guardian_players gp
         ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
       JOIN players p ON p.id = gp.player_id AND p.tenant_id = gp.tenant_id
       LEFT JOIN LATERAL (
         SELECT string_agg(t.nombre, ', ' ORDER BY t.nombre) AS team_name
         FROM player_teams pt
         JOIN teams t ON t.id = pt.team_id AND t.tenant_id = pt.tenant_id
         WHERE pt.player_id = p.id AND pt.tenant_id = p.tenant_id
       ) teams ON TRUE
       WHERE g.tenant_id = $1 AND g.user_id = $2
       ORDER BY name`,
      [actor.tenantId, actor.userId]
    );

    const trainingResult = await client.query(
      `SELECT DISTINCT tr.id, p.id AS child_id,
              concat_ws(' ', p.nombre, p.apellido) AS child_name,
              COALESCE(NULLIF(tr.descripcion, ''), 'Entrenamiento') AS title,
              (tr.fecha::date + COALESCE(tr.hora_inicio, TIME '00:00')) AS starts_at,
              tr.lugar AS location, COALESCE(fr.response, 'pending') AS rsvp
       FROM guardians g
       JOIN guardian_players gp
         ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
       JOIN players p ON p.id = gp.player_id AND p.tenant_id = gp.tenant_id
       JOIN player_teams pt ON pt.player_id = p.id AND pt.tenant_id = p.tenant_id
       JOIN trainings tr ON tr.equipo_id = pt.team_id AND tr.tenant_id = pt.tenant_id
       LEFT JOIN family_event_rsvps fr
         ON fr.tenant_id = tr.tenant_id AND fr.guardian_id = g.id
        AND fr.player_id = p.id AND fr.event_type = 'training' AND fr.event_id = tr.id
       WHERE g.tenant_id = $1 AND g.user_id = $2
         AND tr.fecha::date >= CURRENT_DATE
         AND COALESCE(tr.estado, 'programado') <> 'cancelado'
       ORDER BY starts_at
       LIMIT 50`,
      [actor.tenantId, actor.userId]
    );

    const matchResult = await client.query(
      `SELECT DISTINCT m.id, p.id AS child_id,
              concat_ws(' ', p.nombre, p.apellido) AS child_name,
              concat_ws(' vs ', home.nombre, away.nombre) AS title,
              (m.fecha::date + COALESCE(m.kickoff_time, m.fecha::time)) AS starts_at,
              m.lugar AS location, COALESCE(fr.response, 'pending') AS rsvp
       FROM guardians g
       JOIN guardian_players gp
         ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
       JOIN players p ON p.id = gp.player_id AND p.tenant_id = gp.tenant_id
       JOIN matches m ON m.tenant_id = p.tenant_id
         AND (
           EXISTS (
             SELECT 1 FROM player_teams pt
             WHERE pt.tenant_id = p.tenant_id AND pt.player_id = p.id
               AND pt.team_id IN (m.equipo_local_id, m.equipo_visitante_id)
           )
           OR EXISTS (
             SELECT 1 FROM match_convocations mc
             WHERE mc.tenant_id = p.tenant_id AND mc.match_id = m.id
               AND mc.player_id = p.id
           )
         )
       LEFT JOIN teams home
         ON home.id = m.equipo_local_id AND home.tenant_id = m.tenant_id
       LEFT JOIN teams away
         ON away.id = m.equipo_visitante_id AND away.tenant_id = m.tenant_id
       LEFT JOIN family_event_rsvps fr
         ON fr.tenant_id = m.tenant_id AND fr.guardian_id = g.id
        AND fr.player_id = p.id AND fr.event_type = 'match' AND fr.event_id = m.id
       WHERE g.tenant_id = $1 AND g.user_id = $2
         AND m.fecha >= CURRENT_DATE
         AND COALESCE(m.status, 'scheduled') IN ('scheduled', 'confirmed')
       ORDER BY starts_at
       LIMIT 50`,
      [actor.tenantId, actor.userId]
    );

    const accountsResult = await client.query(
      `SELECT id, name, account_type, instructions, bank_name, account_holder,
              account_number, wallet_identifier, qr_url, currency
       FROM payment_accounts
       WHERE tenant_id = $1 AND is_active = TRUE
         AND EXISTS (
           SELECT 1 FROM guardians g
           JOIN guardian_players gp
             ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
           WHERE g.tenant_id = $1 AND g.user_id = $2
             AND gp.can_view_finances = TRUE
         )
       ORDER BY display_order, name`,
      [actor.tenantId, actor.userId]
    );

    const chargesResult = await client.query(
      `SELECT c.id, c.description AS concept, c.player_id,
              concat_ws(' ', p.nombre, p.apellido) AS child_name,
              c.currency, c.total_cents, c.due_on,
              c.total_cents - COALESCE(SUM(pa.amount_cents), 0) AS balance_cents,
              CASE
                WHEN c.status = 'paid' THEN 'paid'
                WHEN EXISTS (
                  SELECT 1 FROM payment_submissions ps
                  WHERE ps.tenant_id = c.tenant_id AND ps.charge_id = c.id
                    AND ps.status = 'pending'
                ) THEN 'proof_pending'
                WHEN c.due_on < CURRENT_DATE THEN 'overdue'
                ELSE 'pending'
              END AS portal_status
       FROM charges c
       JOIN guardians g
         ON g.household_id = c.household_id AND g.tenant_id = c.tenant_id
       LEFT JOIN players p ON p.id = c.player_id AND p.tenant_id = c.tenant_id
       LEFT JOIN payment_allocations pa
         ON pa.charge_id = c.id AND pa.tenant_id = c.tenant_id
       WHERE c.tenant_id = $1 AND g.user_id = $2 AND c.status <> 'void'
         AND EXISTS (
           SELECT 1 FROM guardian_players permission
           WHERE permission.tenant_id = g.tenant_id
             AND permission.guardian_id = g.id
             AND permission.can_view_finances = TRUE
         )
       GROUP BY c.id, p.nombre, p.apellido
       ORDER BY c.due_on NULLS LAST, c.created_at`,
      [actor.tenantId, actor.userId]
    );

    const receiptsResult = await client.query(
      `SELECT r.id, r.receipt_number, r.issued_at, p.amount_cents, p.currency,
              COALESCE(c.description, 'Pago registrado') AS concept
       FROM payment_receipts r
       JOIN payments p ON p.id = r.payment_id AND p.tenant_id = r.tenant_id
       JOIN guardians g
         ON g.household_id = p.household_id AND g.tenant_id = p.tenant_id
       LEFT JOIN charges c
         ON c.id = (r.snapshot->>'chargeId')::uuid AND c.tenant_id = r.tenant_id
       WHERE r.tenant_id = $1 AND g.user_id = $2
         AND EXISTS (
           SELECT 1 FROM guardian_players permission
           WHERE permission.tenant_id = g.tenant_id
             AND permission.guardian_id = g.id
             AND permission.can_view_finances = TRUE
         )
       ORDER BY r.issued_at DESC`,
      [actor.tenantId, actor.userId]
    );

    const notificationsResult = await client.query(
      `SELECT DISTINCT n.id, COALESCE(n.subject, 'Aviso') AS title,
              n.body, n.created_at AS published_at
       FROM notifications n
       LEFT JOIN guardians g
         ON g.household_id = n.household_id AND g.tenant_id = n.tenant_id
       WHERE n.tenant_id = $1
         AND (n.user_id = $2 OR g.user_id = $2)
         AND n.status NOT IN ('failed', 'cancelled')
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [actor.tenantId, actor.userId]
    );

    const testsResult = await client.query(
      `SELECT ranked.*
       FROM (
         SELECT pt.*, p.nombre, p.apellido,
                row_number() OVER (
                  PARTITION BY pt.player_id ORDER BY pt.fecha_prueba DESC, pt.created_at DESC
                ) AS test_rank
         FROM physical_tests pt
         JOIN players p ON p.id = pt.player_id AND p.tenant_id = pt.tenant_id
         JOIN guardian_players gp
           ON gp.player_id = p.id AND gp.tenant_id = p.tenant_id
         JOIN guardians g
           ON g.id = gp.guardian_id AND g.tenant_id = gp.tenant_id
         WHERE pt.tenant_id = $1 AND g.user_id = $2
       ) ranked
       WHERE ranked.test_rank <= 2
       ORDER BY ranked.player_id, ranked.test_rank`,
      [actor.tenantId, actor.userId]
    );

    const previousByPlayer = new Map<string, Record<string, unknown>>();
    for (const row of testsResult.rows) {
      if (Number(row.test_rank) === 2) previousByPlayer.set(String(row.player_id), row);
    }
    const metrics: Array<[string, string, string]> = [
      ['peso', 'Peso', ' kg'],
      ['velocidad_40m', 'Velocidad 40 m', ' s'],
      ['salto_vertical', 'Salto vertical', ' cm'],
      ['cooper_test', 'Test de Cooper', ' m'],
      ['precision_tiro', 'Precisión de tiro', '/10'],
      ['control_balon', 'Control de balón', '/10'],
      ['pase_precision', 'Precisión de pase', '/10'],
    ];
    const progress = testsResult.rows
      .filter((row) => Number(row.test_rank) === 1)
      .flatMap((row) => {
        const previous = previousByPlayer.get(String(row.player_id));
        return metrics
          .filter(([column]) => row[column] != null)
          .map(([column, label, unit]) => ({
            childId: row.player_id,
            childName: `${row.nombre} ${row.apellido}`,
            metric: label,
            value: metricValue(row[column], unit) as string,
            previousValue: metricValue(previous?.[column], unit),
            recordedAt: row.fecha_prueba,
          }));
      });

    const children = childrenResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      teamName: row.team_name ?? undefined,
      photoUrl: row.photo_url ?? undefined,
    }));
    const agenda = [
      ...trainingResult.rows.map((row) => ({
        id: `training:${row.id}:${row.child_id}`,
        childId: row.child_id,
        childName: row.child_name,
        title: row.title,
        startsAt: row.starts_at,
        location: row.location ?? undefined,
        rsvp: row.rsvp,
        rsvpEnabled: true,
      })),
      ...matchResult.rows.map((row) => ({
        id: `match:${row.id}:${row.child_id}`,
        childId: row.child_id,
        childName: row.child_name,
        title: row.title,
        startsAt: row.starts_at,
        location: row.location ?? undefined,
        rsvp: row.rsvp,
        rsvpEnabled: true,
      })),
    ].sort((left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
    );
    const charges = chargesResult.rows.map((row) => ({
      id: row.id,
      concept: row.concept,
      childName: row.child_name || undefined,
      amount: numeric(row.balance_cents) / 100,
      amountCents: numeric(row.balance_cents),
      currency: row.currency,
      dueDate: row.due_on,
      status: row.portal_status,
    }));
    const currencies = new Set(charges.map((charge) => charge.currency));
    const currency = currencies.size === 1 ? charges[0]?.currency : 'USD';

    return {
      children,
      agenda,
      finances: {
        currency,
        balance: charges
          .filter((charge) => charge.status !== 'paid')
          .reduce((sum, charge) => sum + charge.amount, 0),
        charges,
        accounts: accountsResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          accountType: row.account_type,
          bankName: row.bank_name,
          accountHolder: row.account_holder,
          accountNumber: row.account_number,
          walletIdentifier: row.wallet_identifier,
          qrUrl: row.qr_url,
          instructions: row.instructions,
          currency: row.currency,
        })),
        receipts: receiptsResult.rows.map((row) => ({
          id: row.id,
          number: row.receipt_number,
          issuedAt: row.issued_at,
          amount: numeric(row.amount_cents) / 100,
          amountCents: numeric(row.amount_cents),
          currency: row.currency,
          concept: row.concept,
        })),
      },
      announcements: notificationsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        publishedAt: row.published_at,
      })),
      progress,
    };
  });
};

export const updateRsvp = async (
  actor: Actor,
  encodedEventId: string,
  response: 'yes' | 'no'
): Promise<unknown> => {
  requireParent(actor);
  const event = parseRsvpEvent(encodedEventId);
  return withTenantTransaction(actor.tenantId, async (client) => {
    const guardianResult = await client.query(
      `SELECT g.id
       FROM guardians g
       JOIN guardian_players gp
         ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
       WHERE g.tenant_id = $1 AND g.user_id = $2 AND gp.player_id = $3`,
      [actor.tenantId, actor.userId, event.playerId]
    );
    const guardian = guardianResult.rows[0];
    if (!guardian) throw new Error('FORBIDDEN: Sin acceso al deportista');

    const eventResult = event.type === 'training'
      ? await client.query(
        `SELECT 1 FROM trainings tr
         JOIN player_teams pt
           ON pt.team_id = tr.equipo_id AND pt.tenant_id = tr.tenant_id
         WHERE tr.id = $1 AND tr.tenant_id = $2 AND pt.player_id = $3
           AND tr.fecha::date >= CURRENT_DATE`,
        [event.eventId, actor.tenantId, event.playerId]
      )
      : await client.query(
        `SELECT 1 FROM matches m
         WHERE m.id = $1 AND m.tenant_id = $2 AND m.fecha >= CURRENT_DATE
           AND (
             EXISTS (
               SELECT 1 FROM player_teams pt
               WHERE pt.tenant_id = m.tenant_id AND pt.player_id = $3
                 AND pt.team_id IN (m.equipo_local_id, m.equipo_visitante_id)
             )
             OR EXISTS (
               SELECT 1 FROM match_convocations mc
               WHERE mc.tenant_id = m.tenant_id AND mc.match_id = m.id
                 AND mc.player_id = $3
             )
           )`,
        [event.eventId, actor.tenantId, event.playerId]
      );
    if (!eventResult.rows[0]) throw new Error('NOT_FOUND: Evento no encontrado');

    const result = await client.query(
      `INSERT INTO family_event_rsvps
         (tenant_id, guardian_id, player_id, event_type, event_id, response)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (tenant_id, guardian_id, player_id, event_type, event_id)
       DO UPDATE SET response = EXCLUDED.response, responded_at = NOW()
       RETURNING response, responded_at`,
      [
        actor.tenantId,
        guardian.id,
        event.playerId,
        event.type,
        event.eventId,
        response,
      ]
    );
    return {
      eventId: encodedEventId,
      response: result.rows[0].response,
      respondedAt: result.rows[0].responded_at,
    };
  });
};
