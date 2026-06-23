const { Router } = require('express');
const db = require('../utils/database');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.get('/', async (req, res) => {
  const products = await db.getProducts();
  res.json({ success: true, data: products });
});

router.put('/bulk', verifyToken, async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: 'Se esperaba un array de productos' });
  }
  await db.saveProducts(req.body);
  res.json({ success: true, data: req.body });
});

router.get('/reset', verifyToken, async (req, res) => {
  const products = await db.resetProducts();
  res.json({ success: true, data: products, message: 'Productos restablecidos' });
});

router.post('/', verifyToken, async (req, res) => {
  const { name, series, description, price, rating, image, tag, tagText } = req.body;
  if (!name || !series || !description || !price) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos (name, series, description, price)' });
  }
  const products = await db.getProducts();
  const id = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  const product = { id, name, series, description, price: Number(price), rating: Number(rating) || 0, image: image || '', tag: tag || '', tagText: tagText || '' };
  products.push(product);
  await db.saveProducts(products);
  res.status(201).json({ success: true, data: product });
});

router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, series, description, price, rating, image, tag, tagText } = req.body;
  const products = await db.getProducts();
  const idx = products.findIndex(p => p.id === Number(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado' });
  }
  products[idx] = { ...products[idx], name, series, description, price: Number(price), rating: Number(rating) || 0, image, tag, tagText };
  await db.saveProducts(products);
  res.json({ success: true, data: products[idx] });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  let products = await db.getProducts();
  const idx = products.findIndex(p => p.id === Number(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado' });
  }
  products.splice(idx, 1);
  await db.saveProducts(products);
  res.json({ success: true, message: 'Producto eliminado' });
});

module.exports = router;
