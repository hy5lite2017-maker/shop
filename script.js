// ─── Render Products from data.js ───
async function renderProducts() {
  const products = await getProducts();
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const tagClasses = { new: 'new', hot: 'hot', limited: 'limited' };
  grid.innerHTML = products.map(p => {
    const tagClass = tagClasses[p.tag] || '';
    const tagHtml = p.tagText ? `<span class="tag ${tagClass}">${sanitize(p.tagText)}</span>` : '';
    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${sanitize(p.name)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span style="font-size:4rem;display:none">👕</span>`
      : `<span style="font-size:4rem">👕</span>`;
    return `<div class="product-card reveal" data-id="${p.id}">
      <div class="img-wrap" style="position:relative;cursor:pointer">${tagHtml}${imgHtml}
        <button class="quick-view" aria-label="Vista rápida">🔍</button>
      </div>
      <div class="info">
        <h4>${sanitize(p.name)}</h4>
        <p class="series">${sanitize(p.series)}</p>
        <div class="row">
          <span class="price">$${p.price.toFixed(2)}</span>
          <span class="rating">⭐ ${p.rating}</span>
        </div>
        <button class="add-cart" data-product='${JSON.stringify({ id: p.id, name: p.name, price: p.price })}'>🛒 Añadir al carrito</button>
      </div>
    </div>`;
  }).join('');
  bindCartEvents();
  bindQuickView();
  observeNewCards();
}

// ─── Scroll Reveal ───
function observeNewCards() {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
  });
}
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: .1 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));

// ─── Cart State ───
let cart = [];
let appliedCoupon = null;
const TAX_RATE = 0.16;
const SHIPPING_RATES = { standard: 5.99, express: 12.99, free: 0 };
const FREE_SHIPPING_MIN = 50;

function bindCartEvents() {
  document.querySelectorAll('.add-cart').forEach(btn => {
    btn.removeEventListener('click', handleAddCart);
    btn.addEventListener('click', handleAddCart);
  });
}

function handleAddCart(e) {
  e.stopPropagation();
  const data = JSON.parse(this.dataset.product);
  const existing = cart.find(i => i.id === data.id);
  if (existing) { existing.qty++; } else { cart.push({ ...data, qty: 1 }); }
  updateCartBadge();
  showToast('🛒 Añadido al carrito');
}

function updateCartBadge() {
  const total = cart.reduce((a, i) => a + i.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = total;
}

// ─── Cart Modal ───
function openCart() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  appliedCoupon = null;
  document.getElementById('coupon-input').value = '';
  document.getElementById('coupon-msg').textContent = '';
  document.getElementById('cart-discount-row').style.display = 'none';

  if (!cart.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🛒</div><h3>Carrito vacío</h3><p style="font-size:.85rem;margin-top:4px">Agrega productos desde el catálogo</p></div>';
    summary.style.display = 'none';
  } else {
    container.innerHTML = cart.map(i => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <div><strong>${sanitize(i.name)}</strong><br /><span style="font-size:.8rem;color:var(--text-dim)">$${i.price.toFixed(2)} c/u</span></div>
        <div style="display:flex;align-items:center;gap:8px">
          <button onclick="changeQty(${i.id}, -1)" style="background:var(--surface2);border:1px solid var(--border);border-radius:50%;width:30px;height:30px;cursor:pointer;color:var(--text);font-size:1rem">−</button>
          <span style="font-weight:700;min-width:20px;text-align:center">${i.qty}</span>
          <button onclick="changeQty(${i.id}, 1)" style="background:var(--surface2);border:1px solid var(--border);border-radius:50%;width:30px;height:30px;cursor:pointer;color:var(--text);font-size:1rem">+</button>
          <span style="font-weight:800;min-width:60px;text-align:right">$${(i.price * i.qty).toFixed(2)}</span>
          <button onclick="removeFromCart(${i.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:1.1rem">✕</button>
        </div>
      </div>
    `).join('');
    summary.style.display = 'block';
    updateCartTotals();
  }
  document.getElementById('cart-modal').classList.add('show');
}

function closeCart() {
  document.getElementById('cart-modal').classList.remove('show');
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  appliedCoupon = null;
  openCart();
  updateCartBadge();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  appliedCoupon = null;
  openCart();
  updateCartBadge();
}

function calcSubtotal() {
  return cart.reduce((a, i) => a + i.price * i.qty, 0);
}

function updateCartTotals() {
  const subtotal = calcSubtotal();
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.discount || 0;
  }
  const total = Math.max(0, subtotal - discount);
  document.getElementById('cart-subtotal').textContent = '$' + subtotal.toFixed(2);
  const dr = document.getElementById('cart-discount-row');
  if (discount > 0) {
    dr.style.display = 'flex';
    document.getElementById('cart-discount').textContent = '-$' + discount.toFixed(2);
  } else {
    dr.style.display = 'none';
  }
  document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
}

