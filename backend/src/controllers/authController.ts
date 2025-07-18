import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { token, nombre, password } = req.body;
    if (!token || !nombre || !password) {
      return res.status(400).json({ message: 'Faltan datos para registro' });
    }
    const result = await authService.registerViaInvitation(token, nombre, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, tenantId } = req.body;
    if (!email || !password || !tenantId) {
      return res.status(400).json({ message: 'Faltan datos para login' });
    }
    const result = await authService.login(email, password, tenantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, tenantId } = req.body;
    if (!email || !tenantId) {
      return res.status(400).json({ message: 'Faltan datos para recuperación' });
    }
    const result = await authService.forgotPassword(email, tenantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Faltan datos para reset' });
    }
    const result = await authService.resetPassword(token, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 