import prisma from '../prismaClient.js';
import { saveChangeHistory } from '../utils/changeHistory.js';

export async function createCategory(req, res) {
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
}

export async function updateCategory(req, res) {
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
}

export async function deleteCategory(req, res) {
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
}

export async function getCategories(req, res) {
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
}

export async function getCategory(req, res) {
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
}
