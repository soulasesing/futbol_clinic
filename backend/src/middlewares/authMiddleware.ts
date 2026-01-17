import { Request, Response, NextFunction } from 'express';
import * as jwtUtil from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: jwtUtil.JwtPayload;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwtUtil.verify(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
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