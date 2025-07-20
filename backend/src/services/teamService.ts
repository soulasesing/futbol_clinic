import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getTeams = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM teams WHERE tenant_id = $1', [tenantId]);
  return result.rows;
};

export const createTeam = async (tenantId: string, data: any) => {
  const { nombre, categoria, entrenador_id, descripcion } = data;
  const result = await pool.query(
    `INSERT INTO teams (id, tenant_id, nombre, categoria, entrenador_id, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [uuidv4(), tenantId, nombre, categoria, entrenador_id, descripcion]
  );
  return result.rows[0];
};

export const updateTeam = async (tenantId: string, id: string, data: any) => {
  const { nombre, categoria, entrenador_id, descripcion } = data;
  const result = await pool.query(
    `UPDATE teams SET nombre = $1, categoria = $2, entrenador_id = $3, descripcion = $4
     WHERE id = $5 AND tenant_id = $6 RETURNING *`,
    [nombre, categoria, entrenador_id, descripcion, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Equipo no encontrado');
  return result.rows[0];
};

export const deleteTeam = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM teams WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Equipo no encontrado');
}; 