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

export const createTenantWithAdmin = async (req: Request, res: Response) => {
  try {
    const result = await tenantService.createTenantWithAdmin(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await tenantService.updateTenant(id, req.body);
    res.json(tenant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await tenantService.deleteTenant(id);
    res.json({ message: 'Escuela eliminada' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTenantDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detail = await tenantService.getTenantDetail(id);
    res.json(detail);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 