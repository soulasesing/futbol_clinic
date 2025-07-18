import { Request, Response } from 'express';
import * as attendanceService from '../services/attendanceService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const attendance = await attendanceService.getAttendance(tenantId!);
    res.json(attendance);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const record = await attendanceService.createAttendance(tenantId!, req.body);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const record = await attendanceService.updateAttendance(tenantId!, req.params.id, req.body);
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    await attendanceService.deleteAttendance(tenantId!, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 