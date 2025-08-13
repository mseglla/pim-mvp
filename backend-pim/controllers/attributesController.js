import prisma from '../prismaClient.js';

export async function createAttribute(req, res) {
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
}

export async function assignAttributeToVariant(req, res) {
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
}

export async function listAttributesByClient(req, res) {
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
}

export async function updateAttribute(req, res) {
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
}

export async function deleteAttribute(req, res) {
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
}
