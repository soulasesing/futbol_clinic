import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as landingService from '../services/landingService';

const requiredText = (
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string => {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} es obligatorio`);
  }
  if (value.trim().length > maxLength) {
    throw new Error(`${field} excede ${maxLength} caracteres`);
  }
  return value.trim();
};

const optionalText = (value: unknown, maxLength: number): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new Error(`El texto excede ${maxLength} caracteres`);
  }
  return value.trim();
};

const sendError = (res: Response, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  res.status(message.includes('no encontrad') ? 404 : 400).json({ message });
};

const tenantActor = (req: AuthRequest): { tenantId: string; userId: string } => {
  if (!req.user?.tenantId || !req.user.userId) throw new Error('Sesión inválida');
  return { tenantId: req.user.tenantId, userId: req.user.userId };
};

const postInput = (body: Record<string, unknown>): landingService.LandingPostInput => {
  const status = body.status === 'published' ? 'published' : 'draft';
  return {
    title: requiredText(body, 'title', 180),
    excerpt: requiredText(body, 'excerpt', 320),
    content: optionalText(body.content, 10_000),
    imageUrl: optionalText(body.imageUrl, 2_000),
    status,
  };
};

const pricingInput = (
  body: Record<string, unknown>
): landingService.LandingPricingInput => {
  const features = Array.isArray(body.features)
    ? body.features
      .filter((feature): feature is string => typeof feature === 'string')
      .map((feature) => feature.trim())
      .filter(Boolean)
      .slice(0, 12)
    : [];
  const sortOrder = Number(body.sortOrder ?? 0);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error('El orden debe ser un entero positivo');
  }
  return {
    name: requiredText(body, 'name', 120),
    description: optionalText(body.description, 320),
    priceLabel: requiredText(body, 'priceLabel', 100),
    billingPeriod: optionalText(body.billingPeriod, 40),
    features,
    ctaLabel: optionalText(body.ctaLabel, 80),
    isFeatured: body.isFeatured === true,
    isActive: body.isActive !== false,
    sortOrder,
  };
};

export const getPublicLanding = async (req: Request, res: Response): Promise<void> => {
  try {
    const landing = await landingService.getPublicLanding(req.params.slug);
    if (!landing) {
      res.status(404).json({ message: 'Página de academia no encontrada' });
      return;
    }
    res.json(landing);
  } catch {
    res.status(500).json({ message: 'No fue posible cargar la academia' });
  }
};

export const getAdminLanding = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const actor = tenantActor(req);
    res.json(await landingService.getAdminLanding(actor.tenantId));
  } catch (error) {
    sendError(res, error);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const actor = tenantActor(req);
    res.json(await landingService.updateSettings(actor.tenantId, actor.userId, {
      enabled: req.body.enabled === true,
      headline: optionalText(req.body.headline, 180),
      subheadline: optionalText(req.body.subheadline, 1_000),
      ctaLabel: optionalText(req.body.ctaLabel, 80),
    }));
  } catch (error) {
    sendError(res, error);
  }
};

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actor = tenantActor(req);
    res.status(201).json(
      await landingService.createPost(actor.tenantId, actor.userId, postInput(req.body))
    );
  } catch (error) {
    sendError(res, error);
  }
};

export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actor = tenantActor(req);
    res.json(await landingService.updatePost(
      actor.tenantId,
      actor.userId,
      req.params.id,
      postInput(req.body)
    ));
  } catch (error) {
    sendError(res, error);
  }
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actor = tenantActor(req);
    await landingService.deletePost(actor.tenantId, actor.userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
};

export const createPricing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const actor = tenantActor(req);
    res.status(201).json(await landingService.createPricing(
      actor.tenantId,
      actor.userId,
      pricingInput(req.body)
    ));
  } catch (error) {
    sendError(res, error);
  }
};

export const updatePricing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const actor = tenantActor(req);
    res.json(await landingService.updatePricing(
      actor.tenantId,
      actor.userId,
      req.params.id,
      pricingInput(req.body)
    ));
  } catch (error) {
    sendError(res, error);
  }
};

export const deletePricing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const actor = tenantActor(req);
    await landingService.deletePricing(actor.tenantId, actor.userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
};
