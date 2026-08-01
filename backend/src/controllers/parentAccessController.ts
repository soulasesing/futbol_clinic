import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as service from '../services/parentAccessService';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isEmail = (value: string): boolean => {
  if (value.includes(' ') || value.length > 255) return false;
  const at = value.indexOf('@');
  const dot = value.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < value.length - 1;
};

const actorFrom = (req: AuthRequest): service.ParentActor => {
  if (!req.user?.tenantId || !req.user.userId) {
    throw new Error('UNAUTHORIZED: Sesión inválida');
  }
  return {
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    role: req.user.role,
  };
};

const requiredString = (
  value: unknown,
  label: string,
  maxLength = 150
): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`VALIDATION: ${label} es obligatorio`);
  }
  if (value.trim().length > maxLength) {
    throw new Error(`VALIDATION: ${label} excede ${maxLength} caracteres`);
  }
  return value.trim();
};

const playerIdsFrom = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new Error('VALIDATION: Selecciona entre 1 y 20 jugadores');
  }
  const ids = [...new Set(value.filter((id): id is string => (
    typeof id === 'string' && UUID_PATTERN.test(id)
  )))];
  if (ids.length !== value.length) {
    throw new Error('VALIDATION: La selección de jugadores no es válida');
  }
  return ids;
};

const guardianIdFrom = (req: Request): string => {
  if (!UUID_PATTERN.test(req.params.guardianId)) {
    throw new Error('VALIDATION: Tutor inválido');
  }
  return req.params.guardianId;
};

const sendError = (res: Response, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  if (message.startsWith('UNAUTHORIZED:')) {
    res.status(401).json({ message: message.replace('UNAUTHORIZED: ', '') });
  } else if (message.startsWith('FORBIDDEN:')) {
    res.status(403).json({ message: message.replace('FORBIDDEN: ', '') });
  } else if (message.startsWith('NOT_FOUND:')) {
    res.status(404).json({ message: message.replace('NOT_FOUND: ', '') });
  } else {
    res.status(400).json({ message: message.replace('VALIDATION: ', '') });
  }
};

const inviteInput = (body: Record<string, unknown>): service.ParentInviteInput => {
  const email = requiredString(body.email, 'Correo', 255).toLowerCase();
  if (!isEmail(email)) throw new Error('VALIDATION: Correo inválido');
  const householdId = typeof body.householdId === 'string' && body.householdId
    ? body.householdId
    : undefined;
  if (householdId && !UUID_PATTERN.test(householdId)) {
    throw new Error('VALIDATION: Familia inválida');
  }
  return {
    firstName: requiredString(body.firstName, 'Nombre', 100),
    lastName: requiredString(body.lastName, 'Apellido', 100),
    email,
    phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : undefined,
    relationship: requiredString(body.relationship, 'Parentesco', 50),
    playerIds: playerIdsFrom(body.playerIds),
    householdId,
    householdName: typeof body.householdName === 'string'
      ? body.householdName.trim().slice(0, 150)
      : undefined,
    canViewFinances: body.canViewFinances !== false,
    canSubmitPayments: body.canSubmitPayments !== false,
  };
};

export const getInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await service.getInvitationInfo(req.params.token);
    if (!invitation) {
      res.status(404).json({ message: 'Invitación inválida, expirada o revocada' });
      return;
    }
    res.json(invitation);
  } catch {
    res.status(404).json({ message: 'Invitación inválida, expirada o revocada' });
  }
};

export const listParents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await service.listParents(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const inviteParent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(201).json(await service.inviteParent(actorFrom(req), inviteInput(req.body)));
  } catch (error) {
    sendError(res, error);
  }
};

export const resendInvitation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    res.json(await service.resendInvitation(actorFrom(req), guardianIdFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const revokeInvitation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await service.revokeInvitation(actorFrom(req), guardianIdFrom(req));
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
};

export const updateParent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input = inviteInput({
      ...req.body,
      email: req.body.email || 'unused@example.test',
    });
    await service.updateParent(actorFrom(req), guardianIdFrom(req), {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      relationship: input.relationship,
      playerIds: input.playerIds,
      canViewFinances: input.canViewFinances,
      canSubmitPayments: input.canSubmitPayments,
    });
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
};

export const setParentAccess = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (typeof req.body.active !== 'boolean') {
      throw new TypeError('VALIDATION: Estado inválido');
    }
    await service.setParentAccess(
      actorFrom(req),
      guardianIdFrom(req),
      req.body.active
    );
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
};
