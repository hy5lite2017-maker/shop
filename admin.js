// ─── AUTH ───
async function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  const ok = await loginAdmin(user, pass);
  if (ok) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-wrap').classList.add('show');
    initAdmin();
  } else {
    err.textContent = '❌ Usuario o contraseña incorrectos';
    err.classList.add('show');
  }
}
function doLogout() {
  sessionStorage.removeItem('animestyle_admin');
  sessionStorage.removeItem('animestyle_token');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-wrap').classList.remove('show');
}
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('animestyle_admin') === '1' && sessionStorage.getItem('animestyle_token')) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-wrap').classList.add('show');
    initAdmin();
  }
  document.getElementById('login-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

async function initAdmin() {
  await renderProducts();
  await renderOrders();
  await renderCoupons();
  renderAnalytics();
}

// ─── TOAST ───
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.querySelector('.msg').textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── TABS ───
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'analytics') renderAnalytics();
    });
  });
});

// ─── PRODUCT MODAL ───
let editingProductId = null;

function openProductModal(product = null) {
  editingProductId = product ? product.id : null;
  document.getElementById('product-modal-title').textContent = product ? '✏️ Editar producto' : '➕ Nuevo producto';
  document.getElementById('f-id').value = product ? product.id : '';
  document.getElementById('f-name').value = product ? product.name : '';
  document.getElementById('f-series').value = product ? product.series : '';
  document.getElementById('f-desc').value = product ? product.description : '';
  document.getElementById('f-price').value = product ? product.price : '';
  document.getElementById('f-rating').value = product ? product.rating : '5.0';
  document.getElementById('f-tag').value = product ? product.tag : '';
  document.getElementById('f-tagText').value = product ? product.tagText : '';
  document.getElementById('f-image').value = product ? product.image : '';
  previewProductImage();
  document.getElementById('product-modal').classList.add('show');
}

function previewProductImage() {
  const url = document.getElementById('f-image').value.trim();
  const p = document.getElementById('f-preview');
  if (url) {
    p.innerHTML = `<img src="${url}" onerror="this.outerHTML='<span style=font-size:2.5rem>👕</span>'" />`;
  } else {
    p.innerHTML = `<span style="font-size:2.5rem">👕</span>`;
  }
}

function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('❌ La imagen no debe superar 2MB', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('f-image').value = e.target.result;
    previewProductImage();
    showToast('📸 Imagen cargada correctamente');
  };
  reader.readAsDataURL(file);
}

async function saveProduct() {
  const products = await getProducts();
  const name = document.getElementById('f-name').value.trim();
  const series = document.getElementById('f-series').value.trim();
  const desc = document.getElementById('f-desc').value.trim();
  const price = parseFloat(document.getElementById('f-price').value);
  const rating = parseFloat(document.getElementById('f-rating').value) || 5.0;
  const tag = document.getElementById('f-tag').value;
  const tagText = document.getElementById('f-tagText').value.trim();
  const image = document.getElementById('f-image').value.trim();

  if (!name || !series || isNaN(price)) {
    showToast('❌ Nombre, serie y precio son obligatorios', 'error');
    return;
  }

  if (editingProductId) {
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) products[idx] = { ...products[idx], name, series, description: desc, price, rating, tag, tagText, image };
    showToast('✅ Producto actualizado');
  } else {
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({ id: newId, name, series, description: desc, price, rating, tag, tagText, image });
    showToast('✅ Producto creado');
  }
  await saveProducts(products);
  closeModal('product-modal');
  renderProducts();
}

function editProduct(id) {
  getProducts().then(products => {
    const p = products.find(x => x.id === id);
    if (p) openProductModal(p);
  });
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto definitivamente?')) return;
  const products = await getProducts();
  await saveProducts(products.filter(p => p.id !== id));
  renderProducts();
  showToast('🗑️ Producto eliminado');
}

async function resetAll() {
  if (!confirm('¿Restaurar productos por defecto? Se perderán todos los cambios.')) return;
  await resetProducts();
  renderProducts();
  showToast('🔄 Productos restaurados');
}

