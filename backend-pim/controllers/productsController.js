import prisma from '../prismaClient.js';
import { saveChangeHistory } from '../utils/changeHistory.js';

export async function createProduct(req, res) {
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
}

export async function getProducts(req, res) {
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
}

export async function updateProduct(req, res) {
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
}

export async function deleteProduct(req, res) {
  const productId = parseInt(req.params.id);

  try {
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
}

export async function updateProductCategory(req, res) {
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
}

export async function getProduct(req, res) {
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
}
