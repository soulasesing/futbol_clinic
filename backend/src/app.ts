import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import path from 'path';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// TODO: importar rutas y middlewares
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
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: 'DB connection failed', details: error });
  }
});

export default app; 