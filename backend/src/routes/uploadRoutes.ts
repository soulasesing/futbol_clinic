import { Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import type { NextFunction, Response } from 'express';
import { AuthRequest, requireTenantAuth } from '../middlewares/authMiddleware';

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
    fileSize: 5 * 1024 * 1024,
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

router.use(requireTenantAuth);

router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }
  if (!hasExpectedSignature(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ message: 'El contenido del archivo no coincide con su tipo' });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({ message: 'Almacenamiento no configurado' });
    }

    const extension = MIME_EXTENSIONS[req.file.mimetype];
    const pathname = `tenants/${req.user!.tenantId}/uploads/${uuidv4()}.${extension}`;
    const blob = await put(
      pathname,
      req.file.buffer,
      {
        access: 'public',
        token,
        contentType: req.file.mimetype,
        addRandomSuffix: false,
      }
    );
    res.json({ url: blob.url });
  } catch {
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

router.use((error: Error, _req: AuthRequest, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'El archivo excede el límite de 5 MB' });
  }
  res.status(400).json({ message: error.message || 'Archivo inválido' });
});

export default router; 