const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

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

router.post('/', validate.order, async (req, res) => {
  const { items, customer, payment, subtotal, shipping, tax, total, couponCode, discount } = req.body;
  const order = {
    id: uuidv4(),
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

router.put('/:id/status', verifyToken, validate.orderStatus, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }
  orders[idx].status = status;
  await db.saveOrders(orders);
  res.json({ success: true, data: orders[idx] });
});

module.exports = router;
