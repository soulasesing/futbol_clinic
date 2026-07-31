import { PoolClient } from 'pg';
import { withTenantTransaction } from '../utils/db';

const toNumber = (value: unknown): number => Number(value ?? 0);

const getUpcomingBirthdays = (
  client: PoolClient,
  tenantId: string,
  coachId?: string
) => client.query(
  `WITH annual_birthdays AS (
     SELECT p.id, p.nombre, p.apellido, p.foto_url, p.fecha_nacimiento, p.categoria,
       TO_DATE(
         CONCAT(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, '-',
           TO_CHAR(p.fecha_nacimiento, 'MM-DD')),
         'YYYY-MM-DD'
       ) AS birthday_this_year
     FROM players p
     WHERE p.tenant_id = $1
       AND (
         $2::UUID IS NULL
         OR EXISTS (
           SELECT 1
           FROM player_teams pt
           JOIN coach_team_assignments cta
             ON cta.team_id = pt.team_id AND cta.tenant_id = pt.tenant_id
           WHERE pt.tenant_id = p.tenant_id
             AND pt.player_id = p.id
             AND cta.coach_id = $2
             AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
             AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
         )
       )
   ),
   upcoming_birthdays AS (
     SELECT *,
       CASE
         WHEN birthday_this_year >= CURRENT_DATE THEN birthday_this_year
         ELSE (birthday_this_year + INTERVAL '1 year')::DATE
       END AS next_birthday
     FROM annual_birthdays
   )
   SELECT id, nombre, apellido, foto_url, fecha_nacimiento, categoria,
     next_birthday,
     EXTRACT(YEAR FROM AGE(next_birthday, fecha_nacimiento))::INTEGER AS turns_years
   FROM upcoming_birthdays
   WHERE next_birthday <= CURRENT_DATE + 30
   ORDER BY next_birthday, nombre, apellido
   LIMIT 8`,
  [tenantId, coachId ?? null]
);

const mapBirthdays = (rows: Array<Record<string, unknown>>) =>
  rows.map((player) => ({
    id: player.id,
    name: `${player.nombre} ${player.apellido}`,
    photoUrl: player.foto_url ?? undefined,
    category: player.categoria,
    date: player.next_birthday,
    turnsYears: toNumber(player.turns_years),
  }));

export const getSummary = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const [counts, upcomingMatches, attendance] = await Promise.all([
      client.query(
        `SELECT
           (SELECT COUNT(*) FROM players WHERE tenant_id = $1) AS players,
           (SELECT COUNT(*) FROM teams WHERE tenant_id = $1) AS teams,
           (SELECT COUNT(*) FROM coaches WHERE tenant_id = $1) AS coaches,
           (SELECT COUNT(*) FROM matches WHERE tenant_id = $1) AS matches`,
        [tenantId]
      ),
      client.query(
        `SELECT * FROM matches
         WHERE tenant_id = $1 AND fecha > NOW()
         ORDER BY fecha ASC LIMIT 5`,
        [tenantId]
      ),
      client.query(
        'SELECT AVG(presente::INT) AS average FROM attendance WHERE tenant_id = $1',
        [tenantId]
      ),
    ]);
    const row = counts.rows[0];
    return {
      total_jugadores: toNumber(row.players),
      total_equipos: toNumber(row.teams),
      total_entrenadores: toNumber(row.coaches),
      total_partidos: toNumber(row.matches),
      partidos_proximos: upcomingMatches.rows,
      asistencia_promedio: toNumber(attendance.rows[0].average),
    };
  });