// ─── RENDER PRODUCTS ───
async function renderProducts() {
  const products = await getProducts();
  const tbody = document.getElementById('products-body');
  const tags = { new: 'new', hot: 'hot', limited: 'limited' };

  document.getElementById('product-stats').innerHTML = `
    <div class="stat-card"><div class="number">${products.length}</div><div class="label">Total productos</div></div>
    <div class="stat-card"><div class="number">$${products.length ? (products.reduce((a,p)=>a+p.price,0)/products.length).toFixed(2) : '0'}</div><div class="label">Precio promedio</div></div>
    <div class="stat-card"><div class="number">${products.length ? Math.max(...products.map(p=>p.rating)).toFixed(1) : '0'}</div><div class="label">Rating más alto</div></div>
    <div class="stat-card"><div class="number">${products.filter(p=>p.tag).length}</div><div class="label">Con etiqueta</div></div>
  `;

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📦</div><h3>No hay productos</h3><p style="font-size:.85rem;margin-top:4px">Agrega tu primer producto</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `<tr>
    <td><div class="thumb">${p.image ? `<img src="${p.image}" />` : '👕'}</div></td>
    <td><strong>${p.name}</strong></td>
    <td>${p.series}</td>
    <td>$${p.price.toFixed(2)}</td>
    <td>${p.tagText ? `<span class="tag-badge ${tags[p.tag] || ''}">${p.tagText}</span>` : '—'}</td>
    <td>⭐ ${p.rating}</td>
    <td class="actions-cell">
      <button class="btn btn-secondary btn-xs" onclick="editProduct(${p.id})">✏️</button>
      <button class="btn btn-danger btn-xs" onclick="deleteProduct(${p.id})">🗑️</button>
    </td>
  </tr>`).join('');
}

