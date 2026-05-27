'use strict';

const Store = (() => {
  const KEYS = { products: 'cm_products', config: 'cm_config', cart: 'cm_cart' };

  const DEFAULT_CONFIG = {
    whatsappNumber: '5492645269125',
    businessName: 'Choice Mayorista',
    adminPassword: 'choice2024',
    tagline: 'Curvas de zapatillas directo de fábrica · Precios mayoristas',
  };

  const SAMPLE_PRODUCTS = [
    {
      id: 'sample_001', name: 'Air Force 1', brand: 'Nike', subcategory: 'Urbana',
      images: [], pricePerPair: 18000, pairsPerCurve: 12,
      sizeRanges: ['34 a 39', '38 a 43'], mixSizes: false,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: true, isNew: false, notes: '', createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'sample_002', name: 'Campus 00s', brand: 'Adidas', subcategory: 'Urbana',
      images: [], pricePerPair: 20000, pairsPerCurve: 12,
      sizeRanges: ['36 a 40'], mixSizes: false,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: false, isNew: true, notes: '', createdAt: Date.now() - 86400000,
    },
    {
      id: 'sample_003', name: 'Samba OG', brand: 'Adidas', subcategory: 'Urbana',
      images: [], pricePerPair: 22000, pairsPerCurve: 15,
      sizeRanges: ['36 a 41'], mixSizes: false,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: true, isNew: true, notes: '', createdAt: Date.now(),
    },
    {
      id: 'sample_004', name: '574 Classic', brand: 'New Balance', subcategory: 'Deportiva',
      images: [], pricePerPair: 24000, pairsPerCurve: 12,
      sizeRanges: ['38 a 44'], mixSizes: true,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: false, isNew: false, notes: '', createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'sample_005', name: 'Suede Classic', brand: 'Puma', subcategory: 'Urbana',
      images: [], pricePerPair: 16000, pairsPerCurve: 12,
      sizeRanges: ['36 a 42'], mixSizes: false,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: false, isNew: false, notes: '', createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'sample_006', name: 'RS-X', brand: 'Puma', subcategory: 'Deportiva',
      images: [], pricePerPair: 19000, pairsPerCurve: 12,
      sizeRanges: ['37 a 43'], mixSizes: true,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: false, isNew: false, notes: '', createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'sample_007', name: 'Fresh Foam X 1080', brand: 'New Balance', subcategory: 'Deportiva',
      images: [], pricePerPair: 28000, pairsPerCurve: 12,
      sizeRanges: ['38 a 44'], mixSizes: true,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: true, isNew: true, notes: '', createdAt: Date.now() - 86400000,
    },
    {
      id: 'sample_008', name: 'Revolution 7', brand: 'Nike', subcategory: 'Deportiva',
      images: [], pricePerPair: 21000, pairsPerCurve: 12,
      sizeRanges: ['36 a 44'], mixSizes: true,
      deliveryDays: '10 a 15', status: 'on_demand',
      featured: false, isNew: false, notes: '', createdAt: Date.now() - 86400000 * 6,
    },
  ];

  function _parse(key, fallback) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
    catch { return fallback; }
  }

  // Products
  function getProducts() {
    const stored = localStorage.getItem(KEYS.products);
    if (!stored) { localStorage.setItem(KEYS.products, JSON.stringify(SAMPLE_PRODUCTS)); return SAMPLE_PRODUCTS; }
    return _parse(KEYS.products, []);
  }
  function _saveProducts(p) { localStorage.setItem(KEYS.products, JSON.stringify(p)); }
  function addProduct(data) {
    const products = getProducts();
    const product = { ...data, id: 'prod_' + Date.now(), createdAt: Date.now() };
    products.unshift(product);
    _saveProducts(products);
    return product;
  }
  function updateProduct(id, data) {
    const products = getProducts();
    const i = products.findIndex(p => p.id === id);
    if (i === -1) return null;
    products[i] = { ...products[i], ...data };
    _saveProducts(products);
    return products[i];
  }
  function deleteProduct(id) {
    _saveProducts(getProducts().filter(p => p.id !== id));
    removeFromCart(id);
  }

  // Config
  function getConfig() { return { ...DEFAULT_CONFIG, ..._parse(KEYS.config, {}) }; }
  function saveConfig(cfg) { localStorage.setItem(KEYS.config, JSON.stringify(cfg)); }

  // Cart
  function getCart() { return _parse(KEYS.cart, []); }
  function _saveCart(c) { localStorage.setItem(KEYS.cart, JSON.stringify(c)); }
  function addToCart(productId, curves = 1) {
    const cart = getCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) { existing.curves = Math.max(1, existing.curves + curves); }
    else { cart.push({ productId, curves: Math.max(1, curves) }); }
    _saveCart(cart);
    return getCart();
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

  // Converts Google Drive sharing URLs to direct image URLs
  function convertImageUrl(url) {
    if (!url) return url;
    // https://drive.google.com/file/d/FILE_ID/view?...
    const m1 = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
    if (m1) return `https://lh3.googleusercontent.com/d/${m1[1]}`;
    // https://drive.google.com/open?id=FILE_ID
    const m2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (m2) return `https://lh3.googleusercontent.com/d/${m2[1]}`;
    // https://drive.google.com/uc?id=FILE_ID
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
