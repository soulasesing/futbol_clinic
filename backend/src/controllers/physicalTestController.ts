import { Request, Response } from 'express';
import { pool } from '../utils/db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createPhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const {
      player_id,
      fecha_prueba,
      altura,
      peso,
      imc,
      velocidad_40m,
      agilidad_illinois,
      salto_vertical,
      yo_yo_test,
      cooper_test,
      flexiones,
      abdominales,
      precision_tiro,
      control_balon,
      pase_precision,
      observaciones,
      evaluador,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO physical_tests (
        tenant_id,
        player_id,
        fecha_prueba,
        altura,
        peso,
        imc,
        velocidad_40m,
        agilidad_illinois,
        salto_vertical,
        yo_yo_test,
        cooper_test,
        flexiones,
        abdominales,
        precision_tiro,
        control_balon,
        pase_precision,
        observaciones,
        evaluador
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
      RETURNING *`,
      [
        tenantId,
        player_id,
        fecha_prueba,
        altura,
        peso,
        imc,
        velocidad_40m,
        agilidad_illinois,
        salto_vertical,
        yo_yo_test,
        cooper_test,
        flexiones,
        abdominales,
        precision_tiro,
        control_balon,
        pase_precision,
        observaciones,
        evaluador,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerPhysicalTests = async (req: AuthRequest, res: Response) => {
  try {
    const { playerId } = req.params;
    const result = await pool.query(
      'SELECT * FROM physical_tests WHERE player_id = $1 ORDER BY fecha_prueba DESC',
      [playerId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM physical_tests WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prueba física no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fecha_prueba,
      altura,
      peso,
      imc,
      velocidad_40m,
      agilidad_illinois,
      salto_vertical,
      yo_yo_test,
      cooper_test,
      flexiones,
      abdominales,
      precision_tiro,
      control_balon,
      pase_precision,
      observaciones,
      evaluador,
    } = req.body;

    const result = await pool.query(
      `UPDATE physical_tests SET
        fecha_prueba = $1,
        altura = $2,
        peso = $3,
        imc = $4,
        velocidad_40m = $5,
        agilidad_illinois = $6,
        salto_vertical = $7,
        yo_yo_test = $8,
        cooper_test = $9,
        flexiones = $10,
        abdominales = $11,
        precision_tiro = $12,
        control_balon = $13,
        pase_precision = $14,
        observaciones = $15,
        evaluador = $16
      WHERE id = $17 RETURNING *`,
      [
        fecha_prueba,
        altura,
        peso,
        imc,
        velocidad_40m,
        agilidad_illinois,
        salto_vertical,
        yo_yo_test,
        cooper_test,
        flexiones,
        abdominales,
        precision_tiro,
        control_balon,
        pase_precision,
        observaciones,
        evaluador,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prueba física no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePhysicalTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM physical_tests WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prueba física no encontrada' });
    }

    res.json({ message: 'Prueba física eliminada correctamente' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 