import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImport } from '../middleware/upload.js';
import { importProducts, exportProducts } from '../controllers/importExportController.js';

const router = express.Router();

router.post('/import-products', authenticateToken, uploadImport.single('file'), importProducts);
router.get('/export-products', authenticateToken, exportProducts);

export default router;
