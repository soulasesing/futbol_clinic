import { Request, Response, NextFunction } from 'express';
import { pool } from '../utils/db';
import { AuthRequest } from './authMiddleware';

export const setTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Si es super_admin, no setea tenant
  if (req.user?.role === 'super_admin') {
    return next();
  }
  if (req.user?.tenantId) {
    // Interpolar el tenantId directamente (Postgres no permite $1 en SET)
    await pool.query(`SET app.current_tenant = '${req.user.tenantId}'`);
  }
  next();
}; 