import { Response } from 'express';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { get } from '@vercel/blob';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Actor } from '../services/domainService';
import * as paymentService from '../services/paymentService';

const actorFrom = (req: AuthRequest): Actor => {
  const { userId, tenantId, role } = req.user ?? {};
  if (!userId || !tenantId || !role) throw new Error('UNAUTHORIZED: Sesión inválida');
  return { userId, tenantId, role };
};

const requiredString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`VALIDATION: ${field} es obligatorio`);
  }
  return value.trim();
};

const positiveInteger = (value: unknown, field: string): number => {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new Error(`VALIDATION: ${field} debe ser un entero positivo`);
  }
  return Number(value);
};

const validateCurrency = (value: unknown): void => {
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) {
    throw new Error('VALIDATION: currency debe usar tres letras mayúsculas');
  }
};

const sendError = (res: Response, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  const mappings: Array<[string, number]> = [
    ['VALIDATION:', 400],
    ['UNAUTHORIZED:', 401],
    ['FORBIDDEN:', 403],
    ['NOT_FOUND:', 404],
    ['CONFLICT:', 409],
  ];
  const mapping = mappings.find(([prefix]) => message.startsWith(prefix));
  if (mapping) {
    res.status(mapping[1]).json({ message: message.replace(`${mapping[0]} `, '') });
    return;
  }
  res.status(400).json({ message });
};

export const listAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.listPaymentAccounts(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const saveAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'name');
    requiredString(req.body, 'instructions');
    const accountType = requiredString(req.body, 'accountType');
    if (!['bank', 'wallet', 'cash'].includes(accountType)) {
      throw new Error('VALIDATION: accountType inválido');
    }
    const currency = req.body.currency ?? 'USD';
    validateCurrency(currency);
    if (req.body.qrUrl) {
      const qrUrl = new URL(String(req.body.qrUrl));
      if (!['https:', 'http:'].includes(qrUrl.protocol)) {
        throw new Error('VALIDATION: qrUrl debe ser HTTP(S)');
      }
    }
    const input = { ...req.body, id: req.params.id ?? req.body.id, currency };
    res.status(req.params.id ? 200 : 201).json(
      await paymentService.savePaymentAccount(actorFrom(req), input)
    );
  } catch (error) {
    sendError(res, error);
  }
};

export const createFeeConcept = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    requiredString(req.body, 'name');
    validateCurrency(req.body.currency ?? 'USD');
    if (req.body.defaultAmountCents !== undefined) {
      positiveInteger(req.body.defaultAmountCents, 'defaultAmountCents');
    }
    res.status(201).json(await paymentService.createFeeConcept(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const listFeeConcepts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    res.json(await paymentService.listFeeConcepts(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const createCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'householdId');
    requiredString(req.body, 'description');
    validateCurrency(req.body.currency ?? 'USD');
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      throw new Error('VALIDATION: items debe contener al menos un concepto');
    }
    req.body.items.forEach((item: unknown, index: number) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`VALIDATION: items[${index}] inválido`);
      }
      const typedItem = item as Record<string, unknown>;
      requiredString(typedItem, 'description');
      positiveInteger(typedItem.unitAmountCents, `items[${index}].unitAmountCents`);
      if (typedItem.quantity !== undefined) {
        positiveInteger(typedItem.quantity, `items[${index}].quantity`);
      }
    });
    res.status(201).json(await paymentService.createCharge(actorFrom(req), req.body));
  } catch (error) {
    sendError(res, error);
  }
};

