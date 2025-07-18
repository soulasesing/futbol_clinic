import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
}

export const sign = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verify = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}; 