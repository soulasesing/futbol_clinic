import { Request, Response, NextFunction } from 'express';
import * as jwtUtil from '../utils/jwt';
import { pool } from '../utils/db';

export interface AuthRequest extends Request {
  user?: jwtUtil.JwtPayload;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  let payload: jwtUtil.JwtPayload;
  try {
    const token = authHeader.split(' ')[1];
    payload = jwtUtil.verify(token);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  try {
    if (payload.tenantId) {
      const tenantResult = await pool.query(
        `SELECT status FROM tenants WHERE id = $1`,
        [payload.tenantId]
      );
      if (!tenantResult.rows[0] || tenantResult.rows[0].status !== 'active') {
        return res.status(403).json({
          code: 'TENANT_SUSPENDED',
          message: 'La escuela está suspendida. Contacta al administrador de la plataforma.',
        });
      }
    }
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin role required' });
    }
    next();
  });
};

export const requireSuperAdminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin role required' });
    }
    next();
  });
};

export const requireTenantAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (!req.user?.tenantId) {
      return res.status(403).json({ message: 'Tenant context required' });
    }
    next();
  });
};

export const requireRole = (...roles: jwtUtil.JwtPayload['role'][]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
