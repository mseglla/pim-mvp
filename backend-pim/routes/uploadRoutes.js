import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/upload', authenticateToken, upload.single('image'), uploadImage);

export default router;
