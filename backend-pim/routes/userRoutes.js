import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getUser, registerUser, loginUser } from '../controllers/usersController.js';

const router = express.Router();

router.get('/:id', authenticateToken, getUser);
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
