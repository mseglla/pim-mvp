import prisma from '../prismaClient.js';
import { saveChangeHistory } from '../utils/changeHistory.js';

export async function createVariant(req, res) {
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

    res.status(201).json(variant);
  } catch (err) {
    console.error('Error creant variant:', err);
    res.status(500).json({ error: 'Error al crear la variant' });
  }
}

export async function getVariants(req, res) {
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
}

export async function assignProduct(req, res) {
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
}

export async function updateVariantCategory(req, res) {
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
}

export async function updateVariant(req, res) {
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
}

export async function deleteVariant(req, res) {
  const variantId = parseInt(req.params.id);

  try {
    const before = await prisma.variant.findUnique({ where: { id: variantId } });
    await prisma.variant.delete({ where: { id: variantId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Variant',
        entityId: variantId,
        user: { connect: { id: req.userId } },
      },
    });

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
}

export async function getVariant(req, res) {
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
}