export const listCharges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.listCharges(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const submitManualPayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    requiredString(req.body, 'chargeId');
    requiredString(req.body, 'currency');
    requiredString(req.body, 'channel');
    requiredString(req.body, 'proofStorageKey');
    requiredString(req.body, 'idempotencyKey');
    positiveInteger(req.body.amountCents, 'amountCents');
    validateCurrency(req.body.currency);
    if (!['bank_transfer', 'wallet', 'cash', 'other'].includes(req.body.channel)) {
      throw new Error('VALIDATION: channel inválido');
    }
    if (req.body.provider !== undefined && req.body.provider !== 'manual') {
      throw new Error('VALIDATION: Solo se admite el proveedor manual');
    }
    if (/^https?:\/\//i.test(req.body.proofStorageKey)) {
      throw new Error('VALIDATION: proofStorageKey debe ser una clave privada, no una URL');
    }
    res.status(201).json(
      await paymentService.submitManualPayment(actorFrom(req), req.body)
    );
  } catch (error) {
    sendError(res, error);
  }
};

export const listSubmissions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      throw new Error('VALIDATION: status inválido');
    }
    res.json(await paymentService.listSubmissions(
      actorFrom(req),
      status as 'pending' | 'approved' | 'rejected' | undefined
    ));
  } catch (error) {
    sendError(res, error);
  }
};

export const downloadProof = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proof = await paymentService.getProofForDownload(actorFrom(req), req.params.id);
    const safeFilename = proof.filename.replace(/[\r\n"]/g, '_');

    if (proof.pathname.startsWith('local:')) {
      const privateRoot = path.resolve(process.cwd(), 'private_uploads');
      const filePath = path.resolve(privateRoot, proof.pathname.slice('local:'.length));
      if (!filePath.startsWith(`${privateRoot}${path.sep}`)) {
        throw new Error('FORBIDDEN: Ruta de comprobante inválida');
      }
      const metadata = await stat(filePath);
      res.setHeader('Content-Type', proof.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Length', metadata.size);
      createReadStream(filePath).pipe(res);
      return;
    }

    const token =
      process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      res.status(503).json({ message: 'Almacenamiento privado no configurado' });
      return;
    }
    const result = await get(proof.pathname, { access: 'private', token });
    if (result?.statusCode !== 200 || !result.stream) {
      res.status(404).json({ message: 'Archivo de comprobante no encontrado' });
      return;
    }
    res.setHeader('Content-Type', proof.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (proof.sizeBytes) res.setHeader('Content-Length', proof.sizeBytes);
    Readable.fromWeb(result.stream as never).pipe(res);
  } catch (error) {
    if (!res.headersSent) sendError(res, error);
    else res.destroy(error instanceof Error ? error : undefined);
  }
};

export const reviewSubmission = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const decision = requiredString(req.body, 'decision');
    if (decision !== 'approved' && decision !== 'rejected') {
      throw new Error('VALIDATION: decision debe ser approved o rejected');
    }
    const reviewNote =
      typeof req.body.reviewNote === 'string' ? req.body.reviewNote.trim() : undefined;
    res.json(
      await paymentService.reviewSubmission(
        actorFrom(req),
        req.params.id,
        decision,
        reviewNote
      )
    );
  } catch (error) {
    sendError(res, error);
  }
};

export const recordRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    requiredString(req.body, 'currency');
    requiredString(req.body, 'channel');
    requiredString(req.body, 'reason');
    positiveInteger(req.body.amountCents, 'amountCents');
    validateCurrency(req.body.currency);
    if (!['bank_transfer', 'wallet', 'cash', 'other'].includes(req.body.channel)) {
      throw new Error('VALIDATION: channel inválido');
    }
    if (req.body.provider !== undefined && req.body.provider !== 'manual') {
      throw new Error('VALIDATION: Solo se admite el proveedor manual');
    }
    res.status(201).json(
      await paymentService.recordRefund(actorFrom(req), req.params.id, req.body)
    );
  } catch (error) {
    sendError(res, error);
  }
};

export const adminSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.getAdminSummary(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const portfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.getPortfolio(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const familyFinance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.getFamilyFinance(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const getReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.getReceipt(actorFrom(req), req.params.id));
  } catch (error) {
    sendError(res, error);
  }
};

export const listReceipts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await paymentService.listReceipts(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};
