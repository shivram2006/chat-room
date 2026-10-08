import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

const router = express.Router();

router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was provided' });
    }

    const mime = req.file.mimetype;
    let fileType = 'document';
    if (mime.startsWith('image/')) fileType = 'image';
    else if (mime.startsWith('audio/')) fileType = 'audio';
    else if (mime.startsWith('video/')) fileType = 'video';
    else if (mime.includes('pdf')) fileType = 'pdf';

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

export default router;
