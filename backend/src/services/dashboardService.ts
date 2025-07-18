import { pool } from '../utils/db';

export const getSummary = async (tenantId: string) => {
  const [players, teams, coaches, matches, upcomingMatches, avgAttendance] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM players WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT COUNT(*) FROM teams WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT COUNT(*) FROM coaches WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT COUNT(*) FROM matches WHERE tenant_id = $1', [tenantId]),
    pool.query('SELECT * FROM matches WHERE tenant_id = $1 AND fecha > NOW() ORDER BY fecha ASC LIMIT 5', [tenantId]),
    pool.query('SELECT AVG(CAST(presente AS INT)) as avg FROM attendance WHERE tenant_id = $1', [tenantId]),
  ]);
  return {
    total_jugadores: Number(players.rows[0].count),
    total_equipos: Number(teams.rows[0].count),
    total_entrenadores: Number(coaches.rows[0].count),
    total_partidos: Number(matches.rows[0].count),
    partidos_proximos: upcomingMatches.rows,
    asistencia_promedio: avgAttendance.rows[0].avg ? Number(avgAttendance.rows[0].avg) : 0,
  };
}; 