import { pool } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const getTrainings = async (tenantId: string) => {
  const query = `
    SELECT t.*, e.nombre as equipo_nombre, e.categoria as equipo_categoria 
    FROM trainings t 
    LEFT JOIN teams e ON t.equipo_id = e.id 
    WHERE t.tenant_id = $1
    ORDER BY t.fecha ASC, t.hora_inicio ASC
  `;
  
  const result = await pool.query(query, [tenantId]);
  return result.rows;
};

export const createTraining = async (tenantId: string, data: any) => {
  const {
    equipo_id,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    descripcion,
    es_recurrente,
    dia_semana,
    fecha_fin,
    color = '#2563eb', // Azul por defecto
    estado = 'programado'
  } = data;

  // Si no es recurrente, crear un solo entrenamiento
  if (!es_recurrente) {
    const result = await pool.query(
      `INSERT INTO trainings (
        id, tenant_id, equipo_id, fecha, hora_inicio, hora_fin,
        lugar, descripcion, es_recurrente, color, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        uuidv4(), tenantId, equipo_id, fecha, hora_inicio, hora_fin,
        lugar, descripcion, false, color, estado
      ]
    );
    return result.rows[0];
  }

  // Para entrenamientos recurrentes, crear uno para cada fecha hasta fecha_fin
  const startDate = new Date(fecha);
  const endDate = new Date(fecha_fin);
  const trainings = [];

  // Mapear nombres de días a números (0 = domingo, 6 = sábado)
  const dayMap: { [key: string]: number } = {
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sabado': 6
  };

  const targetDay = dayMap[dia_semana.toLowerCase()];
  let currentDate = new Date(startDate);

  // Crear un entrenamiento para cada fecha que coincida con el día de la semana
  while (currentDate <= endDate) {
    if (currentDate.getDay() === targetDay) {
      const trainingDate = currentDate.toISOString().split('T')[0];
      
      const result = await pool.query(
        `INSERT INTO trainings (
          id, tenant_id, equipo_id, fecha, hora_inicio, hora_fin,
          lugar, descripcion, es_recurrente, color, estado, dia_semana
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          uuidv4(), tenantId, equipo_id, trainingDate, hora_inicio, hora_fin,
          lugar, descripcion, true, color, estado, dia_semana
        ]
      );
      
      trainings.push(result.rows[0]);
    }
    
    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trainings;
};

export const updateTraining = async (tenantId: string, id: string, data: any) => {
  const {
    equipo_id,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    descripcion,
    es_recurrente,
    dia_semana,
    fecha_fin,
    color,
    estado,
    updateAll = false // Si es true, actualiza todos los entrenamientos recurrentes futuros
  } = data;

  // Primero, obtener el entrenamiento actual
  const currentTraining = await pool.query(
    'SELECT * FROM trainings WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  if (currentTraining.rowCount === 0) {
    throw new Error('Entrenamiento no encontrado');
  }

  const training = currentTraining.rows[0];

  // Si es recurrente y quieren actualizar todos los futuros
  if (training.es_recurrente && updateAll) {
    // Eliminar todos los entrenamientos futuros del mismo día de la semana
    await pool.query(
      `DELETE FROM trainings 
       WHERE tenant_id = $1 
       AND es_recurrente = true 
       AND dia_semana = $2 
       AND fecha >= $3`,
      [tenantId, training.dia_semana, fecha]
    );

    // Crear nuevos entrenamientos con los datos actualizados
    return createTraining(tenantId, {
      equipo_id,
      fecha,
      hora_inicio,
      hora_fin,
      lugar,
      descripcion,
      es_recurrente: true,
      dia_semana,
      fecha_fin,
      color,
      estado
    });
  }

  // Si no es recurrente o solo quieren actualizar este entrenamiento específico
  const result = await pool.query(
    `UPDATE trainings SET 
      equipo_id = $1, fecha = $2, hora_inicio = $3, hora_fin = $4,
      lugar = $5, descripcion = $6, color = $7, estado = $8
    WHERE id = $9 AND tenant_id = $10 
    RETURNING *`,
    [
      equipo_id, fecha, hora_inicio, hora_fin, lugar, descripcion,
      color, estado, id, tenantId
    ]
  );
  
  return result.rows[0];
};

export const deleteTraining = async (tenantId: string, id: string, deleteAll = false) => {
  // Primero, obtener el entrenamiento
  const currentTraining = await pool.query(
    'SELECT * FROM trainings WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  if (currentTraining.rowCount === 0) {
    throw new Error('Entrenamiento no encontrado');
  }

  const training = currentTraining.rows[0];

  // Si es recurrente y quieren eliminar todos los futuros
  if (training.es_recurrente && deleteAll) {
    await pool.query(
      `DELETE FROM trainings 
       WHERE tenant_id = $1 
       AND es_recurrente = true 
       AND dia_semana = $2 
       AND fecha >= $3`,
      [tenantId, training.dia_semana, training.fecha]
    );
    return { message: 'Entrenamientos eliminados correctamente' };
  }

  // Si no es recurrente o solo quieren eliminar este específico
  await pool.query(
    'DELETE FROM trainings WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  return { message: 'Entrenamiento eliminado correctamente' };
}; 