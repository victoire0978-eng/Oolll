import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadToStorage } from '../services/storageService';
import { detectTextWithGoogleVision, detectTextWithTesseract } from '../services/ocrService';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_, file, cb) => {
    const allowed = ['image/png','image/jpeg','image/webp','application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/api/uploads', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' });

  const { buffer, originalname, mimetype } = req.file;
  try {
    const url = await uploadToStorage(buffer, originalname, mimetype);
    // OCR
    let ocrText = '';
    try {
      ocrText = await detectTextWithGoogleVision(buffer);
    } catch (e) {
      try {
        ocrText = await detectTextWithTesseract(buffer, mimetype);
      } catch (err) {
        // fallback: empty
        ocrText = '';
      }
    }

    res.json({ url, ocrText });
  } catch (err: any) {
    console.error('upload error', err);
    res.status(500).json({ error: 'Erreur upload' });
  }
});

export default router;