// ─── Coupon ───
async function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim();
  if (!code) return;
  const subtotal = calcSubtotal();
  const result = await validateCoupon(code, subtotal);
  const msg = document.getElementById('coupon-msg');
  if (result.valid) {
    appliedCoupon = result;
    msg.innerHTML = '<span style="color:var(--green)">✅ Cupón aplicado: ' + sanitize(result.code) + ' (−$' + result.discount.toFixed(2) + ')</span>';
    updateCartTotals();
  } else {
    appliedCoupon = null;
    msg.innerHTML = '<span style="color:var(--red)">❌ ' + sanitize(result.msg) + '</span>';
    updateCartTotals();
  }
}

// ─── Checkout ───
function showCheckout() {
  if (!cart.length) { showToast('❌ Carrito vacío', 'error'); return; }
  closeCart();
  document.getElementById('ch-name').value = '';
  document.getElementById('ch-email').value = '';
  document.getElementById('ch-address').value = '';
  document.getElementById('stripe-cardnum').value = '';
  document.getElementById('stripe-exp').value = '';
  document.getElementById('stripe-cvc').value = '';
  document.querySelector('input[name="shipping"][value="standard"]').checked = true;
  document.querySelector('input[name="payment"][value="stripe"]').checked = true;
  togglePaymentMethod();
  updateCheckoutSummary();
  document.getElementById('checkout-modal').classList.add('show');
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('show');
}

function togglePaymentMethod() {
  const method = document.querySelector('input[name="payment"]:checked').value;
  document.getElementById('stripe-fields').style.display = method === 'stripe' ? 'block' : 'none';
  document.getElementById('paypal-fields').style.display = method === 'paypal' ? 'block' : 'none';
  const btn = document.getElementById('pay-btn');
  if (method === 'stripe') {
    btn.className = 'pay-btn stripe';
    btn.querySelector('.btn-text').textContent = '💳 Pagar con Stripe';
  } else {
    btn.className = 'pay-btn paypal';
    btn.querySelector('.btn-text').textContent = '🅿️ Pagar con PayPal';
  }
}

function getShippingCost() {
  const subtotal = calcSubtotal();
  const selected = document.querySelector('input[name="shipping"]:checked');
  if (!selected) return SHIPPING_RATES.standard;
  const value = selected.value;
  if (value === 'free' || subtotal >= FREE_SHIPPING_MIN) return 0;
  return SHIPPING_RATES[value] || SHIPPING_RATES.standard;
}

function updateCheckoutSummary() {
  const subtotal = calcSubtotal();
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.discount || 0;
  }

  const freeOpt = document.getElementById('shipping-free-option');
  if (freeOpt) {
    freeOpt.style.display = subtotal >= FREE_SHIPPING_MIN ? 'flex' : 'none';
    if (subtotal >= FREE_SHIPPING_MIN) {
      document.getElementById('ship-standard-price').textContent = 'GRATIS';
      document.getElementById('ship-express-price').textContent = '$7.00';
    } else {
      document.getElementById('ship-standard-price').textContent = '$5.99';
      document.getElementById('ship-express-price').textContent = '$12.99';
    }
  }

  const shipping = getShippingCost();
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + tax + shipping;

  const summary = document.getElementById('checkout-summary');
  summary.innerHTML = `
    <div class="line"><span>Subtotal (${cart.reduce((a,i)=>a+i.qty,0)} items)</span><span>$${subtotal.toFixed(2)}</span></div>
    ${discount > 0 ? `<div class="line discount"><span>Cupón: ${appliedCoupon.code}</span><span>-$${discount.toFixed(2)}</span></div>` : ''}
    <div class="line ${shipping === 0 ? 'free' : ''}"><span>Envío</span><span>${shipping === 0 ? 'GRATIS' : '$'+shipping.toFixed(2)}</span></div>
    <div class="line"><span>Impuestos (${(TAX_RATE*100).toFixed(0)}%)</span><span>$${tax.toFixed(2)}</span></div>
    <div class="line total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
  `;
}

