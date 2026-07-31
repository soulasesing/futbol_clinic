import { withTenantTransaction } from '../utils/db';

export interface PhysicalTestData {
  player_id: string;
  fecha_prueba: string;
  altura?: number;
  peso?: number;
  imc?: number;
  velocidad_40m?: number;
  agilidad_illinois?: number;
  salto_vertical?: number;
  yo_yo_test?: number;
  cooper_test?: number;
  flexiones?: number;
  abdominales?: number;
  precision_tiro?: number;
  control_balon?: number;
  pase_precision?: number;
  observaciones?: string;
  evaluador?: string;
}

const valuesFromData = (data: PhysicalTestData): unknown[] => [
  data.player_id,
  data.fecha_prueba,
  data.altura,
  data.peso,
  data.imc,
  data.velocidad_40m,
  data.agilidad_illinois,
  data.salto_vertical,
  data.yo_yo_test,
  data.cooper_test,
  data.flexiones,
  data.abdominales,
  data.precision_tiro,
  data.control_balon,
  data.pase_precision,
  data.observaciones,
  data.evaluador,
];

export const createPhysicalTest = async (
  tenantId: string,
  data: PhysicalTestData
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `INSERT INTO physical_tests (
      tenant_id, player_id, fecha_prueba, altura, peso, imc, velocidad_40m,
      agilidad_illinois, salto_vertical, yo_yo_test, cooper_test, flexiones,
      abdominales, precision_tiro, control_balon, pase_precision,
      observaciones, evaluador
    )
    SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18
    FROM players
    WHERE id = $2 AND tenant_id = $1
    RETURNING *`,
    [tenantId, ...valuesFromData(data)]
  );

  if (result.rowCount === 0) {
    throw new Error('Jugador no encontrado');
  }
  return result.rows[0];
});

export const getPlayerPhysicalTests = async (
  tenantId: string,
  playerId: string
) => withTenantTransaction(tenantId, async (client) => {
  const result = await client.query(
    `SELECT * FROM physical_tests
     WHERE player_id = $1 AND tenant_id = $2
     ORDER BY fecha_prueba DESC`,
    [playerId, tenantId]
  );
  return result.rows;
});

export const getPhysicalTest = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      'SELECT * FROM physical_tests WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0] ?? null;
  });

export const updatePhysicalTest = async (
  tenantId: string,
  id: string,
  data: PhysicalTestData
) => withTenantTransaction(tenantId, async (client) => {
  const values = valuesFromData(data).slice(1);
  const result = await client.query(
    `UPDATE physical_tests SET
      fecha_prueba = $1, altura = $2, peso = $3, imc = $4,
      velocidad_40m = $5, agilidad_illinois = $6, salto_vertical = $7,
      yo_yo_test = $8, cooper_test = $9, flexiones = $10,
      abdominales = $11, precision_tiro = $12, control_balon = $13,
      pase_precision = $14, observaciones = $15, evaluador = $16
    WHERE id = $17 AND tenant_id = $18
    RETURNING *`,
    [...values, id, tenantId]
  );
  return result.rows[0] ?? null;
});

export const deletePhysicalTest = async (tenantId: string, id: string) =>
  withTenantTransaction(tenantId, async (client) => {
    const result = await client.query(
      'DELETE FROM physical_tests WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    return result.rowCount !== 0;
  });
