import { Request, Response } from 'express';
import * as invitationService from '../services/invitationService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const invite = async (req: AuthRequest, res: Response) => {
  try {
    const { email, rol } = req.body;
    if (!email || !rol) {
      return res.status(400).json({ message: 'Email y rol son requeridos' });
    }
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant no encontrado' });
    }
    await invitationService.createInvitation(tenantId, email, rol);
    res.json({ message: 'Invitación enviada' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 