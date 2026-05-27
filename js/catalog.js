'use strict';

const Catalog = (() => {
  let state = { brand: 'all', sub: 'all', sort: 'newest', search: '', products: [], carousels: {} };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const fmt = n => '$' + Number(n).toLocaleString('es-AR');
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function formatDescription(p) {
    const rows = [];
    rows.push(`<div class="desc-row price-row"><span class="di">💲</span><span><strong>${fmt(p.pricePerPair)}</strong> por par (caja)</span></div>`);
    (p.sizeRanges || []).forEach(r => {
      rows.push(`<div class="desc-row"><span class="di">▪️</span><span>Talles disponibles: (${esc(r)})</span></div>`);
    });
    rows.push(`<div class="desc-row"><span class="di">▪️</span><span>Paquete de ${p.pairsPerCurve} pares</span></div>`);
    if (!p.mixSizes) {
      rows.push(`<div class="desc-warning"><span class="di">⛔</span><span>No se permite mezclar talles para este modelo.</span></div>`);
    }
    const statusTxt = p.status === 'in_stock'
      ? 'Producto disponible en stock.'
      : `Producto disponible solo bajo pedido. Entrega en ${esc(p.deliveryDays)} días.`;
    rows.push(`<div class="desc-info"><span class="di">✅</span><span>${statusTxt}</span></div>`);
    if (p.notes && p.notes.trim()) {
      rows.push(`<div class="desc-notes">${esc(p.notes)}</div>`);
    }
    return rows.join('');
  }

  function carouselHTML(p) {
    if (!p.images || p.images.length === 0) {
      return `<div class="carousel-placeholder"><span class="ph-icon">👟</span><span class="ph-brand">${esc(p.brand)}</span></div>`;
    }
    const imgs = p.images.map((src, i) => {
      const url = Store.convertImageUrl(src);
      return `<img src="${esc(url)}" alt="${esc(p.name)}" class="c-img${i === 0 ? ' active' : ''}" data-idx="${i}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'carousel-placeholder\\'><span class=\\'ph-icon\\'>👟</span><span class=\\'ph-brand\\'>${esc(p.brand)}</span></div>'">`
    }).join('');
    const arrows = p.images.length > 1 ? `
      <button class="c-prev" aria-label="Anterior">&#8249;</button>
      <button class="c-next" aria-label="Siguiente">&#8250;</button>
      <div class="c-dots">${p.images.map((_,i) => `<span class="dot${i===0?' active':''}" data-idx="${i}"></span>`).join('')}</div>
      <span class="c-counter">1/${p.images.length}</span>` : '';
    return `<div class="carousel" data-id="${p.id}">${imgs}${arrows}</div>`;
  }

  function cardHTML(p) {
    const curveTotal = p.pricePerPair * p.pairsPerCurve;
    const inCart = Store.getCart().find(i => i.productId === p.id);
    const cartQty = inCart ? inCart.curves : 0;

    return `
    <article class="product-card${p.featured ? ' featured' : ''}" data-id="${p.id}">
      <div class="card-img-wrap">
        ${carouselHTML(p)}
        <div class="card-badges">
          <span class="badge badge-brand">${esc(p.brand)}</span>
          <span class="badge badge-sub ${p.subcategory === 'Urbana' ? 'u' : 'd'}">${esc(p.subcategory)}</span>
          ${p.isNew ? '<span class="badge badge-new">Nuevo</span>' : ''}
          ${p.status === 'in_stock' ? '<span class="badge badge-stock">En stock</span>' : ''}
        </div>
        <button class="share-btn" data-id="${p.id}" title="Compartir por WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.11 1.525 5.837L0 24l6.335-1.513A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.964-1.347l-.357-.212-3.757.897.941-3.657-.232-.374A9.818 9.818 0 1112 21.818z"/></svg>
        </button>
      </div>

      <div class="card-body">
        <h3 class="card-title">${esc(p.name)}</h3>

        <div class="card-pricing">
          <div class="price-row-main">
            <span class="price-big">${fmt(p.pricePerPair)}</span>
            <span class="price-unit"> / par</span>
          </div>
          <div class="curve-row">
            <span class="pairs-label">${p.pairsPerCurve} pares · curva</span>
            <span class="curve-total">Total: <strong>${fmt(curveTotal)}</strong></span>
          </div>
        </div>

        <div class="card-sizes">
          ${(p.sizeRanges || []).map(r => `<span class="size-pill">Talles ${esc(r)}</span>`).join('')}
        </div>

        <button class="desc-toggle" data-id="${p.id}">Ver descripción <svg viewBox="0 0 10 6" width="10"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg></button>
        <div class="desc-body" id="desc-${p.id}" hidden>
          ${formatDescription(p)}
        </div>

        <div class="card-order">
          <div class="stepper">
            <button class="step-btn minus" data-id="${p.id}">−</button>
            <span class="step-val" data-id="${p.id}" id="qty-${p.id}">1</span>
            <button class="step-btn plus" data-id="${p.id}">+</button>
            <span class="step-label">curva(s)</span>
          </div>
          <button class="btn-add${cartQty > 0 ? ' in-cart' : ''}" data-id="${p.id}">
            ${cartQty > 0 ? `✓ En pedido (${cartQty})` : '+ Agregar al pedido'}
          </button>
        </div>
      </div>
    </article>`;
  }

  // ── Carousel logic ───────────────────────────────────────────────────────────
  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(car => {
      const id = car.dataset.id;
      state.carousels[id] = 0;
      initCarouselEvents(car, id);
    });
  }

  function initCarouselEvents(car, id) {
    const imgs = car.querySelectorAll('.c-img');
    const dots = car.querySelectorAll('.dot');
    const counter = car.querySelector('.c-counter');
    if (imgs.length <= 1) return;

    function go(idx) {
      const total = imgs.length;
      idx = (idx + total) % total;
      state.carousels[id] = idx;
      imgs.forEach((img, i) => img.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      if (counter) counter.textContent = `${idx + 1}/${total}`;
    }

    car.querySelector('.c-prev')?.addEventListener('click', e => { e.stopPropagation(); go(state.carousels[id] - 1); });
    car.querySelector('.c-next')?.addEventListener('click', e => { e.stopPropagation(); go(state.carousels[id] + 1); });
    dots.forEach(d => d.addEventListener('click', e => { e.stopPropagation(); go(+d.dataset.idx); }));

    // Touch swipe
    let startX = 0;
    car.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(state.carousels[id] + (dx < 0 ? 1 : -1));
    });
  }

  // ── Filter & render ──────────────────────────────────────────────────────────
  function getFiltered() {
    let products = Store.getProducts();
    const q = state.search.toLowerCase().trim();

    if (q) products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.notes || '').toLowerCase().includes(q)
    );
    if (state.brand !== 'all') products = products.filter(p => p.brand === state.brand);
    if (state.sub !== 'all') products = products.filter(p => p.subcategory === state.sub);

    switch (state.sort) {
      case 'price-asc': products.sort((a, b) => a.pricePerPair - b.pricePerPair); break;
      case 'price-desc': products.sort((a, b) => b.pricePerPair - a.pricePerPair); break;
      case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'featured': products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
      default: products.sort((a, b) => b.createdAt - a.createdAt);
    }
    return products;
  }

  function renderProducts() {
    const grid = $('productsGrid');
    const empty = $('emptyState');
    const info = $('resultsInfo');
    const products = getFiltered();
    state.products = products;

    if (products.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      info.textContent = '';
    } else {
      empty.hidden = true;
      const total = Store.getProducts().length;
      info.textContent = products.length < total
        ? `${products.length} de ${total} productos`
        : `${total} producto${total !== 1 ? 's' : ''}`;
      grid.innerHTML = products.map(cardHTML).join('');
      initCarousels();
      bindCardEvents();
    }
  }

  // ── Card events ──────────────────────────────────────────────────────────────
  function bindCardEvents() {
    // Description toggle
    document.querySelectorAll('.desc-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = document.getElementById('desc-' + btn.dataset.id);
        const open = !body.hidden;
        body.hidden = open;
        btn.classList.toggle('open', !open);
      });
    });

    // Stepper
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const valEl = document.getElementById('qty-' + id);
        let val = parseInt(valEl.textContent);
        val = btn.classList.contains('plus') ? val + 1 : Math.max(1, val - 1);
        valEl.textContent = val;
      });
    });

    // Add to order
    document.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const qty = parseInt(document.getElementById('qty-' + id).textContent);
        Store.addToCart(id, qty);
        btn.classList.add('in-cart');
        const cartItem = Store.getCart().find(i => i.productId === id);
        btn.textContent = `✓ En pedido (${cartItem.curves})`;
        updateCartUI();
        pulseCartBtn();
      });
    });

    // Share
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const p = Store.getProducts().find(x => x.id === btn.dataset.id);
        if (!p) return;
        const msg = `👟 *${p.name}* (${p.brand} · ${p.subcategory})\n💲 ${fmt(p.pricePerPair)} por par\n📦 Curva de ${p.pairsPerCurve} pares · Total: ${fmt(p.pricePerPair * p.pairsPerCurve)}\n\n📎 Talles: ${(p.sizeRanges || []).join(' | ')}\n\n_Desde el catálogo de ${Store.getConfig().businessName}_`;
        const cfg = Store.getConfig();
        window.open(`https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      });
    });
  }

  // ── Cart UI ──────────────────────────────────────────────────────────────────
  function updateCartUI() {
    const cart = Store.getCart();
    const products = Store.getProducts();
    const count = cart.reduce((s, i) => s + i.curves, 0);
    $('cartCount').textContent = count;
    $('cartCount').hidden = count === 0;

    const items = $('cartItems');
    if (cart.length === 0) {
      items.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
      $('cartTotal').textContent = fmt(0);
      $('sendOrderBtn').disabled = true;
      return;
    }
    $('sendOrderBtn').disabled = false;

    let total = 0;
    items.innerHTML = cart.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) return '';
      const sub = p.pricePerPair * p.pairsPerCurve * item.curves;
      total += sub;
      const thumb = p.images && p.images[0]
        ? `<img src="${esc(Store.convertImageUrl(p.images[0]))}" alt="${esc(p.name)}" class="cart-thumb">`
        : `<div class="cart-thumb-ph">👟</div>`;
      return `
        <div class="cart-item" data-id="${p.id}">
          ${thumb}
          <div class="ci-info">
            <span class="ci-name">${esc(p.name)}</span>
            <span class="ci-brand">${esc(p.brand)} · ${esc(p.subcategory)}</span>
            <span class="ci-detail">${item.curves} curva${item.curves > 1 ? 's' : ''} · ${item.curves * p.pairsPerCurve} pares</span>
            <span class="ci-sub">${fmt(sub)}</span>
          </div>
          <div class="ci-controls">
            <button class="ci-minus" data-id="${p.id}">−</button>
            <span class="ci-qty">${item.curves}</span>
            <button class="ci-plus" data-id="${p.id}">+</button>
            <button class="ci-remove" data-id="${p.id}" title="Eliminar">✕</button>
          </div>
        </div>`;
    }).join('');
    $('cartTotal').textContent = fmt(total);

    items.querySelectorAll('.ci-minus').forEach(b => b.addEventListener('click', () => {
      const item = Store.getCart().find(i => i.productId === b.dataset.id);
      Store.updateCartQty(b.dataset.id, item ? item.curves - 1 : 0);
      updateCartUI();
      refreshAddBtns();
    }));
    items.querySelectorAll('.ci-plus').forEach(b => b.addEventListener('click', () => {
      const item = Store.getCart().find(i => i.productId === b.dataset.id);
      Store.updateCartQty(b.dataset.id, item ? item.curves + 1 : 1);
      updateCartUI();
      refreshAddBtns();
    }));
    items.querySelectorAll('.ci-remove').forEach(b => b.addEventListener('click', () => {
      Store.removeFromCart(b.dataset.id);
      updateCartUI();
      refreshAddBtns();
    }));
  }

  function refreshAddBtns() {
    const cart = Store.getCart();
    document.querySelectorAll('.btn-add').forEach(btn => {
      const id = btn.dataset.id;
      const item = cart.find(i => i.productId === id);
      if (item) {
        btn.classList.add('in-cart');
        btn.textContent = `✓ En pedido (${item.curves})`;
      } else {
        btn.classList.remove('in-cart');
        btn.textContent = '+ Agregar al pedido';
      }
    });
  }

  function pulseCartBtn() {
    const btn = $('cartBtn');
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 600);
  }

  // ── WhatsApp order ───────────────────────────────────────────────────────────
  function sendWhatsAppOrder(name, phone, notes) {
    const cart = Store.getCart();
    const products = Store.getProducts();
    const cfg = Store.getConfig();

    const lines = cart.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) return '';
      const curveTotal = p.pricePerPair * p.pairsPerCurve * item.curves;
      const sizes = (p.sizeRanges || []).join(' / ');
      const colorOrImg = p.color
        ? p.color
        : (p.images && p.images[0] ? p.images[0] : '—');
      const qty = item.curves > 1 ? ` x${item.curves}` : '';
      return `• ${p.name}${qty} | ${colorOrImg} | Talles: ${sizes} | ${fmt(p.pricePerPair)} por par | Total: ${fmt(curveTotal)}`;
    }).filter(Boolean);

    const parts = ['Hola buenas, quiero realizar un pedido de estas curvas', '', ...lines];
    if (name) parts.push('', `Nombre: ${name}`);
    if (phone) parts.push(`Teléfono: ${phone}`);
    if (notes) parts.push(`Nota: ${notes}`);

    const msg = parts.join('\n');

    window.open(`https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    Store.clearCart();
    updateCartUI();
    refreshAddBtns();
    closeCart();
  }

  // ── Cart drawer ──────────────────────────────────────────────────────────────
  function openCart() { $('cartSidebar').classList.add('open'); $('cartOverlay').classList.add('visible'); }
  function closeCart() { $('cartSidebar').classList.remove('open'); $('cartOverlay').classList.remove('visible'); }

  // ── Order modal ──────────────────────────────────────────────────────────────
  function openOrderModal() {
    $('orderModal').style.display = 'flex';
    $('customerName').focus();
  }
  function closeOrderModal() { $('orderModal').style.display = 'none'; }

  // ── WhatsApp config ──────────────────────────────────────────────────────────
  function setupWhatsAppLinks() {
    const cfg = Store.getConfig();
    const url = `https://wa.me/${cfg.whatsappNumber}`;
    document.querySelectorAll('[data-wa]').forEach(el => el.href = url);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    setupWhatsAppLinks();
    renderProducts();
    updateCartUI();

    // Search
    const searchInput = $('searchInput');
    const clearBtn = $('clearSearch');
    searchInput.addEventListener('input', () => {
      state.search = searchInput.value;
      clearBtn.hidden = !state.search;
      renderProducts();
    });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.search = '';
      clearBtn.hidden = true;
      renderProducts();
      searchInput.focus();
    });

    // Brand filters
    document.querySelectorAll('[data-brand]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-brand]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.brand = btn.dataset.brand;
        renderProducts();
      });
    });

    // Subcategory filters
    document.querySelectorAll('[data-sub]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-sub]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.sub = btn.dataset.sub;
        renderProducts();
      });
    });

    // Sort
    $('sortSelect').addEventListener('change', e => {
      state.sort = e.target.value;
      renderProducts();
    });

    // Cart
    $('cartBtn').addEventListener('click', openCart);
    $('cartOverlay').addEventListener('click', closeCart);
    $('closeCart').addEventListener('click', closeCart);
    $('sendOrderBtn').addEventListener('click', () => {
      closeCart();
      openOrderModal();
    });

    // Order modal
    $('cancelOrder').addEventListener('click', closeOrderModal);
    $('orderModal').addEventListener('click', e => { if (e.target === $('orderModal')) closeOrderModal(); });
    $('confirmOrder').addEventListener('click', () => {
      const name = $('customerName').value.trim();
      if (!name) { $('customerName').classList.add('error'); $('customerName').focus(); return; }
      $('customerName').classList.remove('error');
      sendWhatsAppOrder(name, $('customerPhone').value.trim(), $('orderNotes').value.trim());
      closeOrderModal();
      $('customerName').value = '';
      $('customerPhone').value = '';
      $('orderNotes').value = '';
    });
    $('customerName').addEventListener('input', () => $('customerName').classList.remove('error'));

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeCart(); closeOrderModal(); }
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Catalog.init);
