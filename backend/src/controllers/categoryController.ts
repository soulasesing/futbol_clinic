import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const categories = await categoryService.getCategories(tenantId!);
    res.json(categories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const category = await categoryService.createCategory(tenantId!, req.body);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const category = await categoryService.updateCategory(tenantId!, id, req.body);
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    await categoryService.deleteCategory(tenantId!, id);
    res.json({ message: 'Categoría eliminada' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCategoryById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const category = await categoryService.getCategoryById(tenantId!, id);
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const insertDefaultCategories = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await categoryService.insertDefaultCategories(tenantId!);
    res.json({ message: 'Categorías por defecto insertadas correctamente' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 