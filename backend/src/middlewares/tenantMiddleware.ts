import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const setTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'super_admin') {
    return next();
  }

  if (!req.user?.tenantId) {
    return res.status(403).json({ message: 'Tenant context required' });
  }

  // Database tenant context is deliberately established by
  // withTenantTransaction on the same client that runs the queries.
  next();
}; 