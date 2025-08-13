import prisma from '../prismaClient.js';

export async function getAuditLogs(req, res) {
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
}

export async function getChangeHistory(req, res) {
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
}
