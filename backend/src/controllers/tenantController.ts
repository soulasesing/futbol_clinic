import { Request, Response } from 'express';
import * as tenantService from '../services/tenantService';

export const listTenants = async (_req: Request, res: Response) => {
  try {
    const tenants = await tenantService.getTenants();
    res.json(tenants);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 