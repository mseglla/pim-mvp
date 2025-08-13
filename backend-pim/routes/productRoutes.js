import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  updateProductCategory,
  getProduct
} from '../controllers/productsController.js';

const router = express.Router();

router.post('/', authenticateToken, createProduct);
router.get('/', getProducts);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.put('/:id/category', authenticateToken, updateProductCategory);
router.get('/:id', getProduct);

export default router;
