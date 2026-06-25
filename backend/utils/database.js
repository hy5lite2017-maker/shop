const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Zoro — Wano Edition", series: "One Piece", description: "Camiseta oversized con estampado frontal y trasero de Zoro en su arco de Wano. Tela 100% algodón premium.", price: 44.90, rating: 4.9, image: "", tag: "new", tagText: "Nuevo" },
  { id: 2, name: "Gojo — Infinity", series: "Jujutsu Kaisen", description: "Diseño exclusivo de Gojo Satoru con efecto infinity. Estampado DTG de alta calidad.", price: 42.90, rating: 4.8, image: "", tag: "hot", tagText: "Popular" },
  { id: 3, name: "Levi — Ackerman", series: "Attack on Titan", description: "Camiseta con el estampado del capitán más fuerte de la humanidad. Fit regular, tela suave.", price: 39.90, rating: 4.9, image: "", tag: "", tagText: "" },
  { id: 4, name: "Luffy — Gear 5", series: "One Piece", description: "Edición limitada de Luffy en Gear 5. Estampado vibrante con detalles en neón.", price: 47.90, rating: 5.0, image: "", tag: "limited", tagText: "Limitado" },
  { id: 5, name: "Nezuko — Kamado", series: "Demon Slayer", description: "Diseño kawaii de Nezuko con su característico kimono. Estampado frontal premium.", price: 41.90, rating: 4.9, image: "", tag: "hot", tagText: "Popular" },
  { id: 6, name: "Itadori — Sukuna", series: "Jujutsu Kaisen", description: "Estampado de Itadori Yuji con los rasgos de Sukuna. Tela 100% algodón peinado.", price: 43.90, rating: 4.7, image: "", tag: "new", tagText: "Nuevo" }
];

const DEFAULT_COUPONS = [
  { id: 1, code: "ANIME10", type: "percentage", value: 10, minPurchase: 30, expiresAt: new Date("2027-12-31"), used: 0, maxUses: 999, active: true },
  { id: 2, code: "OTAKU20", type: "percentage", value: 20, minPurchase: 60, expiresAt: new Date("2026-12-31"), used: 0, maxUses: 100, active: true },
  { id: 3, code: "ENVIOFREE", type: "fixed", value: 10, minPurchase: 40, expiresAt: new Date("2026-12-31"), used: 0, maxUses: 50, active: true }
];

function stripMongo(obj) {
  if (!obj) return obj;
  const { _id, __v, ...rest } = obj;
  return rest;
}

async function seedDefaults() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(DEFAULT_PRODUCTS);
    console.log('🌱 Productos por defecto insertados');
  }
  const cCount = await Coupon.countDocuments();
  if (cCount === 0) {
    await Coupon.insertMany(DEFAULT_COUPONS);
    console.log('🌱 Cupones por defecto insertados');
  }
}

// ─── PRODUCTS ───
async function getProducts() {
  const products = await Product.find().sort({ id: 1 }).lean();
  return products.map(stripMongo);
}
async function saveProducts(products) {
  await Product.deleteMany({});
  if (products.length) await Product.insertMany(products);
}
async function resetProducts() {
  await Product.deleteMany({});
  await Product.insertMany(DEFAULT_PRODUCTS);
  return getProducts();
}

// ─── ORDERS ───
async function getOrders() {
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return orders.map(stripMongo);
}
async function saveOrders(orders) {
  await Order.deleteMany({});
  if (orders.length) await Order.insertMany(orders);
}

// ─── COUPONS ───
async function getCoupons() {
  const coupons = await Coupon.find().sort({ id: 1 }).lean();
  return coupons.map(stripMongo);
}
async function saveCoupons(coupons) {
  await Coupon.deleteMany({});
  if (coupons.length) await Coupon.insertMany(coupons);
}

module.exports = { seedDefaults, getProducts, saveProducts, resetProducts, getOrders, saveOrders, getCoupons, saveCoupons };
