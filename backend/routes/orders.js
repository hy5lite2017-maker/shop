const { Router } = require('express');
const db = require('../utils/database');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  const orders = await db.getOrders();
  res.json({ success: true, data: orders });
});

router.put('/bulk', verifyToken, async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: 'Se esperaba un array de pedidos' });
  }
  await db.saveOrders(req.body);
  res.json({ success: true, data: req.body });
});

router.post('/', async (req, res) => {
  const { items, customer, payment, subtotal, shipping, tax, total, couponCode, discount } = req.body;
  if (!items || !customer || !payment || subtotal === undefined || shipping === undefined || tax === undefined || total === undefined) {
    return res.status(400).json({ success: false, error: 'Faltan datos del pedido' });
  }
  const orders = await db.getOrders();
  const id = orders.length ? orders.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1 : 1;
  const order = {
    id,
    items,
    customer,
    payment: typeof payment === 'object' ? payment.method : payment,
    subtotal,
    shipping,
    tax,
    total,
    discount: discount || 0,
    coupon: couponCode || null,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const allOrders = await db.getOrders();
  allOrders.unshift(order);
  await db.saveOrders(allOrders);
  res.status(201).json({ success: true, data: order });
});

router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Estado inválido. Valores: ${validStatuses.join(', ')}` });
  }
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === Number(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }
  orders[idx].status = status;
  await db.saveOrders(orders);
  res.json({ success: true, data: orders[idx] });
});

module.exports = router;
