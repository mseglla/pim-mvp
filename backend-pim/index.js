import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import prisma from './prismaClient.js';
import { uploadDir } from './middleware/upload.js';

import variantRoutes from './routes/variantRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import attributeRoutes from './routes/attributeRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import importExportRoutes from './routes/importExportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();
if (process.env.NODE_ENV === 'development') {
  console.log('Ruta actual:', process.cwd());
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/variants', variantRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/clients', clientRoutes);
app.use('/attributes', attributeRoutes);
app.use('/', auditRoutes);
app.use('/', importExportRoutes);
app.use('/', uploadRoutes);

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor escoltant a http://localhost:${PORT}`);
  });
}

export default app;
export { prisma };
