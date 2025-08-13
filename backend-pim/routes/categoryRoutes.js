import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategory
} from '../controllers/categoriesController.js';

const router = express.Router();

router.post('/', authenticateToken, createCategory);
router.put('/:id', authenticateToken, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);
router.get('/', getCategories);
router.get('/:id', getCategory);

export default router;
