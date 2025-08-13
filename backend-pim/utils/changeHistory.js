import prisma from '../prismaClient.js';

export async function saveChangeHistory({ entity, entityId, action, dataBefore, dataAfter, userId }) {
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
