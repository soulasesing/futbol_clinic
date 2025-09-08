import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthRequest } from '../middlewares/authMiddleware';

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
    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan datos para login' });
    }
    let result;
    if (!tenantId || tenantId === 'super_admin') {
      result = await authService.loginSuperAdmin(email, password);
    } else {
      result = await authService.login(email, password, tenantId);
    }
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

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'La contraseña actual y nueva son requeridas' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 