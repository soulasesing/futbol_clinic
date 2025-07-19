import { pool } from '../utils/db';

export const getCategories = async (tenantId: string) => {
  const result = await pool.query('SELECT * FROM categories WHERE tenant_id = $1 ORDER BY edad_min', [tenantId]);
  return result.rows;
};

export const createCategory = async (tenantId: string, data: any) => {
  const { nombre, edad_min, edad_max, anio_nacimiento_min, anio_nacimiento_max, descripcion } = data;
  const result = await pool.query(
    `INSERT INTO categories (tenant_id, nombre, edad_min, edad_max, anio_nacimiento_min, anio_nacimiento_max, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, nombre, edad_min, edad_max, anio_nacimiento_min, anio_nacimiento_max, descripcion]
  );
  return result.rows[0];
};

export const updateCategory = async (tenantId: string, id: string, data: any) => {
  const { nombre, edad_min, edad_max, anio_nacimiento_min, anio_nacimiento_max, descripcion } = data;
  const result = await pool.query(
    `UPDATE categories SET nombre = $1, edad_min = $2, edad_max = $3, anio_nacimiento_min = $4, anio_nacimiento_max = $5, descripcion = $6
     WHERE id = $7 AND tenant_id = $8 RETURNING *`,
    [nombre, edad_min, edad_max, anio_nacimiento_min, anio_nacimiento_max, descripcion, id, tenantId]
  );
  if (result.rowCount === 0) throw new Error('Categoría no encontrada');
  return result.rows[0];
};

export const deleteCategory = async (tenantId: string, id: string) => {
  const result = await pool.query('DELETE FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Categoría no encontrada');
};

export const getCategoryById = async (tenantId: string, id: string) => {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (result.rowCount === 0) throw new Error('Categoría no encontrada');
  return result.rows[0];
};

export const insertDefaultCategories = async (tenantId: string) => {
  const defaultCategories = [
    { nombre: 'Sub-6', edad_min: 5, edad_max: 6, anio_nacimiento_min: 2019, anio_nacimiento_max: 2019, descripcion: 'Iniciación, juegos lúdicos, primeros toques' },
    { nombre: 'Sub-7', edad_min: 6, edad_max: 7, anio_nacimiento_min: 2018, anio_nacimiento_max: 2018, descripcion: 'Coordinación, psicomotricidad con balón' },
    { nombre: 'Sub-8', edad_min: 7, edad_max: 8, anio_nacimiento_min: 2017, anio_nacimiento_max: 2017, descripcion: 'Mini partidos, reglas básicas, control y pase' },
    { nombre: 'Sub-9', edad_min: 8, edad_max: 9, anio_nacimiento_min: 2016, anio_nacimiento_max: 2016, descripcion: 'Posicionamiento básico, técnica individual' },
    { nombre: 'Sub-10', edad_min: 9, edad_max: 10, anio_nacimiento_min: 2015, anio_nacimiento_max: 2015, descripcion: 'Juego en equipo, táctica simple' },
    { nombre: 'Sub-11', edad_min: 10, edad_max: 11, anio_nacimiento_min: 2014, anio_nacimiento_max: 2014, descripcion: 'Mayor ritmo de juego, lectura básica táctica' },
    { nombre: 'Sub-12', edad_min: 11, edad_max: 12, anio_nacimiento_min: 2013, anio_nacimiento_max: 2013, descripcion: 'Juegos competitivos, estructura de equipo' },
    { nombre: 'Sub-13', edad_min: 12, edad_max: 13, anio_nacimiento_min: 2012, anio_nacimiento_max: 2012, descripcion: 'Competencias locales, técnica avanzada' },
    { nombre: 'Sub-14', edad_min: 13, edad_max: 14, anio_nacimiento_min: 2011, anio_nacimiento_max: 2011, descripcion: 'Sistemas de juego, roles definidos' },
    { nombre: 'Sub-15', edad_min: 14, edad_max: 15, anio_nacimiento_min: 2010, anio_nacimiento_max: 2010, descripcion: 'Mayor exigencia física y táctica' },
    { nombre: 'Sub-16', edad_min: 15, edad_max: 16, anio_nacimiento_min: 2009, anio_nacimiento_max: 2009, descripcion: 'Preparación competitiva' },
    { nombre: 'Sub-17', edad_min: 16, edad_max: 17, anio_nacimiento_min: 2008, anio_nacimiento_max: 2008, descripcion: 'Nivel pre-profesional, alto rendimiento' },
    { nombre: 'Sub-18/19', edad_min: 17, edad_max: 19, anio_nacimiento_min: 2006, anio_nacimiento_max: 2007, descripcion: 'Puerta a divisiones formativas de clubes profesionales' },
  ];

  for (const category of defaultCategories) {
    await createCategory(tenantId, category);
  }
}; 