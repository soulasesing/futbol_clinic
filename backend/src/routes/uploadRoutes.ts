import { Router } from 'express';
import multer from 'multer';
import { get, put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { NextFunction, Response } from 'express';
import {
  AuthRequest,
  requireAuth,
  requireRole,
  requireTenantAuth,
} from '../middlewares/authMiddleware';
import { withTenantTransaction } from '../utils/db';

const router = Router();
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
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
  if (mimeType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
    fields: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!MIME_EXTENSIONS[file.mimetype]) {
      return callback(new Error('Tipo de archivo no permitido'));
    }
    callback(null, true);
  },
});

const privateBlobToken = (): string | undefined =>
  process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

const storePrivateFile = async (
  pathname: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  const token = privateBlobToken();
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
    throw new Error('Almacenamiento privado no configurado');
  }
  const privateRoot = path.resolve(process.cwd(), 'private_uploads');
  const filePath = path.resolve(privateRoot, pathname);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer, { flag: 'wx' });
  return `local:${pathname}`;
};

router.post(
  '/branding',
  requireAuth,
  requireRole('admin', 'super_admin'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file || !hasExpectedSignature(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ message: 'Archivo de marca inválido' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'La marca debe ser una imagen' });
    }
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) return res.status(503).json({ message: 'Almacenamiento no configurado' });
      const extension = MIME_EXTENSIONS[req.file.mimetype];
      const pathname = `branding/${req.user!.userId}/${uuidv4()}.${extension}`;
      const blob = await put(pathname, req.file.buffer, {
        access: 'public',
        token,
        contentType: req.file.mimetype,
        addRandomSuffix: false,
      });
      return res.json({ url: blob.url });
    } catch {
      return res.status(500).json({ message: 'Error al subir la imagen de marca' });
    }
  }
);

router.use(requireTenantAuth);

router.post('/', requireRole('admin'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }
  if (!hasExpectedSignature(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ message: 'El contenido del archivo no coincide con su tipo' });
  }

  try {
    const documentType = String(req.body.kind || '');
    if (!['player-photo', 'player-document', 'coach-photo'].includes(documentType)) {
      return res.status(400).json({ message: 'Tipo de archivo privado inválido' });
    }
    const extension = MIME_EXTENSIONS[req.file.mimetype];
    const pathname = `tenants/${req.user!.tenantId}/uploads/${uuidv4()}.${extension}`;
    const storageKey = await storePrivateFile(
      pathname,
      req.file.buffer,
      req.file.mimetype
    );
    const document = await withTenantTransaction(req.user!.tenantId!, async (client) => {
      const result = await client.query(
        `INSERT INTO documents
           (tenant_id, document_type, storage_key, original_filename,
            mime_type, size_bytes, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [
          req.user!.tenantId,
          documentType,
          storageKey,
          req.file!.originalname.slice(0, 255),
          req.file!.mimetype,
          req.file!.size,
          req.user!.userId,
        ]
      );
      return result.rows[0];
    });
    res.status(201).json({ url: `/api/upload/files/${document.id}`, id: document.id });
  } catch {
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

router.get(
  '/files/:id',
  requireRole('admin', 'coach', 'parent'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const document = await withTenantTransaction(req.user!.tenantId!, async (client) => {
        const result = await client.query(
          `SELECT d.storage_key, d.original_filename, d.mime_type, d.size_bytes
           FROM documents d
           WHERE d.id = $1 AND d.tenant_id = $2 AND d.status = 'active'
             AND (
               $3 = 'admin'
               OR (
                 $3 = 'coach' AND d.document_type = 'player-photo'
                 AND EXISTS (
                   SELECT 1 FROM users u
                   JOIN coaches c ON LOWER(c.email) = LOWER(u.email)
                     AND c.tenant_id = u.tenant_id
                   JOIN coach_team_assignments cta
                     ON cta.coach_id = c.id AND cta.tenant_id = c.tenant_id
                   JOIN player_teams pt
                     ON pt.team_id = cta.team_id AND pt.tenant_id = cta.tenant_id
                   WHERE u.id = $4 AND u.tenant_id = $2
                     AND pt.player_id = d.player_id
                     AND (cta.starts_on IS NULL OR cta.starts_on <= CURRENT_DATE)
                     AND (cta.ends_on IS NULL OR cta.ends_on >= CURRENT_DATE)
                 )
               )
               OR (
                 $3 = 'parent' AND EXISTS (
                   SELECT 1 FROM guardians g
                   JOIN guardian_players gp
                     ON gp.guardian_id = g.id AND gp.tenant_id = g.tenant_id
                   WHERE g.user_id = $4 AND g.tenant_id = $2
                     AND gp.player_id = d.player_id
                 )
               )
             )`,
          [req.params.id, req.user!.tenantId, req.user!.role, req.user!.userId]
        );
        return result.rows[0];
      });
      if (!document) return res.status(404).json({ message: 'Archivo no encontrado' });
      const safeFilename = String(document.original_filename || 'archivo')
        .replace(/[\r\n"]/g, '_');
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (document.storage_key.startsWith('local:')) {
        const privateRoot = path.resolve(process.cwd(), 'private_uploads');
        const filePath = path.resolve(
          privateRoot,
          document.storage_key.slice('local:'.length)
        );
        if (!filePath.startsWith(`${privateRoot}${path.sep}`)) {
          return res.status(403).json({ message: 'Ruta de archivo inválida' });
        }
        const metadata = await stat(filePath);
        res.setHeader('Content-Length', metadata.size);
        createReadStream(filePath).pipe(res);
        return;
      }
      const token = privateBlobToken();
      if (!token) return res.status(503).json({ message: 'Almacenamiento no configurado' });
      const blob = await get(document.storage_key, { access: 'private', token });
      if (blob?.statusCode !== 200 || !blob.stream) {
        return res.status(404).json({ message: 'Archivo no encontrado' });
      }
      if (document.size_bytes) res.setHeader('Content-Length', document.size_bytes);
      Readable.fromWeb(blob.stream as never).pipe(res);
    } catch (error) {
      next(error);
    }
  }
);

router.use((error: Error, _req: AuthRequest, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'El archivo excede el límite de 4 MB' });
  }
  res.status(400).json({ message: error.message || 'Archivo inválido' });
});

export default router; 