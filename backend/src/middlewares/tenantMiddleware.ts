import { Request, Response, NextFunction } from 'express';
import { pool } from '../utils/db';
import { AuthRequest } from './authMiddleware';

export const setTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.tenantId) {
    await pool.query('SET app.current_tenant = $1', [req.user.tenantId]);
  }
  next();
}; 