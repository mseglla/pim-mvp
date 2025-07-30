import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
console.log("Ruta actual:", process.cwd());
console.log("DATABASE_URL:", process.env.DATABASE_URL);
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // <- ✅ aquí
import { PrismaClient } from './generated/prisma/index.js';

// Crear carpeta 'uploads' si no existeix
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuració de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const SECRET = process.env.JWT_SECRET;

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

async function saveChangeHistory({ entity, entityId, action, dataBefore, dataAfter, userId }) {
  try {
    await prisma.changeHistory.create({
      data: {
        entity,
        entityId,
        action,
        dataBefore,
        dataAfter,
        user: { connect: { id: userId } },
      },
    });
  } catch (err) {
    console.error('Error guardant historial:', err);
  }
}

/** 🔹 CREAR VARIANT */
app.post('/variants', authenticateToken, async (req, res) => {
  const {
    clientId,
    clientRef,
    sku,
    name,
    description,
    label,
    imageUrl,
    productId,
    categoryId,
    stock,
    attributes,
    customFields,
    status,
  } = req.body;

  if (!sku || !name || !clientId) {
    return res.status(400).json({ error: 'SKU, nom i clientId són obligatoris' });
  }

  try {
    const variant = await prisma.variant.create({
      data: {
        clientId: parseInt(clientId),
        clientRef,
        sku,
        name,
        description,
        label,
        imageUrl,
        productId: productId ? parseInt(productId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        stock: stock !== undefined ? parseInt(stock) : 0,
        attributes,
        customFields,
        status: status ?? 'DRAFT',
      },
    });
    
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Variant',
        entityId: variant.id,
        user: { connect: { id: req.userId } },
      },
    });
    
    await saveChangeHistory({
      entity: 'Variant',
      entityId: variant.id,
      action: 'CREATE',
      dataBefore: null,
      dataAfter: variant,
      userId: req.userId,
    });    

/** 🔹 OBTENIR VARIANTS */
app.get('/variants', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.max(parseInt(limit) || 20, 1);

  const where = {};
  if (status) {
    where.status = status;
  }

  const skip = (pageNum - 1) * limitNum;

  try {
    const [variants, total] = await Promise.all([
      prisma.variant.findMany({
        where,
        skip,
        take: limitNum,
        include: { product: true, category: true },
      }),
      prisma.variant.count({ where }),
    ]);

    res.json({
      data: variants,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error obtenint variants:', err);
    res.status(500).json({ error: 'Error al carregar variants' });
  }
});


/** 🔹 ASSIGNAR UNA VARIANT A UN PRODUCTE */
app.put('/variants/:id/assign-product', async (req, res) => {
  const variantId = parseInt(req.params.id);
  const { productId } = req.body;

  if (isNaN(variantId) || !productId) {
    return res.status(400).json({ error: 'Falten dades vàlides: variantId o productId' });
  }

  try {
    const updated = await prisma.variant.update({
      where: { id: variantId },
      data: {
        product: { connect: { id: productId } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Error assignant producte:', err);
    res.status(500).json({ error: 'Error al assignar el producte' });
  }
});


/** 🔹 CREAR CATEGORIA */
app.post('/categories', authenticateToken, async (req, res) => {
  const { clientId, clientRef, name, description, label, imageUrl, parentId, customFields, status } = req.body;

  if (!name || !clientId) {
    return res.status(400).json({ error: 'Nom i clientId són obligatoris' });
  }

  try {
    const category = await prisma.category.create({
      data: {
        clientId,
        clientRef,
        name,
        description,
        label,
        imageUrl,
        parentId,
        customFields,
        status: status ?? 'DRAFT',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Category',
        entityId: category.id,
        user: { connect: { id: req.userId } },
      },
    });

    await saveChangeHistory({
      entity: 'Category',
      entityId: category.id,
      action: 'CREATE',
      dataBefore: null,
      dataAfter: category,
      userId: req.userId,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error('Error creant categoria:', err);
    res.status(500).json({ error: 'Error al crear la categoria' });
  }
});

/** EDITAR CATEGORIA D'UNA VARIANT */
app.put('/variants/:id/category', authenticateToken, async (req, res) => {
  const variantId = parseInt(req.params.id);
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ error: 'CategoryId és obligatori' });
  }

  try {
    const updated = await prisma.variant.update({
      where: { id: variantId },
      data: {
        categoryId: parseInt(categoryId),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CATEGORY',
        entity: 'Variant',
        entityId: variantId,
        user: { connect: { id: req.userId } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error editant categoria de la variant:', err);
    res.status(500).json({ error: 'Error al editar la categoria' });
  }
});

/** EDITAR CATEGORIA */
app.put('/categories/:id', authenticateToken, async (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { clientRef, name, description, label, imageUrl, parentId, customFields, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nom és obligatori' });
  }

  try {
    const before = await prisma.category.findUnique({ where: { id: categoryId } });

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        clientRef,
        name,
        description,
        label,
        imageUrl,
        parentId,
        customFields,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Category',
        entityId: categoryId,
        user: { connect: { id: req.userId } },
      },
    });

    await saveChangeHistory({
      entity: 'Category',
      entityId: categoryId,
      action: 'UPDATE',
      dataBefore: before,
      dataAfter: updated,
      userId: req.userId,
    });

    res.json(updated);
  } catch (err) {
    console.error('Error editant categoria:', err);
    res.status(500).json({ error: 'Error al editar la categoria' });
  }
});

/** ELIMINAR CATEGORÍA */
app.delete('/categories/:id', authenticateToken, async (req, res) => {
  const categoryId = parseInt(req.params.id);

  try {
    const children = await prisma.category.findMany({ where: { parentId: categoryId } });
    if (children.length > 0) {
      return res.status(400).json({ error: 'No es pot eliminar la categoria perquè té subcategories associades' });
    }

    const products = await prisma.product.findMany({ where: { categoryId } });
    if (products.length > 0) {
      return res.status(400).json({ error: 'No es pot eliminar la categoria perquè té productes associats' });
    }

    const variants = await prisma.variant.findMany({ where: { categoryId } });
    if (variants.length > 0) {
      return res.status(400).json({ error: 'No es pot eliminar la categoria perquè té variants associades' });
    }

    const before = await prisma.category.findUnique({ where: { id: categoryId } });

    await prisma.category.delete({ where: { id: categoryId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Category',
        entityId: categoryId,
        user: { connect: { id: req.userId } },
      },
    });

    await saveChangeHistory({
      entity: 'Category',
      entityId: categoryId,
      action: 'DELETE',
      dataBefore: before,
      dataAfter: null,
      userId: req.userId,
    });

    res.json({ message: 'Categoria eliminada correctament' });
  } catch (err) {
    console.error('Error eliminant categoria:', err);
    res.status(500).json({ error: 'Error al eliminar la categoria' });
  }
});

//** 🔹 CREAR PRODUCTE */
app.post('/products', authenticateToken, async (req, res) => {
  const {
    clientId,
    clientRef,
    name,
    description,
    label,
    imageUrl,
    tags,
    categoryId,
    customFields,
    status,
  } = req.body;

  if (!name || !clientId) {
    return res.status(400).json({ error: 'Nom i clientId són obligatoris' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        clientId: parseInt(clientId),
        clientRef,
        name,
        description,
        label,
        imageUrl,
        tags,
        categoryId: categoryId ? parseInt(categoryId) : null,
        customFields,
        status: status ?? 'DRAFT',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        user: { connect: { id: req.userId } },
      },
    });

    await saveChangeHistory({
      entity: 'Product',
      entityId: product.id,
      action: 'CREATE',
      dataBefore: null,
      dataAfter: product,
      userId: req.userId,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Error creant producte:', err);
    res.status(500).json({ error: 'Error al crear el producte' });
  }
});

 /** EDITAR VARIANT */
 app.put('/variants/:id', authenticateToken, async (req, res) => {
  const variantId = parseInt(req.params.id);
  const {
    clientRef,
    sku,
    name,
    description,
    label,
    imageUrl,
    productId,
    categoryId,
    stock,
    attributes,
    customFields,
    status,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nom és obligatori' });
  }

  try {
    const before = await prisma.variant.findUnique({ where: { id: variantId } });

    const updated = await prisma.variant.update({
      where: { id: variantId },
      data: {
        clientRef,
        sku,
        name,
        description,
        label,
        imageUrl,
        productId: productId ? parseInt(productId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        attributes,
        customFields,
        status,
      },
    });

    await saveChangeHistory({
      entity: 'Variant',
      entityId: variantId,
      action: 'UPDATE',
      dataBefore: before,
      dataAfter: updated,
      userId: req.userId,
    });

    res.json(updated);
  } catch (err) {
    console.error('Error editant variant:', err);
    res.status(500).json({ error: 'Error al editar la variant' });
  }
});
  
  /** ELIMINAR VARIANT */
  app.delete('/variants/:id', authenticateToken, async (req, res) => {
    const variantId = parseInt(req.params.id);
  
    try {
      // Obtenir dades abans d'eliminar
      const before = await prisma.variant.findUnique({ where: { id: variantId } });
  
      // Eliminar
      await prisma.variant.delete({ where: { id: variantId } });
  
      // Guardar audit log
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Variant',
          entityId: variantId,
          user: { connect: { id: req.userId } },
        },
      });
  
      // Guardar historial
      await saveChangeHistory({
        entity: 'Variant',
        entityId: variantId,
        action: 'DELETE',
        dataBefore: before,
        dataAfter: null,
        userId: req.userId,
      });
  
      res.json({ message: 'Variant eliminada correctament' });
    } catch (err) {
      console.error('Error eliminant variant:', err);
      res.status(500).json({ error: 'Error al eliminar la variant' });
    }
  });
  

/** 🔹 OBTENIR PRODUCTES */
app.get('/products', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const where = status ? { status } : {};

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: { variants: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error obtenint productes:', err);
    res.status(500).json({ error: 'Error al carregar productes' });
  }
});


/** EDITAR PRODUCTE */
app.put('/products/:id', authenticateToken, async (req, res) => {
  const productId = parseInt(req.params.id);
  const {
    clientRef,
    name,
    description,
    label,
    imageUrl,
    tags,
    categoryId,
    customFields,
    status,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nom és obligatori' });
  }

  try {
    const before = await prisma.product.findUnique({ where: { id: productId } });

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        clientRef,
        name,
        description,
        label,
        imageUrl,
        tags,
        categoryId: categoryId ? parseInt(categoryId) : null,
        customFields,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Product',
        entityId: productId,
        user: { connect: { id: req.userId } },
      },
    });

    await saveChangeHistory({
      entity: 'Product',
      entityId: productId,
      action: 'UPDATE',
      dataBefore: before,
      dataAfter: updated,
      userId: req.userId,
    });

    res.json(updated);
  } catch (err) {
    console.error('Error editant producte:', err);
    res.status(500).json({ error: 'Error al editar el producte' });
  }
});

/** ELIMINAR PRODUCTE */
app.delete('/products/:id', authenticateToken, async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    // 🔎 Comprovar si hi ha variants associades
    const variants = await prisma.variant.findMany({ where: { productId } });
    if (variants.length > 0) {
      return res.status(400).json({ error: 'No es pot eliminar el producte perquè té variants associades' });
    }

    const before = await prisma.product.findUnique({ where: { id: productId } });

    await prisma.product.delete({ where: { id: productId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Product',
        entityId: productId,
        user: { connect: { id: req.userId } },
      },
    });

    await saveChangeHistory({
      entity: 'Product',
      entityId: productId,
      action: 'DELETE',
      dataBefore: before,
      dataAfter: null,
      userId: req.userId,
    });

    res.json({ message: 'Producte eliminat correctament' });
  } catch (err) {
    console.error('Error eliminant producte:', err);
    res.status(500).json({ error: 'Error al eliminar el producte' });
  }
});

