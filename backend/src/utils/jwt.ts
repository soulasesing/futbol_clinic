import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_EXPIRES_IN = '7d';
const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'coach', 'parent']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface JwtPayload {
  userId: string;
  tenantId: string | null;
  role: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
};

export const sign = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verify = (token: string): JwtPayload => {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
  });

  if (
    typeof payload === 'string'
    || typeof payload.userId !== 'string'
    || typeof payload.role !== 'string'
    || !ALLOWED_ROLES.has(payload.role)
    || (
      payload.role !== 'super_admin'
      && (typeof payload.tenantId !== 'string' || !UUID_PATTERN.test(payload.tenantId))
    )
    || (payload.role === 'super_admin' && payload.tenantId != null)
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    userId: payload.userId,
    tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : null,
    role: payload.role,
  };
}; 