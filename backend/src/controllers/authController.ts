import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { tenantId, token, nombre, password } = req.body;
    if (!token || !nombre || !password) {
      return res.status(400).json({ message: 'Faltan datos para registro' });
    }
    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 12 caracteres',
      });
    }
    const result = await authService.registerViaInvitation(tenantId, token, nombre, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, tenantId } = req.body;
    if (!email || !password || !tenantId || tenantId === 'super_admin') {
      return res.status(400).json({ message: 'Faltan datos para login' });
    }
    const result = await authService.login(email, password, tenantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const tenantLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, slug } = req.body;
    if (!email || !password || !slug) {
      res.status(400).json({ message: 'Faltan datos para login' });
      return;
    }
    res.json(await authService.loginBySlug(email, password, slug));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Faltan datos para login' });
      return;
    }
    res.json(await authService.loginSuperAdmin(email, password));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshSession = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Sesión inválida' });
    return;
  }
  res.json({ jwt: authService.refreshSession(req.user) });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, slug } = req.body;
    if (!email || !slug) {
      return res.status(400).json({ message: 'Faltan datos para recuperación' });
    }
    const result = await authService.forgotPassword(email, slug);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { tenantId, token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Faltan datos para reset' });
    }
    if (password.length < 12) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 12 caracteres' });
    }
    const result = await authService.resetPassword(tenantId, token, password);
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
    
    if (newPassword.length < 12) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 12 caracteres' });
    }
    
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const result = await authService.changePassword(
      userId,
      req.user?.tenantId ?? null,
      currentPassword,
      newPassword
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 