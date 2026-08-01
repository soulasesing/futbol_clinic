import { Response } from 'express';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Actor } from '../services/domainService';
import * as familyPortalService from '../services/familyPortalService';
import * as paymentService from '../services/paymentService';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

const hasExpectedSignature = (buffer: Buffer, mimeType: string): boolean => {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }
  return mimeType === 'application/pdf'
    && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
};

const storePrivateProof = async (
  pathname: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  const token =
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(pathname, buffer, {
      access: 'private',
      token,
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return blob.pathname;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('UNAVAILABLE: Almacenamiento privado no configurado');
  }
  const privateRoot = path.resolve(process.cwd(), 'private_uploads');
  const filePath = path.resolve(privateRoot, pathname);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer, { flag: 'wx' });
  return `local:${pathname}`;
};

const actorFrom = (req: AuthRequest): Actor => {
  const { userId, tenantId, role } = req.user ?? {};
  if (!userId || !tenantId || !role) throw new Error('UNAUTHORIZED: Sesión inválida');
  return { userId, tenantId, role };
};

const sendError = (res: Response, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  const mappings: Array<[string, number]> = [
    ['VALIDATION:', 400],
    ['UNAUTHORIZED:', 401],
    ['FORBIDDEN:', 403],
    ['NOT_FOUND:', 404],
    ['CONFLICT:', 409],
    ['UNAVAILABLE:', 503],
  ];
  const mapping = mappings.find(([prefix]) => message.startsWith(prefix));
  res.status(mapping?.[1] ?? 500).json({
    message: mapping ? message.replace(`${mapping[0]} `, '') : 'Error inesperado',
  });
};

export const getPortal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await familyPortalService.getPortal(actorFrom(req)));
  } catch (error) {
    sendError(res, error);
  }
};

export const updateRsvp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.body.response !== 'yes' && req.body.response !== 'no') {
      throw new Error('VALIDATION: response debe ser yes o no');
    }
    res.json(await familyPortalService.updateRsvp(
      actorFrom(req),
      req.params.eventId,
      req.body.response
    ));
  } catch (error) {
    sendError(res, error);
  }
};

export const uploadPaymentProof = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const actor = actorFrom(req);
    if (actor.role !== 'parent') {
      throw new Error('FORBIDDEN: Solo una familia puede enviar comprobantes');
    }
    if (!req.file) throw new Error('VALIDATION: Debe adjuntar un comprobante');
    const extension = MIME_EXTENSIONS[req.file.mimetype];
    if (!extension) throw new Error('VALIDATION: Tipo de archivo no permitido');
    if (!hasExpectedSignature(req.file.buffer, req.file.mimetype)) {
      throw new Error('VALIDATION: El contenido no coincide con el tipo de archivo');
    }

    const paymentAccountId = String(req.body.paymentAccountId || '');
    const currency = String(req.body.currency || '');
    const channel = String(req.body.channel || '');
    const idempotencyKey = String(req.body.idempotencyKey || '');
    const amountCents = Number(req.body.amountCents);
    if (!paymentAccountId || !idempotencyKey) {
      throw new Error('VALIDATION: Cuenta e idempotencyKey son obligatorios');
    }
    if (idempotencyKey.length > 120) {
      throw new Error('VALIDATION: idempotencyKey excede 120 caracteres');
    }
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new Error('VALIDATION: amountCents debe ser un entero positivo');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('VALIDATION: currency debe usar tres letras mayúsculas');
    }

    const context = await paymentService.getPaymentUploadContext(
      actor,
      req.params.chargeId,
      paymentAccountId
    );
    if (currency !== context.currency || channel !== context.channel) {
      throw new Error('VALIDATION: La cuenta, moneda o canal no coincide con el cargo');
    }
    if (amountCents > context.balanceCents) {
      throw new Error('VALIDATION: El monto excede el saldo del cargo');
    }
    const existing = await paymentService.findSubmissionByIdempotency(actor, idempotencyKey);
    if (existing) {
      res.json(existing);
      return;
    }

    const pathname =
      `tenants/${actor.tenantId}/payment-proofs/${uuidv4()}.${extension}`;
    const proofStorageKey = await storePrivateProof(
      pathname,
      req.file.buffer,
      req.file.mimetype
    );
    const submission = await paymentService.submitManualPayment(actor, {
      chargeId: req.params.chargeId,
      paymentAccountId,
      amountCents,
      currency,
      channel,
      provider: 'manual',
      proofStorageKey,
      proofFilename: req.file.originalname.slice(0, 255),
      proofMimeType: req.file.mimetype,
      proofSizeBytes: req.file.size,
      payerNote: req.body.payerNote || undefined,
      externalReference: req.body.externalReference || undefined,
      idempotencyKey,
    });
    res.status(201).json(submission);
  } catch (error) {
    sendError(res, error);
  }
};