// ─── Payment Processing ───
async function processPayment() {
  const name = document.getElementById('ch-name').value.trim();
  const email = document.getElementById('ch-email').value.trim();
  const address = document.getElementById('ch-address').value.trim();
  if (!name || !email || !address) { showToast('❌ Completa todos los campos', 'error'); return; }

  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.classList.add('loading');

  // Simulate payment processing
  await new Promise(r => setTimeout(r, 1500));

  btn.disabled = false;
  btn.classList.remove('loading');

  const method = document.querySelector('input[name="payment"]:checked').value;

  if (method === 'stripe') {
    const card = document.getElementById('stripe-cardnum').value.replace(/\s/g, '');
    if (card && card !== '4242424242424242') {
      showToast('❌ Usa la tarjeta de prueba: 4242 4242 4242 4242', 'error');
      return;
    }
  }

  const subtotal = calcSubtotal();
  let discount = 0;
  if (appliedCoupon) {
    const result = await validateCoupon(appliedCoupon.code, subtotal);
    if (result.valid) { discount = result.discount; await useCoupon(result.id); }
  }
  const shipping = getShippingCost();
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + tax + shipping;

  const orderData = {
    items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.qty })),
    customer: { name, email, address },
    payment: method === 'stripe' ? 'Tarjeta (Stripe)' : 'PayPal',
    subtotal, discount, couponCode: appliedCoupon ? appliedCoupon.code : '',
    shipping, tax, total
  };

  const order = await addOrder(orderData);

  cart = [];
  appliedCoupon = null;
  updateCartBadge();
  closeCheckout();

  showConfirmation(order, email);
}

// ─── Confirmation ───
function showConfirmation(order, email) {
  const shortId = order.id.length > 8 ? order.id.slice(0, 8) : String(order.id).padStart(4, '0');
  document.getElementById('confirm-order-num').textContent = '#' + shortId;
  document.getElementById('confirm-details').innerHTML = `
    <div><strong>Email:</strong> ${sanitize(email)}</div>
    <div><strong>Total pagado:</strong> $${order.total.toFixed(2)}</div>
    <div><strong>Método de pago:</strong> ${sanitize(order.payment)}</div>
    <div><strong>Envío:</strong> ${order.shipping > 0 ? '$' + order.shipping.toFixed(2) : 'GRATIS'}</div>
    <div><strong>Dirección:</strong> ${sanitize(order.customer?.address || '')}</div>
  `;
  document.getElementById('confirmation-modal').classList.add('show');
}

function closeConfirmation() {
  document.getElementById('confirmation-modal').classList.remove('show');
}

// ─── FAQ ───
function toggleFaq(btn) {
  const item = btn.parentElement;
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!open) item.classList.add('open');
}

// ─── Quick View ───
function bindQuickView() {
  document.querySelectorAll('.quick-view').forEach(btn => {
    btn.removeEventListener('click', handleQuickView);
    btn.addEventListener('click', handleQuickView);
  });
  document.querySelectorAll('.img-wrap').forEach(wrap => {
    wrap.removeEventListener('click', handleQuickViewWrap);
    wrap.addEventListener('click', handleQuickViewWrap);
  });
}
function handleQuickViewWrap(e) {
  if (e.target.closest('.quick-view') || e.target.closest('.add-cart')) return;
  const card = this.closest('.product-card');
  const id = parseInt(card.dataset.id);
  openQuickView(id);
}
async function openQuickView(id) {
  const products = await getProducts();
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('qv-image').innerHTML = p.image
    ? `<img src="${p.image}" alt="${sanitize(p.name)}" onerror="this.outerHTML='<span style=font-size:5rem>👕</span>'" />`
    : `<span style="font-size:5rem">👕</span>`;
  document.getElementById('qv-tag').innerHTML = p.tagText ? `<span class="tag ${p.tag}">${sanitize(p.tagText)}</span>` : '';
  document.getElementById('qv-name').textContent = p.name;
  document.getElementById('qv-series').textContent = p.series;
  document.getElementById('qv-desc').textContent = p.description;
  document.getElementById('qv-price').textContent = '$' + p.price.toFixed(2);
  document.getElementById('qv-rating').textContent = '⭐ ' + p.rating;
  document.getElementById('qv-add').dataset.product = JSON.stringify({ id: p.id, name: p.name, price: p.price });
  document.getElementById('quickview-modal').classList.add('show');
}
function handleQuickView(e) {
  e.stopPropagation();
  const card = this.closest('.product-card');
  openQuickView(parseInt(card.dataset.id));
}

// ─── Hamburger ───
document.querySelector('.hamburger')?.addEventListener('click', () => {
  alert('🍡 Menú — próximamente: navegación móvil completa');
});

// ─── Nav cart click ───
document.querySelector('.nav-cart')?.addEventListener('click', openCart);

// ─── Toast ───
function showToast(msg, type = 'success') {
  let t = document.getElementById('store-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'store-toast';
    t.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:300;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1rem 1.5rem;font-size:.9rem;font-weight:600;transform:translateY(80px);opacity:0;transition:all .4s cubic-bezier(.22,1,.36,1);pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.borderColor = type === 'success' ? '#34d399' : '#f87171';
  t.style.transform = 'translateY(0)';
  t.style.opacity = '1';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => { t.style.transform = 'translateY(80px)'; t.style.opacity = '0'; }, 2500);
}

// ─── Modal helper ───
function closeModal(id) {
  document.getElementById(id)?.classList.remove('show');
}

// ─── Close checkout on overlay click ───
document.getElementById('checkout-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeCheckout();
});

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => renderProducts());
