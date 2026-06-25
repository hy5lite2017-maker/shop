const { Router } = require('express');
const db = require('../utils/database');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  const coupons = await db.getCoupons();
  res.json({ success: true, data: coupons });
});

router.put('/bulk', verifyToken, async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: 'Se esperaba un array de cupones' });
  }
  await db.saveCoupons(req.body);
  res.json({ success: true, data: req.body });
});

router.post('/validate', validate.couponValidate, async (req, res) => {
  const { code, subtotal } = req.body;
  const coupons = await db.getCoupons();
  const coupon = coupons.find(c => c.code === code.toUpperCase());
  if (!coupon) {
    return res.status(404).json({ success: false, error: 'Cupón no encontrado', valid: false });
  }
  if (!coupon.active) {
    return res.json({ success: false, error: 'Cupón desactivado', valid: false });
  }
  if (new Date(coupon.expiresAt) < new Date()) {
    return res.json({ success: false, error: 'Cupón expirado', valid: false });
  }
  if (coupon.used >= coupon.maxUses) {
    return res.json({ success: false, error: 'Cupón agotado', valid: false });
  }
  if (coupon.minPurchase && subtotal < coupon.minPurchase) {
    return res.json({ success: false, error: `Mínimo $${coupon.minPurchase} para usar este cupón`, valid: false });
  }
  let discount = coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value;
  discount = Math.min(discount, subtotal);
  res.json({ success: true, valid: true, data: { ...coupon, discount: Math.round(discount * 100) / 100 } });
});

router.post('/', verifyToken, validate.coupon, async (req, res) => {
  const { code, type, value, minPurchase, expiresAt, maxUses } = req.body;
  const coupons = await db.getCoupons();
  if (coupons.find(c => c.code === code.toUpperCase())) {
    return res.status(409).json({ success: false, error: 'El código ya existe' });
  }
  const id = coupons.length ? Math.max(...coupons.map(c => c.id)) + 1 : 1;
  const coupon = { id, code: code.toUpperCase(), type, value: Number(value), minPurchase: Number(minPurchase) || 0, expiresAt: expiresAt || '2027-12-31', used: 0, maxUses: Number(maxUses) || 999, active: true };
  coupons.push(coupon);
  await db.saveCoupons(coupons);
  res.status(201).json({ success: true, data: coupon });
});

router.put('/:id', verifyToken, validate.couponUpdate, async (req, res) => {
  const { id } = req.params;
  const { code, type, value, minPurchase, expiresAt, maxUses, active } = req.body;
  const coupons = await db.getCoupons();
  const idx = coupons.findIndex(c => c.id === Number(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Cupón no encontrado' });
  }
  Object.assign(coupons[idx], { code: code ? code.toUpperCase() : coupons[idx].code, type: type || coupons[idx].type, value: value !== undefined ? Number(value) : coupons[idx].value, minPurchase: minPurchase !== undefined ? Number(minPurchase) : coupons[idx].minPurchase, expiresAt: expiresAt || coupons[idx].expiresAt, maxUses: maxUses !== undefined ? Number(maxUses) : coupons[idx].maxUses, active: active !== undefined ? active : coupons[idx].active });
  await db.saveCoupons(coupons);
  res.json({ success: true, data: coupons[idx] });
});

router.delete('/:id', verifyToken, validate.idParam, async (req, res) => {
  const { id } = req.params;
  let coupons = await db.getCoupons();
  const idx = coupons.findIndex(c => c.id === Number(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Cupón no encontrado' });
  }
  coupons.splice(idx, 1);
  await db.saveCoupons(coupons);
  res.json({ success: true, message: 'Cupón eliminado' });
});

router.put('/:id/used', verifyToken, validate.idParam, async (req, res) => {
  const { id } = req.params;
  const coupons = await db.getCoupons();
  const idx = coupons.findIndex(c => c.id === Number(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Cupón no encontrado' });
  }
  coupons[idx].used += 1;
  await db.saveCoupons(coupons);
  res.json({ success: true, data: coupons[idx] });
});

module.exports = router;
