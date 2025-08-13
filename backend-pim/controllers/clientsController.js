import prisma from '../prismaClient.js';

export async function createClient(req, res) {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'Nom del client obligatori' });

  try {
    const client = await prisma.client.create({ data: { name } });
    res.status(201).json(client);
  } catch (err) {
    console.error('Error creant client:', err);
    res.status(500).json({ error: 'Error al crear client' });
  }
}
