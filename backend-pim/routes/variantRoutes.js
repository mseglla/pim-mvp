import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createVariant,
  getVariants,
  assignProduct,
  updateVariantCategory,
  updateVariant,
  deleteVariant,
  getVariant
} from '../controllers/variantsController.js';
import { assignAttributeToVariant } from '../controllers/attributesController.js';

const router = express.Router();

router.post('/', authenticateToken, createVariant);
router.get('/', getVariants);
router.put('/:id/assign-product', assignProduct);
router.put('/:id/category', authenticateToken, updateVariantCategory);
router.put('/:id', authenticateToken, updateVariant);
router.delete('/:id', authenticateToken, deleteVariant);
router.get('/:id', getVariant);
router.post('/:id/attributes', assignAttributeToVariant);

export default router;
