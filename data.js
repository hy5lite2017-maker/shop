const API_BASE = 'https://animestyle-api.onrender.com/api';

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Zoro — Wano Edition", series: "One Piece", description: "Camiseta oversized con estampado frontal y trasero de Zoro en su arco de Wano. Tela 100% algodón premium.", price: 44.90, rating: 4.9, image: "", tag: "new", tagText: "Nuevo" },
  { id: 2, name: "Gojo — Infinity", series: "Jujutsu Kaisen", description: "Diseño exclusivo de Gojo Satoru con efecto infinity. Estampado DTG de alta calidad.", price: 42.90, rating: 4.8, image: "", tag: "hot", tagText: "Popular" },
  { id: 3, name: "Levi — Ackerman", series: "Attack on Titan", description: "Camiseta con el estampado del capitán más fuerte de la humanidad. Fit regular, tela suave.", price: 39.90, rating: 4.9, image: "", tag: "", tagText: "" },
  { id: 4, name: "Luffy — Gear 5", series: "One Piece", description: "Edición limitada de Luffy en Gear 5. Estampado vibrante con detalles en neón.", price: 47.90, rating: 5.0, image: "", tag: "limited", tagText: "Limitado" },
  { id: 5, name: "Nezuko — Kamado", series: "Demon Slayer", description: "Diseño kawaii de Nezuko con su característico kimono. Estampado frontal premium.", price: 41.90, rating: 4.9, image: "", tag: "hot", tagText: "Popular" },
  { id: 6, name: "Itadori — Sukuna", series: "Jujutsu Kaisen", description: "Estampado de Itadori Yuji con los rasgos de Sukuna. Tela 100% algodón peinado.", price: 43.90, rating: 4.7, image: "", tag: "new", tagText: "Nuevo" }
];

const DEFAULT_COUPONS = [
  { id: 1, code: "ANIME10", type: "percentage", value: 10, minPurchase: 30, expiresAt: "2027-12-31", used: 0, maxUses: 999, active: true },
  { id: 2, code: "OTAKU20", type: "percentage", value: 20, minPurchase: 60, expiresAt: "2026-12-31", used: 0, maxUses: 100, active: true },
  { id: 3, code: "ENVIOFREE", type: "fixed", value: 10, minPurchase: 40, expiresAt: "2026-12-31", used: 0, maxUses: 50, active: true }
];

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts.headers }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getToken() {
  return sessionStorage.getItem('animestyle_token');
}

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

async function loginAdmin(user, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: user, password: password })
  });
  if (res && res.success) {
    sessionStorage.setItem('animestyle_token', res.token);
    sessionStorage.setItem('animestyle_admin', '1');
    return true;
  }
  return false;
}

// ─── PRODUCTS ───
async function getProducts() {
  const res = await apiFetch('/products');
  if (res && res.success) {
    localStorage.setItem('animestyle_products', JSON.stringify(res.data));
    return res.data;
  }
  const stored = localStorage.getItem('animestyle_products');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('animestyle_products', JSON.stringify(DEFAULT_PRODUCTS));
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
}

async function saveProducts(products) {
  localStorage.setItem('animestyle_products', JSON.stringify(products));
  await apiFetch('/products/bulk', {
    method: 'PUT',
    body: JSON.stringify(products),
    headers: authHeaders()
  });
}

async function resetProducts() {
  const res = await apiFetch('/products/reset', { headers: authHeaders() });
  if (res && res.success) {
    localStorage.setItem('animestyle_products', JSON.stringify(res.data));
    return JSON.parse(JSON.stringify(res.data));
  }
  localStorage.setItem('animestyle_products', JSON.stringify(DEFAULT_PRODUCTS));
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
}

// ─── ORDERS ───
async function getOrders() {
  const res = await apiFetch('/orders', { headers: authHeaders() });
  if (res && res.success) {
    localStorage.setItem('animestyle_orders', JSON.stringify(res.data));
    return res.data;
  }
  const stored = localStorage.getItem('animestyle_orders');
  return stored ? JSON.parse(stored) : [];
}

async function saveOrders(orders) {
  localStorage.setItem('animestyle_orders', JSON.stringify(orders));
  await apiFetch('/orders/bulk', {
    method: 'PUT',
    body: JSON.stringify(orders),
    headers: authHeaders()
  });
}

async function addOrder(order) {
  const res = await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
  if (res && res.success) {
    const orders = JSON.parse(localStorage.getItem('animestyle_orders') || '[]');
    orders.unshift(res.data);
    localStorage.setItem('animestyle_orders', JSON.stringify(orders));
    return res.data;
  }
  const orders = JSON.parse(localStorage.getItem('animestyle_orders') || '[]');
  order.id = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
  order.createdAt = new Date().toISOString();
  orders.unshift(order);
  localStorage.setItem('animestyle_orders', JSON.stringify(orders));
  return order;
}

async function updateOrderStatus(id, status) {
  const res = await apiFetch('/orders/' + id + '/status', {
    method: 'PUT',
    body: JSON.stringify({ status }),
    headers: authHeaders()
  });
  const orders = JSON.parse(localStorage.getItem('animestyle_orders') || '[]');
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) orders[idx].status = status;
  localStorage.setItem('animestyle_orders', JSON.stringify(orders));
  if (res && res.success) return res.data;
  return orders[idx] || null;
}

// ─── COUPONS ───
async function getCoupons() {
  const res = await apiFetch('/coupons', { headers: authHeaders() });
  if (res && res.success) {
    localStorage.setItem('animestyle_coupons', JSON.stringify(res.data));
    return res.data;
  }
  const stored = localStorage.getItem('animestyle_coupons');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('animestyle_coupons', JSON.stringify(DEFAULT_COUPONS));
  return JSON.parse(JSON.stringify(DEFAULT_COUPONS));
}

async function saveCoupons(coupons) {
  localStorage.setItem('animestyle_coupons', JSON.stringify(coupons));
  await apiFetch('/coupons/bulk', {
    method: 'PUT',
    body: JSON.stringify(coupons),
    headers: authHeaders()
  });
}

async function validateCoupon(code, subtotal) {
  const res = await apiFetch('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal })
  });
  if (res && res.valid) {
    return { valid: true, discount: res.data.discount, code: res.data.code, id: res.data.id };
  }
  if (res && !res.valid) {
    return { valid: false, msg: res.error || 'Cupón inválido' };
  }
  const coupons = JSON.parse(localStorage.getItem('animestyle_coupons') || '[]');
  const c = coupons.find(x => x.code.toUpperCase() === code.toUpperCase().trim() && x.active);
  if (!c) return { valid: false, msg: 'Código inválido' };
  if (new Date(c.expiresAt) < new Date()) return { valid: false, msg: 'Cupón expirado' };
  if (c.used >= c.maxUses) return { valid: false, msg: 'Cupón agotado' };
  if (subtotal < c.minPurchase) return { valid: false, msg: 'Mínimo $' + c.minPurchase.toFixed(2) + ' para este cupón' };
  const discount = c.type === 'percentage' ? subtotal * c.value / 100 : c.value;
  return { valid: true, discount: Math.min(discount, subtotal), code: c.code, id: c.id };
}

async function useCoupon(id) {
  await apiFetch('/coupons/' + id + '/used', {
    method: 'PUT',
    headers: authHeaders()
  });
  const coupons = JSON.parse(localStorage.getItem('animestyle_coupons') || '[]');
  const c = coupons.find(x => x.id === id);
  if (c) { c.used++; localStorage.setItem('animestyle_coupons', JSON.stringify(coupons)); }
}
