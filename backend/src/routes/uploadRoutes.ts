import { Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import type { Request, Response } from 'express';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }
  try {
    const blob = await put(
      req.file.originalname,
      req.file.buffer,
      {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );
    res.json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ message: 'Error al subir imagen', error: (err as Error).message });
  }
});

export default router; 