/** 🔹 OBTENIR CATEGORIES */
app.get('/categories', async (req, res) => {
  const { status, clientId, page = 1, limit = 20 } = req.query;

  const where = {
    ...(status && { status }),
    ...(clientId && { clientId: parseInt(clientId) }),
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        include: { children: true },
        orderBy: { name: 'asc' },
      }),
      prisma.category.count({ where }),
    ]);

    res.json({
      data: categories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error obtenint categories:', err);
    res.status(500).json({ error: 'Error al carregar categories' });
  }
});

/** EDITAR CATEGORIA D'UN PRODUCTE */
app.put('/products/:id/category', authenticateToken, async (req, res) => {
  const productId = parseInt(req.params.id);
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ error: 'CategoryId és obligatori' });
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        categoryId: parseInt(categoryId),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CATEGORY',
        entity: 'Product',
        entityId: productId,
        user: { connect: { id: req.userId } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error editant categoria del producte:', err);
    res.status(500).json({ error: 'Error al editar la categoria' });
  }
});


/** 🔹 CREAR CLIENT */
app.post('/clients', async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'Nom del client obligatori' });

  try {
    const client = await prisma.client.create({ data: { name } });
    res.status(201).json(client);
  } catch (err) {
    console.error('Error creant client:', err);
    res.status(500).json({ error: 'Error al crear client' });
  }
});

