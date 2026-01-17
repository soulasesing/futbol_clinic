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

// Admin user management controllers
export const getTenantAdmins = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admins = await tenantService.getTenantAdmins(id);
    res.json(admins);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createTenantAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await tenantService.createTenantAdmin(id, req.body);
    res.status(201).json(admin);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTenantAdmin = async (req: Request, res: Response) => {
  try {
    const { id, adminId } = req.params;
    const admin = await tenantService.updateTenantAdmin(id, adminId, req.body);
    res.json(admin);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTenantAdmin = async (req: Request, res: Response) => {
  try {
    const { id, adminId } = req.params;
    await tenantService.deleteTenantAdmin(id, adminId);
    res.json({ message: 'Administrador eliminado correctamente' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 