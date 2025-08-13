export function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No s\'ha pujat cap fitxer' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ message: 'Imatge pujada correctament', url: imageUrl });
}