/** 🔹 CREAR ATRIBUT PER CLIENT */
app.post('/clients/:id/attributes', async (req, res) => {
  const clientId = parseInt(req.params.id);
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Nom i tipus són obligatoris' });
  }

  try {
    const attribute = await prisma.attribute.create({
      data: {
        name,
        type,
        client: { connect: { id: clientId } },
      },
    });
    res.status(201).json(attribute);
  } catch (err) {
    console.error('Error creant atribut:', err);
    res.status(500).json({ error: 'Error al crear atribut' });
  }
});

/** 🔹 ASSIGNAR VALOR D'ATRIBUT A VARIANT */
app.post('/variants/:id/attributes', async (req, res) => {
  const variantId = parseInt(req.params.id);
  const { attributeId, value } = req.body;

  if (!attributeId || value === undefined) {
    return res.status(400).json({ error: 'Falten dades' });
  }

  try {
    const attrValue = await prisma.attributeValue.create({
      data: {
        attribute: { connect: { id: attributeId } },
        variant: { connect: { id: variantId } },
        value,
      },
    });
    res.status(201).json(attrValue);
  } catch (err) {
    console.error('Error assignant atribut:', err);
    res.status(500).json({ error: 'Error al assignar atribut' });
  }
});

/** 🔹 LLISTAR ATRIBUTS D'UN CLIENT */
app.get('/clients/:id/attributes', async (req, res) => {
  const clientId = parseInt(req.params.id);

  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'ID del client no és vàlid' });
  }

  try {
    const attributes = await prisma.attribute.findMany({
      where: { clientId },
    });
    res.json(attributes);
  } catch (err) {
    console.error('Error obtenint atributs:', err);
    res.status(500).json({ error: 'Error al carregar atributs' });
  }
});