export const getAdminDashboard = async (tenantId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const [summaryResult, eventsResult, financeResult, birthdaysResult] = await Promise.all([
      client.query(
        `SELECT
           (SELECT COUNT(*) FROM players WHERE tenant_id = $1) AS players,
           (SELECT COUNT(*) FROM teams WHERE tenant_id = $1) AS teams,
           (SELECT COUNT(*) FROM trainings
             WHERE tenant_id = $1 AND fecha >= CURRENT_DATE) AS upcoming_trainings,
           (SELECT COUNT(*) FROM matches
             WHERE tenant_id = $1 AND fecha >= CURRENT_DATE
               AND COALESCE(status, 'scheduled') IN ('scheduled', 'confirmed')) AS upcoming_matches`,
        [tenantId]
      ),
      client.query(
        `SELECT id, title, starts_at, location, type
         FROM (
           SELECT tr.id, COALESCE(NULLIF(tr.descripcion, ''), 'Entrenamiento') AS title,
             (date_trunc('day', tr.fecha) + COALESCE(tr.hora_inicio, TIME '00:00')) AS starts_at,
             tr.lugar AS location, 'training'::TEXT AS type
           FROM trainings tr
           WHERE tr.tenant_id = $1 AND tr.fecha >= CURRENT_DATE
             AND COALESCE(tr.estado, 'programado') <> 'cancelado'
           UNION ALL
           SELECT m.id,
             CONCAT('Partido: ', COALESCE(home.nombre, 'Local'), ' vs ',
               COALESCE(away.nombre, 'Visitante')) AS title,
             (date_trunc('day', m.fecha) + COALESCE(m.kickoff_time, TIME '00:00')) AS starts_at,
             m.lugar AS location, 'match'::TEXT AS type
           FROM matches m
           LEFT JOIN teams home ON home.id = m.equipo_local_id AND home.tenant_id = $1
           LEFT JOIN teams away ON away.id = m.equipo_visitante_id AND away.tenant_id = $1
           WHERE m.tenant_id = $1 AND m.fecha >= CURRENT_DATE
             AND COALESCE(m.status, 'scheduled') IN ('scheduled', 'confirmed')
         ) events
         ORDER BY starts_at ASC
         LIMIT 10`,
        [tenantId]
      ),
      client.query(
        `WITH allocated AS (
           SELECT charge_id, SUM(amount_cents) AS paid_cents
           FROM payment_allocations
           WHERE tenant_id = $1
           GROUP BY charge_id
         )
         SELECT
           COALESCE(SUM(GREATEST(c.total_cents - COALESCE(a.paid_cents, 0), 0))
             FILTER (WHERE c.status IN ('open', 'partially_paid')), 0) AS outstanding_cents,
           COALESCE(SUM(GREATEST(c.total_cents - COALESCE(a.paid_cents, 0), 0))
             FILTER (WHERE c.status IN ('open', 'partially_paid')
               AND c.due_on < CURRENT_DATE), 0) AS overdue_cents,
           (SELECT COUNT(*) FROM payment_submissions
             WHERE tenant_id = $1 AND status = 'pending') AS pending_proofs,
           COALESCE(MIN(c.currency), 'USD') AS currency
         FROM charges c
         LEFT JOIN allocated a ON a.charge_id = c.id
         WHERE c.tenant_id = $1`,
        [tenantId]
      ),
      getUpcomingBirthdays(client, tenantId),
    ]);

    const summaryRow = summaryResult.rows[0];
    const financeRow = financeResult.rows[0];
    const summary = {
      players: toNumber(summaryRow.players),
      teams: toNumber(summaryRow.teams),
      upcomingTrainings: toNumber(summaryRow.upcoming_trainings),
      upcomingMatches: toNumber(summaryRow.upcoming_matches),
    };
    const finance = {
      outstandingAmount: toNumber(financeRow.outstanding_cents) / 100,
      overdueAmount: toNumber(financeRow.overdue_cents) / 100,
      pendingProofs: toNumber(financeRow.pending_proofs),
      currency: financeRow.currency as string,
    };
    const alerts = [];
    if (finance.pendingProofs > 0) {
      alerts.push({
        id: 'pending-proofs',
        title: 'Comprobantes pendientes',
        description: `${finance.pendingProofs} comprobantes requieren revisión.`,
        href: '/finanzas/comprobantes',
      });
    }
    if (finance.overdueAmount > 0) {
      alerts.push({
        id: 'overdue-balance',
        title: 'Cartera vencida',
        description: 'Hay cargos vencidos pendientes de pago.',
        href: '/finanzas/cartera',
      });
    }

    return {
      summary,
      metrics: [
        { key: 'players', label: 'Jugadores', value: summary.players },
        { key: 'teams', label: 'Equipos', value: summary.teams },
        { key: 'trainings', label: 'Próximos entrenamientos', value: summary.upcomingTrainings },
        { key: 'matches', label: 'Próximos partidos', value: summary.upcomingMatches },
      ],
      upcomingEvents: eventsResult.rows.map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.starts_at,
        location: event.location ?? undefined,
        type: event.type,
      })),
      birthdays: mapBirthdays(birthdaysResult.rows),
      alerts,
      finance,
    };
  });

