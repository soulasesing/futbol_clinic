import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as domainService from '../services/domainService';

const requiredString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`VALIDATION: ${field} es obligatorio`);
  }
  return value.trim();
};

const actorFrom = (req: AuthRequest): domainService.Actor => {
  const { userId, tenantId, role } = req.user ?? {};
  if (!userId || !tenantId || !role) throw new Error('UNAUTHORIZED: Sesión inválida');
  return { userId, tenantId, role };
};

const sendError = (res: Response, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  if (message.startsWith('VALIDATION:')) {
    res.status(400).json({ message: message.replace('VALIDATION: ', '') });
  } else if (message.startsWith('UNAUTHORIZED:')) {
    res.status(401).json({ message: message.replace('UNAUTHORIZED: ', '') });
  } else if (message.startsWith('FORBIDDEN:')) {
    res.status(403).json({ message: message.replace('FORBIDDEN: ', '') });
  } else if (message.startsWith('NOT_FOUND:')) {
    res.status(404).json({ message: message.replace('NOT_FOUND: ', '') });
  } else {
    res.status(400).json({ message });
  }
};

export const listLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await domainService.listLocations(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'name');
    res.status(201).json(await domainService.createLocation(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const listSeasons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await domainService.listSeasons(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const createSeason = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'name');
    requiredString(req.body, 'startsOn');
    requiredString(req.body, 'endsOn');
    res.status(201).json(await domainService.createSeason(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const createHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'name');
    res.status(201).json(await domainService.createHousehold(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const listHouseholds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await domainService.listHouseholds(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const createGuardian = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'householdId');
    requiredString(req.body, 'firstName');
    requiredString(req.body, 'lastName');
    res.status(201).json(await domainService.createGuardian(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const linkGuardianPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'guardianId');
    requiredString(req.body, 'playerId');
    requiredString(req.body, 'relationship');
    res.status(201).json(await domainService.linkGuardianPlayer(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const assignCoachTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'coachId');
    requiredString(req.body, 'teamId');
    res.status(201).json(await domainService.assignCoachTeam(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const createConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'playerId');
    requiredString(req.body, 'consentType');
    requiredString(req.body, 'version');
    res.status(201).json(await domainService.createConsent(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'documentType');
    requiredString(req.body, 'storageKey');
    res.status(201).json(await domainService.createDocument(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const listNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    res.json(await domainService.listNotifications(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const createNotification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    requiredString(req.body, 'channel');
    requiredString(req.body, 'body');
    if (!req.body.userId && !req.body.householdId) {
      throw new Error('VALIDATION: userId o householdId es obligatorio');
    }
    res.status(201).json(await domainService.createNotification(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};
