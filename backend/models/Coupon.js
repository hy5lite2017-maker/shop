const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  code: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  used: { type: Number, default: 0 },
  maxUses: { type: Number, default: 999 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
