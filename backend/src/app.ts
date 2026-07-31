import { randomUUID } from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { pool } from './utils/db';
import authRoutes from './routes/authRoutes';
import invitationRoutes from './routes/invitationRoutes';
import playerRoutes from './routes/playerRoutes';
import teamRoutes from './routes/teamRoutes';
import coachRoutes from './routes/coachRoutes';
import matchRoutes from './routes/matchRoutes';
import trainingRoutes from './routes/trainingRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import statsRoutes from './routes/statsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import brandingRoutes from './routes/brandingRoutes';
import uploadRoutes from './routes/uploadRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tenantRoutes from './routes/tenantRoutes';
import path from 'node:path';
import physicalTestRoutes from './routes/physicalTestRoutes';
import domainRoutes from './routes/domainRoutes';
import familyPortalRoutes from './routes/familyPortalRoutes';
import paymentRoutes from './routes/paymentRoutes';
import v1DashboardRoutes from './routes/v1DashboardRoutes';

dotenv.config();

const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id')?.slice(0, 128) || randomUUID();
  const startedAt = process.hrtime.bigint();
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.on('finish', () => {
    if (process.env.NODE_ENV === 'test') return;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    process.stdout.write(`${JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    })}\n`);
  });
  next();
});

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS?.split(',') ?? []),
]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.trim().replace(/\/$/, ''));

if (process.env.NODE_ENV !== 'production' && configuredOrigins.length === 0) {
  configuredOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 600),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/ready',
}));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));

app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/physical-tests', physicalTestRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/api/upload', uploadRoutes);
app.use('/api/v1/dashboard', v1DashboardRoutes);
app.use('/api/v1/domain', domainRoutes);
app.use('/api/v1/finance', paymentRoutes);
app.use('/api/v1/family', familyPortalRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/ready', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    process.stderr.write(`${JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
    })}\n`);
  }
  res.status(500).json({ message: 'Internal server error' });
});

export default app; 