// ─── RENDER ORDERS ───
async function renderOrders() {
  const orders = await getOrders();
  const container = document.getElementById('orders-container');

  const total = orders.length;
  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  const pending = orders.filter(o => o.status === 'pending').length;
  document.getElementById('order-stats').innerHTML = `
    <div class="stat-card"><div class="number">${total}</div><div class="label">Total pedidos</div></div>
    <div class="stat-card"><div class="number">$${revenue.toFixed(2)}</div><div class="label">Ingresos totales</div></div>
    <div class="stat-card"><div class="number">${pending}</div><div class="label">Pendientes</div></div>
    <div class="stat-card"><div class="number">${total ? (revenue/total).toFixed(2) : '0'}</div><div class="label">Ticket promedio</div></div>
  `;

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>No hay pedidos todavía</h3><p style="font-size:.85rem;margin-top:4px">Los pedidos aparecerán aquí cuando los clientes compren</p></div>`;
    return;
  }

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusLabels = { pending: '⏳ Pendiente', processing: '⚙️ Procesando', shipped: '🚚 Enviado', delivered: '✅ Entregado', cancelled: '❌ Cancelado' };

  container.innerHTML = orders.map(o => {
    const itemsHtml = o.items.map(item => `<div class="item"><span class="name">${item.name} × ${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>`).join('');
    return `<div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">#${String(o.id).padStart(4, '0')}</div>
          <div class="order-date">${new Date(o.createdAt).toLocaleDateString('es')} — ${new Date(o.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <select class="status-select ${o.status}" onchange="changeOrderStatus(${o.id}, this.value)">
          ${statuses.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
        </select>
      </div>
      <div class="order-info">
        <div><strong>Cliente:</strong> ${o.customer?.name || '—'}</div>
        <div><strong>Email:</strong> ${o.customer?.email || '—'}</div>
        <div><strong>Dirección:</strong> ${o.customer?.address || '—'}</div>
        <div><strong>Método:</strong> ${o.payment || '—'}</div>
      </div>
      <div class="order-items">
        ${itemsHtml}
        ${o.coupon ? `<div class="item" style="color:var(--green)"><span>Cupón: ${o.coupon}</span><span>-$${(o.discount || 0).toFixed(2)}</span></div>` : ''}
        <div class="total-row"><span>Total</span><span>$${o.total.toFixed(2)}</span></div>
      </div>
    </div>`;
  }).join('');
}

async function changeOrderStatus(id, status) {
  await updateOrderStatus(id, status);
  renderOrders();
  showToast(`📋 Pedido #${String(id).padStart(4, '0')} → ${status}`);
}

// ─── DEMO ORDERS ───
async function fillDemoOrders() {
  const existing = await getOrders();
  if (existing.length && !confirm('¿Agregar pedidos demo a los existentes?')) return;
  const products = await getProducts();
  if (!products.length) { showToast('❌ No hay productos para crear pedidos demo', 'error'); return; }

  const demos = [
    { items: [{ productId: products[0].id, name: products[0].name, price: products[0].price, quantity: 2 }, { productId: products[1].id, name: products[1].name, price: products[1].price, quantity: 1 }], customer: { name: 'Mitsuki Chan', email: 'mitsuki@example.com', address: 'Av. Otaku 123, Tokyo' }, payment: 'Tarjeta', coupon: 'ANIME10', discount: 9.78, status: 'delivered', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { items: [{ productId: products[2].id, name: products[2].name, price: products[2].price, quantity: 1 }], customer: { name: 'Kaito Rivera', email: 'kaito@example.com', address: 'Calle Manga 456, Lima' }, payment: 'PayPal', coupon: '', discount: 0, status: 'shipped', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { items: [{ productId: products[3].id, name: products[3].name, price: products[3].price, quantity: 1 }, { productId: products[4].id, name: products[4].name, price: products[4].price, quantity: 1 }], customer: { name: 'Sakura López', email: 'sakura@example.com', address: 'Jr. Anime 789, Cusco' }, payment: 'Transferencia', coupon: 'OTAKU20', discount: 16.76, status: 'processing', createdAt: new Date().toISOString() },
    { items: [{ productId: products[5].id, name: products[5].name, price: products[5].price, quantity: 3 }], customer: { name: 'Ren Yamada', email: 'ren@example.com', address: 'Av. Cosplay 321, Santiago' }, payment: 'Tarjeta', coupon: '', discount: 0, status: 'pending', createdAt: new Date().toISOString() }
  ];

  demos.forEach(d => {
    d.subtotal = d.items.reduce((a, i) => a + i.price * i.quantity, 0);
    d.total = d.subtotal - d.discount;
  });

  const orders = existing;
  demos.forEach(d => {
    d.id = orders.length ? orders.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1 : 1;
    orders.unshift(d);
  });
  await saveOrders(orders);
  renderOrders();
  renderAnalytics();
  showToast('📥 4 pedidos demo generados');
  document.getElementById('demo-orders-btn').textContent = '📥 Generar más pedidos demo';
}

// ─── RENDER COUPONS ───
async function renderCoupons() {
  const coupons = await getCoupons();
  const container = document.getElementById('coupons-container');
  if (!coupons.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🏷️</div><h3>No hay cupones</h3></div>`;
    return;
  }
  container.innerHTML = coupons.map(c => `
    <div class="coupon-card">
      ${!c.active ? '<div class="inactive-overlay">🚫 Inactivo</div>' : ''}
      <div class="code">${c.code}</div>
      <div class="detail">${c.type === 'percentage' ? `${c.value}% OFF` : `$${c.value} OFF`} ${c.minPurchase > 0 ? `· Mín: $${c.minPurchase.toFixed(2)}` : ''}</div>
      <div class="detail"><strong>Usos:</strong> ${c.used} / ${c.maxUses}</div>
      <div class="detail"><strong>Expira:</strong> ${new Date(c.expiresAt).toLocaleDateString('es')}</div>
      <div class="actions">
        <button class="btn btn-secondary btn-xs" onclick="editCoupon(${c.id})">✏️</button>
        <button class="btn btn-danger btn-xs" onclick="deleteCoupon(${c.id})">🗑️</button>
        <button class="btn btn-xs ${c.active ? 'btn-secondary' : 'btn-green'}" onclick="toggleCoupon(${c.id})">${c.active ? '🚫 Desactivar' : '✅ Activar'}</button>
      </div>
    </div>
  `).join('');
}

// ─── COUPON MODAL ───
let editingCouponId = null;
function openCouponModal(coupon = null) {
  editingCouponId = coupon ? coupon.id : null;
  document.getElementById('coupon-modal-title').textContent = coupon ? '✏️ Editar cupón' : '➕ Nuevo cupón';
  document.getElementById('cf-id').value = coupon ? coupon.id : '';
  document.getElementById('cf-code').value = coupon ? coupon.code : '';
  document.getElementById('cf-type').value = coupon ? coupon.type : 'percentage';
  document.getElementById('cf-value').value = coupon ? coupon.value : '';
  document.getElementById('cf-min').value = coupon ? coupon.minPurchase : 0;
  document.getElementById('cf-max').value = coupon ? coupon.maxUses : 100;
  document.getElementById('cf-expires').value = coupon ? coupon.expiresAt : '';
  document.getElementById('cf-active').checked = coupon ? coupon.active : true;
  document.getElementById('coupon-modal').classList.add('show');
}

async function saveCoupon() {
  const code = document.getElementById('cf-code').value.trim().toUpperCase();
  const type = document.getElementById('cf-type').value;
  const value = parseFloat(document.getElementById('cf-value').value);
  const minPurchase = parseFloat(document.getElementById('cf-min').value) || 0;
  const maxUses = parseInt(document.getElementById('cf-max').value) || 100;
  const expiresAt = document.getElementById('cf-expires').value;
  const active = document.getElementById('cf-active').checked;

  if (!code || isNaN(value)) { showToast('❌ Código y valor son obligatorios', 'error'); return; }
  if (!expiresAt) { showToast('❌ Fecha de expiración obligatoria', 'error'); return; }

  const coupons = await getCoupons();
  if (editingCouponId) {
    const idx = coupons.findIndex(c => c.id === editingCouponId);
    if (idx !== -1) coupons[idx] = { ...coupons[idx], code, type, value, minPurchase, maxUses, expiresAt, active };
    showToast('✅ Cupón actualizado');
  } else {
    if (coupons.some(c => c.code === code)) { showToast('❌ Ese código ya existe', 'error'); return; }
    const newId = coupons.length ? Math.max(...coupons.map(c => c.id)) + 1 : 1;
    coupons.push({ id: newId, code, type, value, minPurchase, maxUses, expiresAt, used: 0, active });
    showToast('✅ Cupón creado');
  }
  await saveCoupons(coupons);
  closeModal('coupon-modal');
  renderCoupons();
}

function editCoupon(id) {
  getCoupons().then(coupons => {
    const c = coupons.find(x => x.id === id);
    if (c) openCouponModal(c);
  });
}

async function deleteCoupon(id) {
  if (!confirm('¿Eliminar este cupón?')) return;
  const coupons = await getCoupons();
  await saveCoupons(coupons.filter(c => c.id !== id));
  renderCoupons();
  showToast('🗑️ Cupón eliminado');
}

async function toggleCoupon(id) {
  const coupons = await getCoupons();
  const c = coupons.find(x => x.id === id);
  if (c) { c.active = !c.active; await saveCoupons(coupons); renderCoupons(); showToast(c.active ? '✅ Cupón activado' : '🚫 Cupón desactivado'); }
}

// ─── ANALYTICS ───
function renderAnalytics() {
  const container = document.getElementById('analytics-cards');
  const products = JSON.parse(localStorage.getItem('animestyle_products') || '[]');
  const orders = JSON.parse(localStorage.getItem('animestyle_orders') || '[]');

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  const totalOrders = orders.length;
  const totalItems = orders.reduce((a, o) => a + o.items.reduce((b, i) => b + i.quantity, 0), 0);
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const topProducts = getTopProducts(orders);

  container.innerHTML = `
    <div class="analytics-card"><div class="value pink">$${totalRevenue.toFixed(2)}</div><div class="label">Ingresos totales</div></div>
    <div class="analytics-card"><div class="value blue">${totalOrders}</div><div class="label">Pedidos totales</div></div>
    <div class="analytics-card"><div class="value green">${totalItems}</div><div class="label">Productos vendidos</div></div>
    <div class="analytics-card"><div class="value orange">$${avgOrder.toFixed(2)}</div><div class="label">Ticket promedio</div></div>
    <div class="analytics-card"><div class="value" style="color:var(--orange)">${pendingOrders}</div><div class="label">Pendientes de enviar</div></div>
    <div class="analytics-card"><div class="value" style="color:var(--red)">${cancelledOrders}</div><div class="label">Cancelados</div></div>
  `;

  const topContainer = document.getElementById('top-products-container');
  if (topProducts.length) {
    const maxCount = topProducts[0].count;
    topContainer.innerHTML = `<h3>🏆 Productos más vendidos</h3>
      ${topProducts.map(p => `<div class="bar-item">
        <span class="bar-name">${p.name}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(p.count / maxCount * 100).toFixed(0)}%"></div></div>
        <span class="bar-count">${p.count}</span>
      </div>`).join('')}`;
  } else {
    topContainer.innerHTML = '';
  }
}

function getTopProducts(orders) {
  const filtered = orders.filter(o => o.status !== 'cancelled');
  const countMap = {};
  filtered.forEach(o => o.items.forEach(i => {
    countMap[i.name] = (countMap[i.name] || 0) + i.quantity;
  }));
  return Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
}

// ─── UTILS ───
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  editingProductId = null;
  editingCouponId = null;
}

// ─── CLOSE MODAL ON OVERLAY ───
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
