'use strict';

const Admin = (() => {
  const $ = id => document.getElementById(id);
  const SESSION_KEY = 'cm_admin_session';
  let editingId = null;
  let imageCount = 0;

  // ── Auth ─────────────────────────────────────────────────────────────────────
  function checkAuth() {
    if (sessionStorage.getItem(SESSION_KEY) === 'ok') {
      showPanel();
    } else {
      $('loginScreen').hidden = false;
      $('adminPanel').hidden = true;
    }
  }

  function login(password) {
    const cfg = Store.getConfig();
    if (password === cfg.adminPassword) {
      sessionStorage.setItem(SESSION_KEY, 'ok');
      showPanel();
    } else {
      $('loginError').hidden = false;
      $('loginPassword').value = '';
      $('loginPassword').focus();
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  function showPanel() {
    $('loginScreen').hidden = true;
    $('adminPanel').hidden = false;
    renderProductList();
    loadConfig();
  }

  // ── Product list ─────────────────────────────────────────────────────────────
  const fmt = n => '$' + Number(n).toLocaleString('es-AR');
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function renderProductList(filter = '') {
    let products = Store.getProducts();
    if (filter) {
      const q = filter.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }
    const list = $('productList');
    if (products.length === 0) {
      list.innerHTML = '<p class="admin-empty">No hay productos. Agregá el primero.</p>';
      return;
    }
    list.innerHTML = products.map(p => {
      const thumb = p.images && p.images[0]
        ? `<img src="${esc(Store.convertImageUrl(p.images[0]))}" class="admin-thumb" alt="${esc(p.name)}">`
        : `<div class="admin-thumb-ph">👟</div>`;
      return `
        <div class="admin-product-row" data-id="${p.id}">
          ${thumb}
          <div class="apr-info">
            <span class="apr-name">${esc(p.name)}</span>
            <span class="apr-meta">${esc(p.brand)} · ${esc(p.subcategory)}</span>
            <span class="apr-price">${fmt(p.pricePerPair)}/par · ${p.pairsPerCurve} pares · ${fmt(p.pricePerPair * p.pairsPerCurve)}/curva</span>
          </div>
          <div class="apr-badges">
            ${p.featured ? '<span class="ab featured">Destacado</span>' : ''}
            ${p.isNew ? '<span class="ab new-b">Nuevo</span>' : ''}
            <span class="ab ${p.status === 'in_stock' ? 'stock' : 'demand'}">${p.status === 'in_stock' ? 'En stock' : 'Bajo pedido'}</span>
          </div>
          <div class="apr-actions">
            <button class="btn-edit" data-id="${p.id}">Editar</button>
            <button class="btn-delete" data-id="${p.id}">Eliminar</button>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => openForm(btn.dataset.id)));
    list.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  function confirmDelete(id) {
    const p = Store.getProducts().find(x => x.id === id);
    if (!p) return;
    if (confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) {
      Store.deleteProduct(id);
      renderProductList();
    }
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  function openForm(id = null) {
    editingId = id;
    imageCount = 0;
    $('formTitle').textContent = id ? 'Editar producto' : 'Nuevo producto';
    $('productForm').reset();
    $('imagesContainer').innerHTML = '';

    if (id) {
      const p = Store.getProducts().find(x => x.id === id);
      if (!p) return;
      $('fName').value = p.name;
      $('fColor').value = p.color || '';
      $('fBrand').value = p.brand;
      $('fSub').value = p.subcategory;
      $('fPrice').value = p.pricePerPair;
      $('fPairs').value = p.pairsPerCurve;
      $('fDelivery').value = p.deliveryDays;
      $('fStatus').value = p.status;
      $('fMix').checked = p.mixSizes;
      $('fFeatured').checked = p.featured;
      $('fNew').checked = p.isNew;
      $('fNotes').value = p.notes || '';

      // Size ranges
      $('sizeRangesList').innerHTML = '';
      (p.sizeRanges || []).forEach(r => addSizeRange(r));

      // Images
      (p.images || []).forEach(url => addImageInput(url));
    } else {
      addSizeRange('');
      addImageInput('');
    }

    $('formModal').hidden = false;
    $('fName').focus();
  }

  function closeForm() {
    $('formModal').hidden = true;
    editingId = null;
  }

  function addSizeRange(value = '') {
    const wrap = document.createElement('div');
    wrap.className = 'size-input-row';
    wrap.innerHTML = `
      <input type="text" class="size-range-input" placeholder="ej: 34 a 39" value="${esc(value)}">
      <button type="button" class="remove-size" title="Quitar">✕</button>`;
    wrap.querySelector('.remove-size').addEventListener('click', () => wrap.remove());
    $('sizeRangesList').appendChild(wrap);
  }

  function addImageInput(value = '') {
    if (imageCount >= 6) { alert('Máximo 6 imágenes por producto.'); return; }
    imageCount++;
    const idx = imageCount;
    const wrap = document.createElement('div');
    wrap.className = 'img-input-row';
    const previewUrl = Store.convertImageUrl(value);
    wrap.innerHTML = `
      <span class="img-num">${idx}</span>
      <input type="url" class="img-url-input" placeholder="https://url-de-la-imagen.jpg" value="${esc(value)}">
      <div class="img-preview-wrap">
        ${previewUrl ? `<img class="img-preview" src="${esc(previewUrl)}" alt="">` : '<div class="img-preview-empty">Vista previa</div>'}
      </div>
      <button type="button" class="remove-img" title="Quitar">✕</button>`;
    const input = wrap.querySelector('.img-url-input');
    const preview = wrap.querySelector('.img-preview-wrap');
    input.addEventListener('input', () => {
      const url = Store.convertImageUrl(input.value.trim());
      preview.innerHTML = url
        ? `<img class="img-preview" src="${url}" alt="" onerror="this.parentElement.innerHTML='<div class=\\'img-preview-empty\\'>URL inválida</div>'">`
        : '<div class="img-preview-empty">Vista previa</div>';
    });
    wrap.querySelector('.remove-img').addEventListener('click', () => { wrap.remove(); imageCount--; });
    $('imagesContainer').appendChild(wrap);
  }

  function saveProduct() {
    const name = $('fName').value.trim();
    const brand = $('fBrand').value;
    const sub = $('fSub').value;
    const price = parseFloat($('fPrice').value);
    const pairs = parseInt($('fPairs').value);
    const delivery = $('fDelivery').value.trim();

    if (!name) { showFormError('El nombre es obligatorio.'); $('fName').focus(); return; }
    if (!price || price <= 0) { showFormError('El precio por par debe ser mayor a 0.'); $('fPrice').focus(); return; }
    if (!pairs || pairs <= 0) { showFormError('La cantidad de pares debe ser mayor a 0.'); $('fPairs').focus(); return; }

    const sizeRanges = [...$('sizeRangesList').querySelectorAll('.size-range-input')]
      .map(i => i.value.trim()).filter(Boolean);
    const images = [...$('imagesContainer').querySelectorAll('.img-url-input')]
      .map(i => i.value.trim()).filter(Boolean);

    const color = $('fColor').value.trim();
    const data = {
      name, color, brand, subcategory: sub,
      images, pricePerPair: price, pairsPerCurve: pairs,
      sizeRanges, mixSizes: $('fMix').checked,
      deliveryDays: delivery, status: $('fStatus').value,
      featured: $('fFeatured').checked, isNew: $('fNew').checked,
      notes: $('fNotes').value.trim(),
    };

    if (editingId) {
      Store.updateProduct(editingId, data);
    } else {
      Store.addProduct(data);
    }
    closeForm();
    renderProductList();
    showToast(editingId ? 'Producto actualizado correctamente.' : 'Producto agregado correctamente.');
  }

  function showFormError(msg) {
    const el = $('formError');
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
  }

  // ── Config ───────────────────────────────────────────────────────────────────
  function loadConfig() {
    const cfg = Store.getConfig();
    $('cfgWhatsapp').value = cfg.whatsappNumber;
    $('cfgTagline').value = cfg.tagline;
    $('cfgPassword').value = '';
  }

  function saveConfigForm() {
    const cfg = Store.getConfig();
    const wa = $('cfgWhatsapp').value.trim().replace(/\D/g, '');
    if (!wa) { showToast('Ingresá un número de WhatsApp válido.', 'error'); return; }
    const newPwd = $('cfgPassword').value.trim();
    const updated = {
      ...cfg,
      whatsappNumber: wa,
      tagline: $('cfgTagline').value.trim(),
      ...(newPwd ? { adminPassword: newPwd } : {}),
    };
    Store.saveConfig(updated);
    showToast('Configuración guardada correctamente.');
    $('cfgPassword').value = '';
  }

  // ── Toast ────────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    const t = $('toast');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    checkAuth();

    $('loginForm').addEventListener('submit', e => {
      e.preventDefault();
      login($('loginPassword').value);
    });

    $('logoutBtn').addEventListener('click', logout);

    $('addProductBtn').addEventListener('click', () => openForm());
    $('closeForm').addEventListener('click', closeForm);
    $('cancelForm').addEventListener('click', closeForm);
    $('formModal').addEventListener('click', e => { if (e.target === $('formModal')) closeForm(); });
    $('saveProduct').addEventListener('click', saveProduct);

    $('addSizeBtn').addEventListener('click', () => addSizeRange(''));
    $('addImageBtn').addEventListener('click', () => addImageInput(''));

    $('adminSearch').addEventListener('input', e => renderProductList(e.target.value));

    $('cfgSaveBtn').addEventListener('click', saveConfigForm);

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeForm(); });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.hidden = true);
        btn.classList.add('active');
        $(btn.dataset.tab).hidden = false;
      });
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
