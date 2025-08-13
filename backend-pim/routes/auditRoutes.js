import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAuditLogs, getChangeHistory } from '../controllers/auditController.js';

const router = express.Router();

router.get('/audit-logs', authenticateToken, getAuditLogs);
router.get('/change-history', authenticateToken, getChangeHistory);

export default router;
