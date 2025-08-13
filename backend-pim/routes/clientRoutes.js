import express from 'express';
import { createClient } from '../controllers/clientsController.js';
import { createAttribute, listAttributesByClient } from '../controllers/attributesController.js';

const router = express.Router();

router.post('/', createClient);
router.post('/:id/attributes', createAttribute);
router.get('/:id/attributes', listAttributesByClient);

export default router;