/** EDITAR ATRIBUT */
app.put('/attributes/:id', async (req, res) => {
  const attributeId = parseInt(req.params.id);
  const { name, type, userId } = req.body;

  if (isNaN(attributeId)) {
    return res.status(400).json({ error: 'ID de l\'atribut no és vàlid' });
  }

  if (!name || !type || !userId) {
    return res.status(400).json({ error: 'Nom, tipus i userId són obligatoris' });
  }

  try {
    const updated = await prisma.attribute.update({
      where: { id: attributeId },
      data: {
        name,
        type,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Attribute',
        entityId: attributeId,
        user: { connect: { id: userId } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error editant atribut:', err);
    res.status(500).json({ error: 'Error al editar l\'atribut' });
  }
});

/** ELIMINAR ATRIBUT */
app.delete('/attributes/:id', authenticateToken, async (req, res) => {
  const attributeId = parseInt(req.params.id);

  if (isNaN(attributeId)) {
    return res.status(400).json({ error: 'ID de l\'atribut no és vàlid' });
  }

  try {
    await prisma.attribute.delete({ where: { id: attributeId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Attribute',
        entityId: attributeId,
        user: { connect: { id: req.userId } },
      },
    });

    res.json({ message: 'Atribut eliminat correctament' });
  } catch (err) {
    console.error('Error eliminant atribut:', err);
    res.status(500).json({ error: 'Error al eliminar l\'atribut' });
  }
});

/** DETALL CATEGORIES */
app.get('/categories/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id);
  if (isNaN(categoryId)) {
    return res.status(400).json({ error: 'ID no vàlid' });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true, variants: true, products: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria no trobada' });
    }

    res.json(category);
  } catch (err) {
    console.error('Error obtenint categoria:', err);
    res.status(500).json({ error: 'Error al carregar la categoria' });
  }
});

/** DETALL PRODUCTE */
app.get('/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'ID no vàlid' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, category: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producte no trobat' });
    }

    res.json(product);
  } catch (err) {
    console.error('Error obtenint producte:', err);
    res.status(500).json({ error: 'Error al carregar el producte' });
  }
});

