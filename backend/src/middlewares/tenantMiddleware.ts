import { Request, Response, NextFunction } from 'express';
import { pool } from '../utils/db';
import { AuthRequest } from './authMiddleware';

export const setTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.tenantId) {
    // Interpolar el tenantId directamente (Postgres no permite $1 en SET)
    await pool.query(`SET app.current_tenant = '${req.user.tenantId}'`);
  }
  next();
}; 