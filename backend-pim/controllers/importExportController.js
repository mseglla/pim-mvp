import xlsx from 'xlsx';
import prisma from '../prismaClient.js';

export async function importProducts(req, res) {
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
}

export async function exportProducts(req, res) {
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
}