/** DETALL VARIANT */
app.get('/variants/:id', async (req, res) => {
  const variantId = parseInt(req.params.id);

  if (isNaN(variantId)) {
    return res.status(400).json({ error: 'ID de la variant no és vàlid' });
  }

  try {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        category: true,
        attributeValues: {
          include: { attribute: true },
        },
      },
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant no trobada' });
    }

    res.json(variant);
  } catch (err) {
    console.error('Error obtenint variant:', err);
    res.status(500).json({ error: 'Error intern al carregar la variant' });
  }
});

/** 🔹 PUJAR IMATGE */
app.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No s\'ha pujat cap fitxer' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ message: 'Imatge pujada correctament', url: imageUrl });
});

/** DETALL USUARI */
app.get('/users/:id', authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID no vàlid' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuari no trobat' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error obtenint usuari:', err);
    res.status(500).json({ error: 'Error al carregar usuari' });
  }
});


/** Endpoint per registre d'usuari */
import bcrypt from 'bcryptjs';

app.post('/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, email i password són obligatoris' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Error registrant usuari:', err);
    res.status(500).json({ error: 'Error al registrar l\'usuari' });
  }
});

app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i password són obligatoris' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Usuari no trobat' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Password incorrecte' });
    }

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ error: 'Error al iniciar sessió' });
  }
});

/** LLISTAR AUDIT LOGS */
app.get('/audit-logs', authenticateToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error obtenint audit logs:', err);
    res.status(500).json({ error: 'Error al carregar logs' });
  }
});

/**MIDDLEWARE IDENTIFICACIÓ */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
}
/**APLICAR MIDDLEWARE */
app.get('/products', authenticateToken, async (req, res) => {
  // req.userId disponible
  // pots filtrar per client, logs, etc.
});

const uploadImport = multer({ dest: './uploads' });

/**IMPORTACIÓ */
app.post('/import-products', authenticateToken, uploadImport.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No s\'ha pujat cap fitxer' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const createdProducts = [];

    for (const row of data) {
      const { name, description, clientId, categoryId, status } = row;

      if (!name || !clientId) continue;

      const product = await prisma.product.create({
        data: {
          name,
          description,
          clientId: parseInt(clientId),
          categoryId: categoryId ? parseInt(categoryId) : null,
          status: status ?? 'DRAFT',
        },
      });

      createdProducts.push(product);
    }

    res.json({ message: `Importació completada (${createdProducts.length} productes)`, products: createdProducts });
  } catch (err) {
    console.error('Error importació:', err);
    res.status(500).json({ error: 'Error durant la importació' });
  }
});

/**EXPORTACIÓ */
app.get('/export-products', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });

    const data = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      clientId: p.clientId,
      categoryName: p.category ? p.category.name : '',
      status: p.status,
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="products_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error exportació:', err);
    res.status(500).json({ error: 'Error durant l\'exportació' });
  }
});
app.get('/change-history', authenticateToken, async (req, res) => {
  const { entity, entityId, page = 1, limit = 20 } = req.query;

  const where = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = parseInt(entityId);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const [histories, total] = await Promise.all([
      prisma.changeHistory.findMany({
        where,
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.changeHistory.count({ where }),
    ]);

    res.json({
      data: histories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error obtenint history:', err);
    res.status(500).json({ error: 'Error al carregar historial' });
  }
});


/** 🚀 INICI DEL SERVIDOR */
const PORT = process.env.PORT || 4000;
app.use('/uploads', express.static(uploadDir));
app.listen(PORT, () => {
  console.log(`Servidor escoltant a http://localhost:${PORT}`);
});