export const getCoachDashboard = async (tenantId: string, userId: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const coachResult = await client.query(
      `SELECT c.id, c.nombre, c.apellido, u.nombre AS user_name
       FROM users u
       LEFT JOIN coaches c
         ON LOWER(c.email) = LOWER(u.email) AND c.tenant_id = $1
       WHERE u.id = $2 AND u.tenant_id = $1`,
      [tenantId, userId]
    );
    const identity = coachResult.rows[0];
    if (!identity) throw new Error('Usuario entrenador no encontrado');

    if (!identity.id) {
      return {
        coachName: identity.user_name,
        teams: [],
        agenda: [],
        birthdays: [],
        pendingAttendance: 0,
        pendingConvocations: 0,
      };
    }

    const coachId = identity.id as string;
    const [teamsResult, agendaResult, pendingResult, birthdaysResult] = await Promise.all([
      client.query(
        `SELECT t.id, t.nombre AS name, COUNT(DISTINCT pt.player_id) AS player_count
         FROM coach_team_assignments cta
         JOIN teams t ON t.id = cta.team_id AND t.tenant_id = $1
         LEFT JOIN player_teams pt ON pt.team_id = t.id AND pt.tenant_id = $1
         WHERE cta.tenant_id = $1 AND cta.coach_id = $2
           AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
           AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
         GROUP BY t.id, t.nombre
         ORDER BY t.nombre`,
        [tenantId, coachId]
      ),
      client.query(
        `SELECT id, title, starts_at, location, type, team_name,
           attendance_status, convocation_status
         FROM (
           SELECT tr.id, COALESCE(NULLIF(tr.descripcion, ''), 'Entrenamiento') AS title,
             (date_trunc('day', tr.fecha) + COALESCE(tr.hora_inicio, TIME '00:00')) AS starts_at,
             tr.lugar AS location, 'training'::TEXT AS type, t.nombre AS team_name,
             CASE WHEN EXISTS (
               SELECT 1 FROM attendance a
               WHERE a.training_id = tr.id AND a.tenant_id = $1
             ) THEN 'completed' ELSE 'pending' END AS attendance_status,
             NULL::TEXT AS convocation_status
           FROM trainings tr
           JOIN teams t ON t.id = tr.equipo_id AND t.tenant_id = $1
           WHERE tr.tenant_id = $1 AND tr.fecha >= CURRENT_DATE
             AND COALESCE(tr.estado, 'programado') <> 'cancelado'
             AND EXISTS (
               SELECT 1 FROM coach_team_assignments cta
               WHERE cta.tenant_id = $1 AND cta.coach_id = $2
                 AND cta.team_id = tr.equipo_id
                 AND (cta.starts_on IS NULL OR cta.starts_on <= tr.fecha::DATE)
                 AND (cta.ends_on IS NULL OR cta.ends_on >= tr.fecha::DATE)
             )
           UNION ALL
           SELECT m.id,
             CONCAT('Partido: ', COALESCE(home.nombre, 'Local'), ' vs ',
               COALESCE(away.nombre, 'Visitante')) AS title,
             (date_trunc('day', m.fecha) + COALESCE(m.kickoff_time, TIME '00:00')) AS starts_at,
             m.lugar AS location, 'match'::TEXT AS type,
             COALESCE(assigned_home.nombre, assigned_away.nombre) AS team_name,
             NULL::TEXT AS attendance_status,
             CASE WHEN EXISTS (
               SELECT 1 FROM match_convocations mc
               WHERE mc.match_id = m.id AND mc.tenant_id = $1
             ) THEN 'completed' ELSE 'pending' END AS convocation_status
           FROM matches m
           LEFT JOIN teams home ON home.id = m.equipo_local_id AND home.tenant_id = $1
           LEFT JOIN teams away ON away.id = m.equipo_visitante_id AND away.tenant_id = $1
           LEFT JOIN teams assigned_home ON assigned_home.id = m.equipo_local_id
             AND assigned_home.tenant_id = $1 AND EXISTS (
               SELECT 1 FROM coach_team_assignments cta
               WHERE cta.tenant_id = $1 AND cta.coach_id = $2
                 AND cta.team_id = assigned_home.id
             )
           LEFT JOIN teams assigned_away ON assigned_away.id = m.equipo_visitante_id
             AND assigned_away.tenant_id = $1 AND EXISTS (
               SELECT 1 FROM coach_team_assignments cta
               WHERE cta.tenant_id = $1 AND cta.coach_id = $2
                 AND cta.team_id = assigned_away.id
             )
           WHERE m.tenant_id = $1 AND m.fecha >= CURRENT_DATE
             AND COALESCE(m.status, 'scheduled') IN ('scheduled', 'confirmed')
             AND (assigned_home.id IS NOT NULL OR assigned_away.id IS NOT NULL)
         ) events
         ORDER BY starts_at ASC
         LIMIT 10`,
        [tenantId, coachId]
      ),
      client.query(
        `SELECT
           (SELECT COUNT(*)
            FROM trainings tr
            WHERE tr.tenant_id = $1
              AND tr.fecha::DATE BETWEEN CURRENT_DATE - 7 AND CURRENT_DATE
              AND EXISTS (
                SELECT 1 FROM coach_team_assignments cta
                WHERE cta.tenant_id = $1 AND cta.coach_id = $2
                  AND cta.team_id = tr.equipo_id
              )
              AND NOT EXISTS (
                SELECT 1 FROM attendance a
                WHERE a.tenant_id = $1 AND a.training_id = tr.id
              )) AS pending_attendance,
           (SELECT COUNT(*)
            FROM matches m
            WHERE m.tenant_id = $1 AND m.fecha >= CURRENT_DATE
              AND COALESCE(m.status, 'scheduled') IN ('scheduled', 'confirmed')
              AND EXISTS (
                SELECT 1 FROM coach_team_assignments cta
                WHERE cta.tenant_id = $1 AND cta.coach_id = $2
                  AND cta.team_id IN (m.equipo_local_id, m.equipo_visitante_id)
              )
              AND NOT EXISTS (
                SELECT 1 FROM match_convocations mc
                WHERE mc.tenant_id = $1 AND mc.match_id = m.id
              )) AS pending_convocations`,
        [tenantId, coachId]
      ),
      getUpcomingBirthdays(client, tenantId, coachId),
    ]);

    return {
      coachName: [identity.nombre, identity.apellido].filter(Boolean).join(' ') || identity.user_name,
      teams: teamsResult.rows.map((team) => ({
        id: team.id,
        name: team.name,
        playerCount: toNumber(team.player_count),
      })),
      agenda: agendaResult.rows.map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.starts_at,
        location: event.location ?? undefined,
        type: event.type,
        teamName: event.team_name ?? undefined,
        attendanceStatus: event.attendance_status ?? undefined,
        convocationStatus: event.convocation_status ?? undefined,
      })),
      birthdays: mapBirthdays(birthdaysResult.rows),
      pendingAttendance: toNumber(pendingResult.rows[0].pending_attendance),
      pendingConvocations: toNumber(pendingResult.rows[0].pending_convocations),
    };
  });