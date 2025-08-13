import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { updateAttribute, deleteAttribute } from '../controllers/attributesController.js';

const router = express.Router();

router.put('/:id', updateAttribute);
router.delete('/:id', authenticateToken, deleteAttribute);

export default router;
