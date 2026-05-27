'use strict';

// ── Supabase client ──────────────────────────────────────────────────────────
const _sb = supabase.createClient(
  'https://vhmdwslnqzimehalgopg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobWR3c2xucXppbWVoYWxnb3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzk3MTgsImV4cCI6MjA5NTQ1NTcxOH0.XH6BFWnj3dbxwsSWcUkG8UAp4gQ2NZkljoIGepCo_HE'
);

const Store = (() => {

  // ── Converters DB ↔ App ────────────────────────────────────────────────────
  function fromDB(row) {
    return {
      id: row.id,
      name: row.name,
      color: row.color || '',
      brand: row.brand,
      subcategory: row.subcategory,
      images: row.images || [],
      pricePerPair: Number(row.price_per_pair),
      pairsPerCurve: row.pairs_per_curve,
      sizeRanges: row.size_ranges || [],
      mixSizes: row.mix_sizes,
      deliveryDays: row.delivery_days || '',
      status: row.status,
      featured: row.featured,
      isNew: row.is_new,
      notes: row.notes || '',
      createdAt: new Date(row.created_at).getTime(),
    };
  }

  function toDB(data) {
    return {
      name: data.name,
      color: data.color || '',
      brand: data.brand,
      subcategory: data.subcategory,
      images: data.images || [],
      price_per_pair: data.pricePerPair,
      pairs_per_curve: data.pairsPerCurve,
      size_ranges: data.sizeRanges || [],
      mix_sizes: data.mixSizes,
      delivery_days: data.deliveryDays,
      status: data.status,
      featured: data.featured,
      is_new: data.isNew,
      notes: data.notes || '',
    };
  }

  // ── Products (Supabase) ────────────────────────────────────────────────────
  async function getProducts() {
    const { data, error } = await _sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getProducts:', error.message); return []; }
    return (data || []).map(fromDB);
  }

  async function addProduct(data) {
    const id = 'prod_' + Date.now();
    const { data: row, error } = await _sb
      .from('products')
      .insert({ id, ...toDB(data) })
      .select().single();
    if (error) { console.error('addProduct:', error.message); return null; }
    return fromDB(row);
  }

  async function updateProduct(id, data) {
    const { data: row, error } = await _sb
      .from('products')
      .update(toDB(data))
      .eq('id', id)
      .select().single();
    if (error) { console.error('updateProduct:', error.message); return null; }
    return fromDB(row);
  }

  async function deleteProduct(id) {
    const { error } = await _sb.from('products').delete().eq('id', id);
    if (error) { console.error('deleteProduct:', error.message); }
    removeFromCart(id);
  }

  // ── Config (localStorage) ──────────────────────────────────────────────────
  const CFG_KEY = 'cm_config';
  const DEFAULT_CONFIG = {
    whatsappNumber: '5492645269125',
    businessName: 'Choice Mayorista',
    adminPassword: 'choice2024',
    tagline: 'Curvas de zapatillas directo de fábrica · Precios mayoristas',
  };
  function _parse(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
  function getConfig() { return { ...DEFAULT_CONFIG, ..._parse(CFG_KEY, {}) }; }
  function saveConfig(cfg) { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }

  // ── Cart (localStorage) ────────────────────────────────────────────────────
  const CART_KEY = 'cm_cart';
  function getCart() { return _parse(CART_KEY, []); }
  function _saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  function addToCart(productId, curves = 1) {
    const cart = getCart();
    const ex = cart.find(i => i.productId === productId);
    if (ex) { ex.curves = Math.max(1, ex.curves + curves); } else { cart.push({ productId, curves: Math.max(1, curves) }); }
    _saveCart(cart); return getCart();
  }
  function updateCartQty(productId, curves) {
    if (curves <= 0) return removeFromCart(productId);
    const cart = getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) { item.curves = curves; _saveCart(cart); }
    return getCart();
  }
  function removeFromCart(productId) { _saveCart(getCart().filter(i => i.productId !== productId)); return getCart(); }
  function clearCart() { _saveCart([]); }

  // ── Image URL converter ────────────────────────────────────────────────────
  function convertImageUrl(url) {
    if (!url) return url;
    const m1 = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
    if (m1) return `https://lh3.googleusercontent.com/d/${m1[1]}`;
    const m2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (m2) return `https://lh3.googleusercontent.com/d/${m2[1]}`;
    const m3 = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
    if (m3) return `https://lh3.googleusercontent.com/d/${m3[1]}`;
    return url;
  }

  return {
    getProducts, addProduct, updateProduct, deleteProduct,
    getConfig, saveConfig,
    getCart, addToCart, updateCartQty, removeFromCart, clearCart,
    convertImageUrl,
  };
})();
