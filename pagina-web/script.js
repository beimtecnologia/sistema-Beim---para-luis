const STORAGE_KEY = "beim_session_state_v1";
const CART_STORAGE_KEY = "beim_cart_state_v2";
const LEGACY_CART_STORAGE_KEY = "beim_cart_state_v1";
const LEGACY_STORAGE_KEY = "beim_ecommerce_state_v1";
const REMEMBER_KEY = "beim_remembered_login_v1";
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin";
const SUPERADMIN_USER = "administradorprincipal";
const SUPERADMIN_PASSWORD = "principal";
const DEFAULT_CURRENCY = "UYU";
const API_BASE_URL = normalizeApiBaseUrl(window.BEIM_CONFIG?.apiBaseUrl || "");
const GOOGLE_CLIENT_ID = String(window.BEIM_CONFIG?.googleClientId || "").trim();
const FACEBOOK_APP_ID = String(window.BEIM_CONFIG?.facebookAppId || "").trim();
const REQUIRED_ORDER_PROFILE_FIELDS = ["firstName", "lastName", "email", "phone", "department", "locality", "address"];
const REQUIRED_WHOLESALE_ORDER_PROFILE_FIELDS = ["company", "rut", "references"];
const CHECKOUT_PROFILE_FIELDS = {
  firstName: { label: "nombre", inputs: ["checkoutName"] },
  lastName: { label: "apellido", inputs: ["checkoutLastName"] },
  email: { label: "email", inputs: ["checkoutEmail"] },
  phone: { label: "telefono", inputs: ["checkoutPhone"] },
  department: { label: "departamento", inputs: ["checkoutDepartment"] },
  locality: { label: "localidad", inputs: ["checkoutLocality"] },
  address: { label: "direccion", inputs: ["checkoutAddress"] },
  ci: { label: "CI", inputs: ["checkoutCi"] },
  rut: { label: "RUT", inputs: ["checkoutRut"] },
  company: { label: "razon social", inputs: ["checkoutCompany"] },
  references: { label: "referencias comerciales", inputs: ["checkoutReferences"] },
  document: { label: "CI o RUT", inputs: ["checkoutCi", "checkoutRut"] },
};
const ORDERS_SEEN_KEY = "beim_seen_orders_v1";
const API_TIMEOUT_MS = 8000;
const CATALOG_STOCK_POLL_INTERVAL_MS = 5000;
const DEFAULT_PRODUCT_BRANDS = ["Samsung", "iPhone", "Motorola", "Xiaomi", "Honor", "Huawei"];
const PRODUCT_IMAGE_FALLBACKS = {
  AUD: "assets/iphone15-blue.png",
  ACC: "assets/iphone14-midnight.png",
  NB: "assets/iphone16pro-white.png",
  SW: "assets/iphone16-pink.png",
  GM: "assets/iphone15pro-titanium.png",
  CEL: "assets/iphone16pro-black.png",
};
const DEFAULT_PAYMENT_METHODS = [
  {
    id: "tarjetas",
    name: "Tarjetas",
    detail: "Crédito / débito seguro por Stripe",
    instructions: "Pagás con tarjeta en una pantalla segura de Stripe. BEIM no guarda ni recibe los datos de tu tarjeta.",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "brou",
    name: "BROU",
    detail: "Transferencia bancaria",
    instructions: "Realizá la transferencia a la cuenta BROU indicada por administración y enviá el comprobante para confirmar el pago.",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "santander",
    name: "Santander",
    detail: "Transferencia bancaria",
    instructions: "Realizá la transferencia a la cuenta Santander indicada por administración y enviá el comprobante para confirmar el pago.",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "itau",
    name: "Itaú",
    detail: "Transferencia bancaria",
    instructions: "Realizá la transferencia a la cuenta Itaú indicada por administración y enviá el comprobante para confirmar el pago.",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "prex",
    name: "Prex",
    detail: "Billetera / transferencia",
    instructions: "Realizá el pago por Prex con los datos indicados por administración y enviá el comprobante.",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "mi-dinero",
    name: "Mi Dinero",
    detail: "Billetera / transferencia",
    instructions: "Realizá el pago por Mi Dinero con los datos indicados por administración y enviá el comprobante.",
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "transferencia-bancaria",
    name: "Transferencia bancaria",
    detail: "Otra cuenta bancaria",
    instructions: "Realizá la transferencia y luego enviá el comprobante a administración para confirmar el pago.",
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "efectivo-retiro",
    name: "Efectivo / retiro",
    detail: "Pago al retirar o en entrega acordada",
    instructions: "Tu pedido queda reservado y coordinamos retiro o entrega para concretar el pago.",
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "usdt",
    name: "USDT",
    detail: "Cripto con validación manual",
    instructions: "Enviá el pago por la red indicada y compartí el comprobante o hash para verificarlo manualmente.",
    isActive: true,
    sortOrder: 9,
  },
];
const PAYMENT_METHOD_ASSETS = {
  tarjetas: "assets/payment-tarjetas.svg",
  brou: "assets/payment-brou.svg",
  santander: "assets/payment-santander.svg",
  itau: "assets/payment-itau.svg",
  prex: "assets/payment-prex.svg",
  "mi-dinero": "assets/payment-mi-dinero.svg",
  "transferencia-bancaria": "assets/payment-brou.svg",
  "efectivo-retiro": "assets/logo.png",
  usdt: "assets/payment-prex.svg",
};
const PROMO_FRAME_PRESETS = {
  default: { heroMinHeight: 260, heroImageHeight: 280, previewHeight: 180, editorHeight: 230, frameWidth: 420 },
  large: { heroMinHeight: 310, heroImageHeight: 330, previewHeight: 220, editorHeight: 270, frameWidth: 500 },
  xlarge: { heroMinHeight: 360, heroImageHeight: 380, previewHeight: 250, editorHeight: 310, frameWidth: 580 },
};
const currencyConfig = {
  UYU: { label: "UYU", symbol: "$", rate: 40 },
  USD: { label: "USD", symbol: "USD ", rate: 1 },
  USDT: { label: "USDT", symbol: "USDT ", rate: 1 },
};

const defaults = {
  currentUser: null,
  settings: {
    whatsapp: "59892514774",
    ordersWhatsapp: "59892514774",
    instagram: "https://www.instagram.com/beim.uy/",
    companyName: "BEIM",
    companyRut: "",
    companyAddress: "",
    companyPhone: "59892514774",
    companyEmail: "",
    heroText: "Celulares, notebooks, audio, repuestos y accesorios con stock real, garantía y atención rápida.",
    productBrands: DEFAULT_PRODUCT_BRANDS,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
  },
  promoSlides: [
    {
      id: "slide-1",
      eyebrow: "Tecnología original",
      title: "Tecnología, repuestos y accesorios con stock real",
      text: "Celulares, notebooks, audio, repuestos y accesorios con garantía, atención rápida y disponibilidad clara.",
      image: "assets/hero-slide1-tech.svg",
      primaryLabel: "Comprar ahora",
      primaryHref: "#catalogo",
      secondaryLabel: "Consultar",
      secondaryHref: "https://wa.me/59892514774?text=Hola!%20Quiero%20armar%20mi%20setup%20tech",
    },
    {
      id: "slide-2",
      eyebrow: "Ofertas de la semana",
      title: "Combos, accesorios y equipos listos para entrega",
      text: "Ofertas, combos y equipos listos para retirar o enviar. Consultá disponibilidad y precio final por WhatsApp.",
      image: "assets/service-repair.png",
      primaryLabel: "Ver destacados",
      primaryHref: "#catalogo",
      secondaryLabel: "WhatsApp",
      secondaryHref: "https://wa.me/59892514774?text=Hola!%20Quiero%20consultar%20por%20las%20ofertas",
    },
    {
      id: "slide-3",
      eyebrow: "Empresas y soporte",
      title: "Equipamiento tech y soporte para empresas",
      text: "Compras por volumen, servicio técnico y asesoramiento para renovar equipos con stock real.",
      image: "assets/iphone16pro-white.png",
      primaryLabel: "Pedir cotización",
      primaryHref: "#empresas",
      secondaryLabel: "Servicio técnico",
      secondaryHref: "#servicios",
    },
  ],
  users: [],
  categories: [
    { id: "celulares", name: "Celulares", code: "CEL", description: "Smartphones nuevos, semi nuevos y accesorios" },
    { id: "notebooks", name: "Notebooks", code: "NB", description: "Equipos para trabajo, estudio y gaming" },
    { id: "audio", name: "Audio", code: "AUD", description: "Auriculares, parlantes y accesorios" },
    { id: "smartwatch", name: "Smartwatch", code: "SW", description: "Relojes inteligentes y bandas" },
    { id: "gaming", name: "Gaming", code: "GM", description: "Consolas, controles y periféricos" },
    { id: "accesorios", name: "Accesorios", code: "ACC", description: "Cargadores, cables, fundas y hubs" },
    { id: "servicio", name: "Servicios", code: "SRV", description: "Diagnóstico, configuración y soporte técnico" },
  ],
  products: [
    { id: "smartphone-premium", name: "Smartphone premium", category: "celulares", brand: "iPhone", model: "16 Pro", price: 35600, currency: "UYU", stock: 8, badge: "Nuevo", image: "assets/iphone16pro-black.png", description: "256GB - 5G - Cámara pro" },
    { id: "notebook-ultraliviana", name: "Notebook ultraliviana", category: "notebooks", brand: "Samsung", model: "Book", price: 30400, currency: "UYU", stock: 3, badge: "Popular", image: "NB", description: "SSD - 16GB RAM - Ideal trabajo" },
    { id: "auriculares-wireless", name: "Auriculares inalámbricos", category: "audio", brand: "Honor", model: "Choice", price: 3800, currency: "UYU", stock: 14, badge: "Oferta", image: "AUD", description: "Bluetooth - Cancelación - Estuche" },
    { id: "reloj-inteligente", name: "Reloj inteligente", category: "smartwatch", brand: "Huawei", model: "Fit", price: 5200, currency: "UYU", stock: 10, badge: "Oferta", image: "SW", description: "Salud - Deporte - Notificaciones" },
    { id: "cargador-rapido", name: "Cargador rápido USB-C", category: "accesorios", brand: "Motorola", model: "Turbo", price: 1120, currency: "UYU", stock: 30, badge: "Nuevo", image: "ACC", description: "20W - Cable compatible - Garantía" },
    { id: "combo-gaming", name: "Combo gaming RGB", category: "gaming", brand: "Xiaomi", model: "Gaming Kit", price: 2720, currency: "UYU", stock: 6, badge: "Popular", image: "GM", description: "Teclado - Mouse - Mousepad" },
  ],
  orders: [],
};

let state = loadState();
let cart = loadCart();
let customerOrders = [];
let activeFilter = "all";
let searchQuery = "";
let catalogPage = 1;
let catalogQuickFilter = "all";
let catalogSort = "featured";
let adminProductSearch = "";
let adminCategorySearch = "";
let adminOrderSearch = "";
let adminOrderView = "orders";
let promoIndex = 0;
let promoTimer = null;
let heroPointerStartX = null;
let heroPaused = false;
let headerCondensed = false;
let selectedCurrency = DEFAULT_CURRENCY;
let promoImageDrag = null;
let promoFrameResize = null;
let ordersPollTimer = null;
let catalogStockPollTimer = null;
let cartStockNoticeProductId = null;
let checkoutPaymentReceipt = null;

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function resetInitialScrollPosition() {
  if (window.location.hash) return;
  window.scrollTo(0, 0);
}

window.addEventListener("load", () => {
  resetInitialScrollPosition();
  window.setTimeout(resetInitialScrollPosition, 80);
  window.setTimeout(resetInitialScrollPosition, 320);
  restoreMainWebCarousel();
});

window.addEventListener("pageshow", () => {
  resetInitialScrollPosition();
  restoreMainWebCarousel();
});
window.addEventListener("focus", restoreMainWebCarousel);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) restoreMainWebCarousel();
});

const els = {
  commerceTop: document.querySelector(".commerce-top"),
  categoryGrid: document.querySelector("#category-grid"),
  productGrid: document.querySelector("#product-grid"),
  catalogPagination: document.querySelector("#catalog-pagination"),
  shopToolbar: document.querySelector("#shop-toolbar"),
  cartDrawer: document.querySelector("#cart-drawer"),
  cartItems: document.querySelector("#cart-items"),
  cartStockNotice: document.querySelector("#cart-stock-notice"),
  cartStockTitle: document.querySelector("#cart-stock-title"),
  cartStockMessage: document.querySelector("#cart-stock-message"),
  cartStockContinue: document.querySelector("#cart-stock-continue"),
  cartStockCancel: document.querySelector("#cart-stock-cancel"),
  cartCount: document.querySelector("#cart-count"),
  cartTotal: document.querySelector("#cart-total"),
  checkoutLink: document.querySelector("#checkout-link"),
  checkoutModal: document.querySelector("#checkout-modal"),
  checkoutItems: document.querySelector("#checkout-items"),
  checkoutSubtotal: document.querySelector("#checkout-subtotal"),
  checkoutTotal: document.querySelector("#checkout-total"),
  checkoutFooterTotal: document.querySelector("#checkout-footer-total"),
  checkoutConfirmation: document.querySelector("#checkout-confirmation"),
  checkoutPaymentMethods: document.querySelector("#checkout-payment-methods"),
  checkoutPaymentNote: document.querySelector("#checkout-payment-note"),
  checkoutPaymentReceipt: document.querySelector("#checkout-payment-receipt"),
  checkoutPaymentReceiptFile: document.querySelector("#checkout-payment-receipt-file"),
  checkoutPaymentReceiptStatus: document.querySelector("#checkout-payment-receipt-status"),
  checkoutProfileSummary: document.querySelector("#checkout-profile-summary"),
  checkoutProfileMissing: document.querySelector("#checkout-profile-missing"),
  ordersFloat: document.querySelector("#orders-float"),
  ordersFloatLabel: document.querySelector("#orders-float-label"),
  ordersFloatCount: document.querySelector("#orders-float-count"),
  accountMenu: document.querySelector("#account-menu"),
  authModal: document.querySelector("#auth-modal"),
  profileModal: document.querySelector("#profile-modal"),
  ordersHistoryModal: document.querySelector("#orders-history-modal"),
  ordersHistoryList: document.querySelector("#orders-history-list"),
  ordersHistoryDetail: document.querySelector("#orders-history-detail"),
  profileForm: document.querySelector("#profile-form"),
  adminPanel: document.querySelector("#admin-panel"),
  adminProductModal: document.querySelector("#admin-product-modal"),
  adminProductModalTitle: document.querySelector("#admin-product-modal-title"),
  productImagePreviewFrame: document.querySelector("#product-image-preview-frame"),
  productForm: document.querySelector("#product-form"),
  categoryForm: document.querySelector("#category-form"),
  promoForm: document.querySelector("#promo-form"),
  settingsForm: document.querySelector("#settings-form"),
  paymentMethodForm: document.querySelector("#payment-method-form"),
  usersTable: document.querySelector("#users-table"),
  paymentMethodsTable: document.querySelector("#payment-methods-table"),
  paymentMethodsSection: document.querySelector("#payment-methods-section"),
  adminPaymentsTab: document.querySelector("#admin-payments-tab"),
  adminProductSearch: document.querySelector("#admin-product-search"),
  adminCategorySearch: document.querySelector("#admin-category-search"),
  addBrandButton: document.querySelector("#add-brand"),
  editBrandButton: document.querySelector("#edit-brand"),
  deleteBrandButton: document.querySelector("#delete-brand"),
  productImageUpload: document.querySelector("#product-image-upload"),
  productSearch: document.querySelector("#product-search"),
  clearSearch: document.querySelector("#clear-search"),
  heroSlides: document.querySelector("#hero-slides"),
  heroDots: document.querySelector("#hero-dots"),
  promoPreview: document.querySelector("#promo-preview"),
  promoPreviewStatus: document.querySelector("#promo-preview-status"),
  promoSlideList: document.querySelector("#promo-slide-list"),
  promoImageStage: document.querySelector("#promo-image-stage"),
  productModal: document.querySelector("#product-modal"),
  productModalBody: document.querySelector("#product-modal-body"),
};

void init();

async function init() {
  resetInitialScrollPosition();
  installUxAlerts();

  await consumeGestionAccess();

  renderHero();
  renderStore();
  renderCart();
  renderSession();
  renderAdmin();
  bindStaticEvents();
  initGoogleAuth();
  initFacebookAuth();
  applySettings();

  await hydrateCatalogFromApi();
  startCatalogStockPolling();
  await refreshCurrentUserFromApi();
  await consolidateDuplicateProductVariants();
  loadActiveCart();
  if (["admin", "superadmin"].includes(state.currentUser?.role)) {
    await Promise.allSettled([
      syncUsersFromApi(false),
      syncOrdersFromApi(false),
    ]);
  }

  renderHero();
  renderStore();
  renderCart();
  renderSession();
  renderAdmin();
  applySettings();
}

async function apiRequest(path, { method = "GET", body, includeActor = true, timeoutMs = API_TIMEOUT_MS } = {}) {
  const url = new URL(path, API_BASE_URL || window.location.origin);
  if (includeActor && state.currentUser?.id) {
    url.searchParams.set("actorId", state.currentUser.id);
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || "No se pudo completar la solicitud.");
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("La solicitud al servidor tardo demasiado.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeApiBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function mergeUserIntoState(user) {
  if (!user) return null;
  const index = state.users.findIndex((item) => item.id === user.id);
  if (index >= 0) state.users[index] = { ...state.users[index], ...user };
  else state.users.push(user);
  if (state.currentUser?.id === user.id) {
    state.currentUser = { ...state.currentUser, ...user };
  }
  saveState();
  return user;
}

function renderSessionSensitiveViews() {
  renderHero();
  renderStore();
  renderCart();
  renderSession();
  applySettings();
}

async function refreshCurrentUserFromApi() {
  if (!state.currentUser?.id) return;
  try {
    const payload = await apiRequest(`/api/users/${encodeURIComponent(state.currentUser.id)}`, { includeActor: true });
    mergeUserIntoState(payload.user);
  } catch {
    state.currentUser = null;
    saveState();
  }
}

async function hydrateCatalogFromApi() {
  try {
    const payload = await apiRequest("/api/catalog/bootstrap", { includeActor: false });
    state.settings = { ...state.settings, ...(payload.settings || {}) };
    ensureSettingsDefaults(state);
    state.categories = Array.isArray(payload.categories) ? payload.categories : state.categories;
    state.products = Array.isArray(payload.products) ? payload.products : state.products;
    state.promoSlides = Array.isArray(payload.promoSlides) && payload.promoSlides.length ? payload.promoSlides.map(normalizePromoSlide) : state.promoSlides;
    ensureProductCatalogShape(state);
    ensurePromoSlides(state);
    saveState();
  } catch (error) {
    console.warn("No se pudo hidratar catálogo desde PostgreSQL.", error);
  }
}

async function consumeGestionAccess() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("gestionAccess");
  if (!token) return;
  url.searchParams.delete("gestionAccess");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  try {
    const payload = await apiRequest("/api/auth/gestion-access", { method: "POST", body: { token }, includeActor: false });
    state.currentUser = payload.user;
    mergeUserIntoState(payload.user);
    saveState();
  } catch (error) {
    state.currentUser = null;
    saveState();
    window.setTimeout(() => alert(error.message || "No se pudo iniciar la sesión vinculada."), 0);
  }
}

function catalogStockSignature(products = state.products) {
  return JSON.stringify((products || []).map((product) => [product.id, Number(product.stock || 0)]));
}

async function refreshCatalogStock() {
  if (document.hidden) return;
  try {
    const payload = await apiRequest("/api/catalog/bootstrap", { includeActor: false });
    const incomingProducts = Array.isArray(payload.products) ? payload.products : [];
    if (catalogStockSignature(incomingProducts) === catalogStockSignature()) return;

    state.products = incomingProducts;
    ensureProductCatalogShape(state);
    reconcileCartWithCatalogStock();
    saveState();
    renderStore();
    renderCart();
    renderAdmin();
  } catch (error) {
    console.warn("No se pudo actualizar el stock del catalogo.", error);
  }
}

function reconcileCartWithCatalogStock() {
  let changed = false;
  cart.forEach((item, productId) => {
    const product = state.products.find((entry) => entry.id === productId);
    const availableStock = getProductAvailableStock(product);
    if (!product || availableStock <= 0) {
      cart.delete(productId);
      changed = true;
      return;
    }
    if (Number(item.qty || 0) > availableStock) {
      item.qty = availableStock;
      changed = true;
    }
  });
  if (changed) saveCart();
}

function startCatalogStockPolling() {
  if (catalogStockPollTimer) return;
  catalogStockPollTimer = window.setInterval(() => {
    refreshCatalogStock();
  }, CATALOG_STOCK_POLL_INTERVAL_MS);
}

async function syncUsersFromApi(shouldRerender = true) {
  if (!["admin", "superadmin"].includes(state.currentUser?.role)) return;
  const payload = await apiRequest("/api/users");
  state.users = payload.users;
  if (state.currentUser?.id) {
    const currentUser = payload.users.find((user) => user.id === state.currentUser.id);
    if (currentUser) state.currentUser = { ...state.currentUser, ...currentUser };
  }
  saveState();
  if (shouldRerender) {
    renderSession();
    renderAdmin();
  }
}

async function syncOrdersFromApi(shouldRerender = true) {
  if (!["admin", "superadmin"].includes(state.currentUser?.role)) return;
  const payload = await apiRequest("/api/orders");
  state.orders = payload.orders || [];
  saveState();
  if (shouldRerender) renderAdmin();
  updateOrdersFloat();
}

function bindStaticEvents() {
  bindCatalogExperience();
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelector(".cart-trigger")?.addEventListener("click", openCart);
  document.querySelector(".cart-close")?.addEventListener("click", closeCart);
  document.querySelector(".ux-message-confirm")?.addEventListener("click", closeUxMessage);
  document.querySelector("#ux-message-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "ux-message-modal") closeUxMessage();
  });
  document.querySelector(".ux-confirm-accept")?.addEventListener("click", () => closeUxConfirm(true));
  document.querySelector(".ux-confirm-cancel")?.addEventListener("click", () => closeUxConfirm(false));
  document.querySelector("#ux-confirm-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "ux-confirm-modal") closeUxConfirm(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      document.querySelector("#ux-message-modal")?.classList.contains("is-open")
    ) {
      closeUxMessage();
    }
    if (event.key === "Escape" && document.querySelector("#ux-confirm-modal")?.classList.contains("is-open")) {
      closeUxConfirm(false);
    }
  });
  document.querySelector(".cart-keep-shopping")?.addEventListener("click", closeCart);
  els.cartDrawer?.addEventListener("click", (event) => {
    if (event.target === els.cartDrawer) closeCart();
  });

  document.querySelector(".login-btn")?.addEventListener("click", () => {
    if (state.currentUser) {
      toggleAccountMenu();
      return;
    }
    openAuth("login");
  });

  document.querySelector(".admin-close")?.addEventListener("click", closeAdmin);
  document.querySelector("#add-product")?.addEventListener("click", openNewProductModal);
  document.querySelector(".admin-product-modal-close")?.addEventListener("click", closeProductEditorModal);
  els.adminProductModal?.addEventListener("click", (event) => {
    if (event.target === els.adminProductModal) closeProductEditorModal();
  });
  document.querySelector(".auth-close")?.addEventListener("click", closeAuth);
  document.querySelector(".profile-close")?.addEventListener("click", closeProfile);
  els.profileModal?.addEventListener("click", (event) => {
    if (event.target === els.profileModal) closeProfile();
  });

  document.querySelectorAll("[data-auth-tab], [data-switch-auth]").forEach((button) => {
    button.addEventListener("click", () => setAuthTab(button.dataset.authTab || button.dataset.switchAuth));
  });

  document.querySelectorAll(".auth-form").forEach((form) => {
    form.addEventListener("submit", handleAuth);
  });
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.closest(".password-field")?.querySelector('input[type="password"], input[type="text"]');
      if (!field) return;
      const showing = field.type === "text";
      field.type = showing ? "password" : "text";
      button.textContent = showing ? "Ver" : "Ocultar";
      button.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
    });
  });

  document.querySelectorAll(".admin-tab").forEach((button) => {
    button.addEventListener("click", () => setAdminTab(button.dataset.adminTab));
  });

  els.productForm?.addEventListener("submit", saveProduct);
  els.productForm?.addEventListener("input", renderProductImagePreview);
  els.productForm?.addEventListener("change", renderProductImagePreview);
  els.profileForm?.addEventListener("submit", saveProfile);
  els.categoryForm?.addEventListener("submit", saveCategory);
  els.promoForm?.addEventListener("submit", savePromo);
  els.settingsForm?.addEventListener("submit", saveSettings);
  els.paymentMethodForm?.addEventListener("submit", savePaymentMethod);
  els.checkoutPaymentReceiptFile?.addEventListener("change", handleCheckoutPaymentReceipt);
  document.querySelector("#reset-product")?.addEventListener("click", resetProductForm);
  els.addBrandButton?.addEventListener("click", handleAddCustomBrand);
  els.editBrandButton?.addEventListener("click", handleEditSelectedBrand);
  els.deleteBrandButton?.addEventListener("click", handleDeleteSelectedBrand);
  document.querySelector("#reset-category")?.addEventListener("click", resetCategoryForm);
  document.querySelector("#reset-promo")?.addEventListener("click", resetPromoForm);
  document.querySelector("#reset-payment-method")?.addEventListener("click", resetPaymentMethodForm);
  document.querySelector("#reset-promo-image")?.addEventListener("click", resetPromoImagePosition);
  document.querySelector("#new-promo")?.addEventListener("click", resetPromoForm);
  document.querySelector("#promo-image-upload")?.addEventListener("change", handlePromoImageUpload);
  els.productImageUpload?.addEventListener("change", handleProductImageUpload);
  els.checkoutLink?.addEventListener("click", openCheckout);
  els.cartStockContinue?.addEventListener("click", (event) => {
    dismissCartStockNotice();
    openCheckout(event);
  });
  els.cartStockCancel?.addEventListener("click", () => {
    removeCartStockNoticeProduct();
    closeCart();
  });
  els.promoForm?.addEventListener("input", renderPromoEditorPreview);
  els.promoForm?.addEventListener("change", renderPromoEditorPreview);
  document.querySelector(".product-modal-close")?.addEventListener("click", closeProductModal);
  els.productModal?.addEventListener("click", (event) => {
    if (event.target === els.productModal) closeProductModal();
  });
  document.querySelector(".orders-history-close")?.addEventListener("click", closeOrdersHistory);
  els.ordersHistoryModal?.addEventListener("click", (event) => {
    if (event.target === els.ordersHistoryModal) closeOrdersHistory();
  });
  document.querySelector(".checkout-close")?.addEventListener("click", closeCheckout);
  document.querySelector(".checkout-back")?.addEventListener("click", closeCheckout);
  document.querySelector(".checkout-continue")?.addEventListener("click", submitCheckout);
  els.checkoutModal?.addEventListener("input", (event) => {
    if (event.target?.name?.startsWith("checkout")) {
      clearCheckoutProfileFieldIssue(event.target.name);
      if (els.checkoutProfileMissing && !els.checkoutProfileMissing.hidden) {
        const missingFields = getMissingCheckoutProfileFields(getCheckoutProfileDraft());
        if (missingFields.length) renderCheckoutProfileMissingFields(missingFields);
        else clearCheckoutProfileIssues();
      }
      renderCheckoutProfileSummary();
    }
  });
  els.checkoutModal?.addEventListener("click", (event) => {
    if (event.target === els.checkoutModal) closeCheckout();
  });
  els.ordersFloat?.addEventListener("click", openOrdersNotificationPanel);
  document.addEventListener("click", (event) => {
    if (!els.accountMenu?.classList.contains("is-open")) return;
    const topActions = document.querySelector(".top-actions");
    if (topActions && !topActions.contains(event.target)) closeAccountMenu();
  });
  document.querySelectorAll("[data-account-action]").forEach((button) => {
    button.addEventListener("click", () => handleAccountAction(button.dataset.accountAction));
  });
  document.querySelectorAll("[data-facebook-auth]").forEach((button) => {
    button.addEventListener("click", handleFacebookLogin);
  });
  document.querySelectorAll("[data-google-auth]").forEach((button) => {
    button.addEventListener("click", handleGoogleLogin);
  });
  document.addEventListener("click", (event) => {
    if (!searchQuery || !els.productSearch) return;
    const searchWrap = els.productSearch.closest(".search-wrap");
    if (searchWrap?.contains(event.target)) return;
    closeSearchSuggestions();
  });
  document.querySelectorAll('input[name="checkoutCurrency"]').forEach((input) => {
    input.addEventListener("change", () => {
      selectedCurrency = input.value in currencyConfig ? input.value : DEFAULT_CURRENCY;
      renderFilters();
      renderProducts();
      renderCart();
      renderCheckout();
    });
  });
  els.productSearch?.addEventListener("input", () => {
    searchQuery = els.productSearch.value.trim().toLowerCase();
    if (searchQuery) activeFilter = "all";
    catalogPage = 1;
    renderFilters();
    renderProducts();
    renderHeroVisibility();
    renderServicesVisibility();
    renderSearchSuggestions();
    if (searchQuery) {
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  els.clearSearch?.addEventListener("click", () => {
    clearStoreSearch(true);
  });
  els.productSearch?.addEventListener("focus", renderSearchSuggestions);
  els.adminProductSearch?.addEventListener("input", () => {
    adminProductSearch = els.adminProductSearch.value.trim().toLowerCase();
    renderProductsTable();
  });
  els.adminCategorySearch?.addEventListener("input", () => {
    adminCategorySearch = els.adminCategorySearch.value.trim().toLowerCase();
    renderCategoriesTable();
  });

  headerCondensed = false;
  els.commerceTop?.classList.remove("is-condensed");
  window.addEventListener("resize", () => {
    const pageSize = getCatalogPageSize();
    catalogPage = Math.min(catalogPage, Math.max(1, Math.ceil(getVisibleProducts().length / pageSize)));
    renderProducts();
  });
  els.heroSlides?.addEventListener("transitionend", handleHeroTransitionEnd);
  const heroCarousel = document.querySelector(".hero-carousel");
  document.querySelector(".hero-arrow-prev")?.addEventListener("click", () => moveHeroBy(-1));
  document.querySelector(".hero-arrow-next")?.addEventListener("click", () => moveHeroBy(1));
  heroCarousel?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); moveHeroBy(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); moveHeroBy(1); }
  });
  heroCarousel?.addEventListener("pointerdown", (event) => { heroPointerStartX = event.clientX; });
  heroCarousel?.addEventListener("pointerup", (event) => {
    if (heroPointerStartX === null) return;
    const distance = event.clientX - heroPointerStartX;
    heroPointerStartX = null;
    if (Math.abs(distance) >= 45) moveHeroBy(distance > 0 ? -1 : 1);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pausePromoAutoplay();
    else resumePromoAutoplay();
  });
}

function renderHero() {
  if (!els.heroSlides || !els.heroDots) return;
  const slides = state.promoSlides.length ? state.promoSlides : defaults.promoSlides;
  const loopSlides = slides.length > 1 ? [...slides, slides[0]] : slides;
  if (promoIndex > slides.length) promoIndex = 0;
  els.heroSlides.classList.remove("is-instant");
  els.heroSlides.innerHTML = loopSlides.map((slide, index) => `
    <article class="hero-slide" aria-hidden="${index === getHeroRealIndex(slides.length) ? "false" : "true"}">
      <div class="hero-slide-copy">
        <span class="pill">${escapeHtml(slide.eyebrow)}</span>
        ${index === 0 ? `<h1>${escapeHtml(slide.title)}</h1>` : `<h2>${escapeHtml(slide.title)}</h2>`}
        <p>${escapeHtml(slide.text)}</p>
        <div class="hero-actions">
          ${slide.primaryLabel ? `<a class="primary-btn" href="${escapeHtml(slide.primaryHref || "#catalogo")}">${escapeHtml(slide.primaryLabel)}</a>` : ""}
          ${slide.secondaryLabel ? `<a class="outline-btn" href="${escapeHtml(slide.secondaryHref || "#catalogo")}">${escapeHtml(slide.secondaryLabel)}</a>` : ""}
        </div>
      </div>
      <div class="hero-slide-media" style="${getPromoFrameStyle(slide)}">
        <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.title)}" style="${getPromoImageStyle(slide)}">
      </div>
    </article>
  `).join("");
  setHeroTrackPosition(promoIndex);
  els.heroDots.innerHTML = slides.map((slide, index) => `
    <button class="hero-dot ${index === getHeroRealIndex(slides.length) ? "active" : ""}" type="button" aria-label="Ir a slide ${index + 1}" data-hero-dot="${index}"></button>
  `).join("");
  els.heroDots.querySelectorAll("[data-hero-dot]").forEach((button) => {
    button.addEventListener("click", () => {
      promoIndex = Number(button.dataset.heroDot);
      setHeroTrackPosition(promoIndex);
      syncHeroDots();
      startPromoAutoplay();
    });
  });
  startPromoAutoplay();
}

function startPromoAutoplay() {
  clearInterval(promoTimer);
  if (heroPaused || document.hidden) return;
  if ((state.promoSlides.length || defaults.promoSlides.length) < 2) return;
  promoTimer = setInterval(() => {
    advanceHeroSlide();
  }, 5000);
}

function advanceHeroSlide() {
  const slides = state.promoSlides.length ? state.promoSlides : defaults.promoSlides;
  if (slides.length <= 1) return;
  promoIndex += 1;
  setHeroTrackPosition(promoIndex);
  syncHeroDots();
}

function handleHeroTransitionEnd(event) {
  if (event.target !== els.heroSlides) return;
  const slides = state.promoSlides.length ? state.promoSlides : defaults.promoSlides;
  if (slides.length <= 1 || promoIndex !== slides.length) return;
  promoIndex = 0;
  els.heroSlides.classList.add("is-instant");
  setHeroTrackPosition(0);
  void els.heroSlides.offsetWidth;
  els.heroSlides.classList.remove("is-instant");
  syncHeroDots();
}

function setHeroTrackPosition(index) {
  if (!els.heroSlides) return;
  els.heroSlides.style.transform = `translateX(-${index * 100}%)`;
}

function getHeroRealIndex(totalSlides) {
  if (!totalSlides) return 0;
  return promoIndex >= totalSlides ? 0 : promoIndex;
}

function syncHeroDots() {
  const slides = state.promoSlides.length ? state.promoSlides : defaults.promoSlides;
  const activeIndex = getHeroRealIndex(slides.length);
  els.heroDots?.querySelectorAll("[data-hero-dot]").forEach((button, index) => {
    button.classList.toggle("active", index === activeIndex);
    button.setAttribute("aria-current", index === activeIndex ? "true" : "false");
  });
  els.heroSlides?.querySelectorAll(".hero-slide").forEach((slide, index) => {
    const active = index === promoIndex || (promoIndex >= slides.length && index === slides.length);
    slide.setAttribute("aria-hidden", active ? "false" : "true");
    slide.querySelectorAll("a, button").forEach((control) => {
      control.setAttribute("tabindex", active ? "0" : "-1");
    });
  });
}

function pausePromoAutoplay() {
  heroPaused = true;
  clearInterval(promoTimer);
}

function resumePromoAutoplay() {
  heroPaused = false;
  startPromoAutoplay();
}

function moveHeroBy(direction) {
  const slides = state.promoSlides.length ? state.promoSlides : defaults.promoSlides;
  if (slides.length <= 1) return;
  const current = getHeroRealIndex(slides.length);
  promoIndex = (current + direction + slides.length) % slides.length;
  setHeroTrackPosition(promoIndex);
  syncHeroDots();
  if (!heroPaused) startPromoAutoplay();
}

function loadState() {
  const loaded = structuredClone(defaults);
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      loaded.currentUser = saved?.currentUser || null;
    }
  } catch {
    loaded.currentUser = null;
  }
  ensureSettingsDefaults(loaded);
  ensureDefaultCategories(loaded);
  ensurePromoSlides(loaded);
  ensureProductCatalogShape(loaded);
  ensureUserCatalogShape(loaded);
  return loaded;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentUser: state.currentUser,
  }));
}

function getCartStorageKey(user = state.currentUser) {
  return `${CART_STORAGE_KEY}:${user?.id ? String(user.id) : "guest"}`;
}

function loadCart(user = state.currentUser) {
  try {
    const activeKey = getCartStorageKey(user);
    const raw = localStorage.getItem(activeKey) || (!user ? localStorage.getItem(LEGACY_CART_STORAGE_KEY) : "");
    const savedItems = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(savedItems)) return new Map();
    const items = savedItems
      .filter((item) => item && item.id && Number(item.qty) > 0)
      .map((item) => [item.id, {
        id: String(item.id),
        name: String(item.name || "Producto"),
        price: Number(item.price || 0),
        currency: item.currency || DEFAULT_CURRENCY,
        qty: Math.max(1, Number(item.qty || 1)),
      }]);
    return new Map(items);
  } catch {
    return new Map();
  }
}

function saveCart() {
  localStorage.setItem(getCartStorageKey(), JSON.stringify(Array.from(cart.values())));
}

function reconcileCartWithCatalog() {
  let changed = false;
  cart.forEach((item, id) => {
    const product = state.products.find((entry) => entry.id === id);
    if (!product || Number(product.stock || 0) <= 0) {
      cart.delete(id);
      changed = true;
      return;
    }
    const nextQty = Math.min(Number(item.qty || 1), Number(product.stock || 0));
    const nextItem = {
      ...item,
      name: product.name,
      price: Number(product.price || 0),
      currency: product.currency || DEFAULT_CURRENCY,
      qty: nextQty,
    };
    if (
      nextItem.name !== item.name ||
      nextItem.price !== item.price ||
      nextItem.currency !== item.currency ||
      nextItem.qty !== item.qty
    ) {
      cart.set(id, nextItem);
      changed = true;
    }
  });
  if (changed) saveCart();
}

function loadActiveCart() {
  cart = loadCart();
  reconcileCartWithCatalog();
  renderCart();
  renderCheckout();
}

function ensureSettingsDefaults(targetState) {
  targetState.settings = { ...defaults.settings, ...(targetState.settings || {}) };
  targetState.settings.ordersWhatsapp = targetState.settings.ordersWhatsapp || targetState.settings.whatsapp || defaults.settings.ordersWhatsapp;
  const mergedBrands = [...DEFAULT_PRODUCT_BRANDS, ...(targetState.settings.productBrands || [])];
  targetState.settings.productBrands = dedupeBrands(mergedBrands);
  targetState.settings.paymentMethods = ensurePaymentMethods(targetState.settings.paymentMethods);
}

function ensurePaymentMethods(methods = []) {
  const incoming = Array.isArray(methods) ? methods : [];
  const merged = incoming.length ? incoming : DEFAULT_PAYMENT_METHODS;
  const byId = new Map();
  merged.forEach((method, index) => {
    const normalized = normalizePaymentMethod(method, index + 1);
    byId.set(normalized.id, normalized);
  });
  return [...byId.values()].sort((left, right) => sortBySortOrder(left, right));
}

function normalizePaymentMethod(method = {}, fallbackOrder = 1) {
  const baseName = String(method.name || "").trim() || `Método ${fallbackOrder}`;
  return {
    id: String(method.id || slugify(baseName)).trim(),
    name: baseName,
    detail: String(method.detail || "").trim(),
    instructions: String(method.instructions || "").trim(),
    isActive: method.isActive !== false,
    sortOrder: Number(method.sortOrder || fallbackOrder),
  };
}

function sortBySortOrder(left, right) {
  const delta = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
  if (delta !== 0) return delta;
  return String(left.name || "").localeCompare(String(right.name || ""), "es");
}

function ensureDefaultCategories(targetState) {
  defaults.categories.forEach((defaultCategory) => {
    const existing = targetState.categories.find((category) => category.id === defaultCategory.id);
    if (!existing) {
      targetState.categories.push({ ...defaultCategory });
    }
  });
}

function ensurePromoSlides(targetState) {
  if (!Array.isArray(targetState.promoSlides) || !targetState.promoSlides.length) {
    targetState.promoSlides = structuredClone(defaults.promoSlides);
  }
  targetState.promoSlides = targetState.promoSlides.map(normalizePromoSlide);
  const firstSlide = targetState.promoSlides.find((slide) => slide.id === "slide-1");
  if (firstSlide && (!firstSlide.image || firstSlide.image === "assets/hero-iphone.png")) {
    firstSlide.image = "assets/hero-slide1-tech.svg";
  }
}

function ensureProductCatalogShape(targetState) {
  targetState.products = (targetState.products || []).map((product) => ({
    ...product,
    brand: product.brand || "",
    model: product.model || "",
    currency: product.currency || DEFAULT_CURRENCY,
  }));
}

function ensureUserCatalogShape(targetState) {
  targetState.users = (targetState.users || []).map((user) => ({
    ...user,
    isWholesaler: Boolean(user.isWholesaler),
    isApproved: ["admin", "superadmin"].includes(user.role) ? true : Boolean(user.isApproved),
  }));
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `id-${Date.now()}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function formatProductCode(value) {
  const numericCode = Number(value || 0);
  if (!Number.isFinite(numericCode) || numericCode <= 0) return "-";
  if (numericCode >= 10000) return String(Math.trunc(numericCode));
  return String(Math.trunc(numericCode)).padStart(4, "0");
}

function getCategory(id) {
  return state.categories.find((category) => category.id === id);
}

function getTopCategories() {
  return state.categories
    .filter((category) => !category.parentId)
    .sort(sortCategoriesByOrder);
}

function getSubcategories(parentId) {
  return state.categories
    .filter((category) => category.parentId === parentId)
    .sort(sortCategoriesByOrder);
}

function getCategoryLabel(id) {
  const category = getCategory(id);
  if (!category) return id;
  if (!category.parentId) return category.name;
  const parent = getCategory(category.parentId);
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

function sortCategoriesByOrder(left, right) {
  const orderDelta = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
  if (orderDelta !== 0) return orderDelta;
  return String(left.name || "").localeCompare(String(right.name || ""), "es");
}

function dedupeBrands(brands) {
  return brands
    .map((brand) => String(brand || "").trim())
    .filter(Boolean)
    .filter((brand, index, list) => list.findIndex((item) => item.toLowerCase() === brand.toLowerCase()) === index);
}

function getProductBrands() {
  return dedupeBrands(state.settings?.productBrands || DEFAULT_PRODUCT_BRANDS);
}

function ensureProductBrand(brand) {
  const cleanBrand = String(brand || "").trim();
  if (!cleanBrand) return "";
  const brands = getProductBrands();
  const existing = brands.find((item) => item.toLowerCase() === cleanBrand.toLowerCase());
  if (existing) return existing;
  state.settings.productBrands = [...brands, cleanBrand];
  saveState();
  return cleanBrand;
}

async function persistProductBrands() {
  state.settings.productBrands = getProductBrands();
  saveState();
  if (!["admin", "superadmin"].includes(state.currentUser?.role || "")) return;
  try {
    const payload = await apiRequest("/api/settings", {
      method: "PUT",
      body: {
        ...state.settings,
        productBrands: state.settings.productBrands,
        paymentMethods: getPaymentMethods(),
      },
    });
    state.settings = { ...state.settings, ...(payload.settings || {}) };
  } catch (error) {
    alert(`No se pudo guardar la lista de marcas: ${error.message}`);
  }
}

function getPaymentMethods() {
  return [...ensurePaymentMethods(state.settings?.paymentMethods || [])].sort(sortBySortOrder);
}

function getActivePaymentMethods() {
  return getPaymentMethods().filter((method) => method.isActive);
}

function getPaymentMethod(id) {
  return getPaymentMethods().find((method) => method.id === id);
}

function isSuperAdminSession() {
  return state.currentUser?.role === "superadmin";
}

function getProductDisplayName(categoryId, brand, model, fallbackName = "") {
  const category = getCategory(categoryId);
  const categoryName = category?.name || "";
  const cleanBrand = String(brand || "").trim();
  const cleanModel = String(model || "").trim();
  const suffix = [cleanBrand, cleanModel].filter(Boolean).join(" ");
  if (categoryName && suffix) return `${categoryName} de ${suffix}`;
  if (categoryName) return categoryName;
  return fallbackName || suffix || "Producto";
}

function isImageSource(value) {
  const source = String(value || "").trim();
  return source.startsWith("assets/")
    || source.startsWith("data:image/")
    || source.startsWith("http://")
    || source.startsWith("https://")
    || source.startsWith("file:/");
}

function getProductImageSource(product = {}) {
  const image = String(product.image || "").trim();
  const categoryCode = getCategory(product.category)?.code || "";
  if (image.startsWith("data:image/")) return PRODUCT_IMAGE_FALLBACKS[categoryCode] || "PR";
  if (isImageSource(image)) return image;
  return PRODUCT_IMAGE_FALLBACKS[image] || PRODUCT_IMAGE_FALLBACKS[categoryCode] || image;
}

function getProductImageMarkup(product = {}, { fallbackClass = "product-image-fallback" } = {}) {
  const imageSource = getProductImageSource(product);
  const fallback = product.image || getCategory(product.category)?.code || "PR";
  if (isImageSource(imageSource)) {
    return `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(product.name || "Producto")}">`;
  }
  return `<span class="${escapeHtml(fallbackClass)}">${escapeHtml(fallback)}</span>`;
}

function renderStore() {
  renderCategories();
  renderFilters();
  renderProducts();
  renderHeroVisibility();
  renderServicesVisibility();
}

function renderCategories() {
  const topCategories = getTopCategories().filter(categoryShouldAppearInNavigation);
  els.categoryGrid.innerHTML = topCategories.map((category) => {
    const children = getSubcategories(category.id);
    const isActive = activeFilter === category.id || getCategory(activeFilter)?.parentId === category.id;
    return `
      <div class="category-group">
        <button class="category-link ${children.length ? "has-children" : ""} ${isActive ? "active" : ""}" type="button" data-category-trigger="${category.id}">
          <span>${escapeHtml(category.name)}</span>
        </button>
        ${children.length ? `
          <div class="subcategory-menu" data-subcategory-menu="${category.id}">
            ${children.map((subcategory) => `
              <button class="subcategory-link ${activeFilter === subcategory.id ? "active" : ""}" type="button" data-filter-link="${subcategory.id}">
                ${escapeHtml(subcategory.name)}
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  els.categoryGrid.querySelectorAll("[data-category-trigger]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.categoryTrigger;
      setFilter(id);
      requestAnimationFrame(closeCategoryMenus);
    });
  });

  els.categoryGrid.querySelectorAll("[data-filter-link]").forEach((link) => {
    link.addEventListener("click", () => {
      setFilter(link.dataset.filterLink);
      requestAnimationFrame(closeCategoryMenus);
    });
  });

  els.categoryGrid.querySelectorAll(".category-group").forEach((group) => {
    group.addEventListener("mouseleave", () => {
      group.querySelector(".subcategory-menu")?.classList.remove("is-open");
      if (group.contains(document.activeElement)) document.activeElement?.blur?.();
    });
  });
}

function closeCategoryMenus() {
  els.categoryGrid?.querySelectorAll(".subcategory-menu.is-open").forEach((menu) => menu.classList.remove("is-open"));
  if (els.categoryGrid?.contains(document.activeElement)) document.activeElement?.blur?.();
}

function categoryShouldAppearInNavigation(category) {
  if (!category) return false;
  if (!category.parentId) return true;
  const childIds = getSubcategories(category.id).map((child) => child.id);
  return state.products.some((product) => product.category === category.id || childIds.includes(product.category));
}

function restoreMainWebCarousel() {
  if (window.location.pathname.replace(/\/+$/, "") !== "/beim") return;
  const hero = document.querySelector(".hero");
  if (!hero) return;
  if (!els.heroSlides?.children.length) renderHero();
  hero.hidden = false;
  stabilizeHeroCarousel();
}

function stabilizeHeroCarousel() {
  if (!els.heroSlides) return;
  const slides = state.promoSlides.length ? state.promoSlides : defaults.promoSlides;
  if (!slides.length) return;
  promoIndex = getHeroRealIndex(slides.length);
  els.heroSlides.classList.add("is-instant");
  setHeroTrackPosition(promoIndex);
  syncHeroDots();
  void els.heroSlides.offsetWidth;
  els.heroSlides.classList.remove("is-instant");
  startPromoAutoplay();
}

function renderFilters() {
  if (!els.shopToolbar) return;
  const visibleProducts = getVisibleProducts();
  const activeCategory = activeFilter === "all" ? null : getCategory(activeFilter);
  const hasDiscoveryState = activeFilter !== "all" || Boolean(searchQuery);
  const contextLabel = activeCategory
    ? getCategoryLabel(activeFilter)
    : searchQuery
      ? "Resultados de búsqueda"
      : "Catálogo disponible";
  const contextMeta = searchQuery
    ? `${visibleProducts.length} producto${visibleProducts.length === 1 ? "" : "s"} para "${escapeHtml(searchQuery)}"`
    : `${visibleProducts.length} producto${visibleProducts.length === 1 ? "" : "s"} visibles`;
  const currencyOptions = Object.keys(currencyConfig).map((currencyCode) => `
    <option value="${currencyCode}" ${currencyCode === selectedCurrency ? "selected" : ""}>${currencyCode}</option>
  `).join("");

  els.shopToolbar.innerHTML = `
    <div class="toolbar-main">
      <div class="toolbar-summary" aria-live="polite">
        <strong>${escapeHtml(contextLabel)}</strong>
        <span>${contextMeta}</span>
      </div>
      ${hasDiscoveryState ? `
        <div class="toolbar-tags">
          ${activeCategory ? `<span class="toolbar-tag">${escapeHtml(getCategoryLabel(activeFilter))}</span>` : ""}
          ${searchQuery ? `<span class="toolbar-tag">Búsqueda: ${escapeHtml(searchQuery)}</span>` : ""}
          <button class="toolbar-reset" type="button" id="toolbar-reset">Ver todo</button>
        </div>
      ` : ""}
    </div>
    <label class="currency-switcher" for="currency-select">
      <span>Moneda</span>
      <select id="currency-select" aria-label="Seleccionar moneda">${currencyOptions}</select>
    </label>
  `;

  els.shopToolbar.querySelector("#currency-select")?.addEventListener("change", (event) => {
    selectedCurrency = event.target.value in currencyConfig ? event.target.value : DEFAULT_CURRENCY;
    catalogPage = 1;
    renderProducts();
    renderCart();
    renderAdmin();
  });
  els.shopToolbar.querySelector("#toolbar-reset")?.addEventListener("click", resetStoreDiscovery);
}

function setFilter(filter) {
  activeFilter = filter;
  catalogPage = 1;
  renderFilters();
  renderProducts();
  renderHeroVisibility();
  renderServicesVisibility();
  document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHeroVisibility() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  hero.hidden = false;
  if (!els.heroSlides?.children.length) renderHero();
}

function renderServicesVisibility() {
  const services = document.querySelector("#servicios");
  if (!services) return;
  const shouldShowServices = activeFilter === "all" && !searchQuery;
  services.hidden = !shouldShowServices;
}

function renderProducts() {
  const products = getVisibleProducts();
  const pageSize = getCatalogPageSize();
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  catalogPage = Math.min(Math.max(1, catalogPage), totalPages);
  const startIndex = (catalogPage - 1) * pageSize;
  const pageProducts = products.slice(startIndex, startIndex + pageSize);

  els.productGrid.innerHTML = pageProducts.map(productCard).join("") || `<p class="empty-cart">No encontramos productos para esa búsqueda.</p>`;
  renderCatalogPagination(products.length, pageSize, totalPages);

  els.productGrid.querySelectorAll(".add-cart").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.id));
  });
  els.productGrid.querySelectorAll("[data-view-product]").forEach((button) => {
    button.addEventListener("click", () => openProductModal(button.dataset.viewProduct));
  });
  els.productGrid.querySelectorAll("[data-product-id]").forEach((card) => {
    card.addEventListener("dblclick", () => openProductModal(card.dataset.productId));
  });
}

function getCatalogPageSize() {
  const width = window.innerWidth || document.documentElement.clientWidth || 1200;
  if (width <= 640) return 2;
  if (width <= 980) return 4;
  return 8;
}

function renderCatalogPagination(totalProducts, pageSize, totalPages) {
  if (!els.catalogPagination) return;
  if (totalProducts <= pageSize) {
    els.catalogPagination.innerHTML = "";
    return;
  }
  const start = (catalogPage - 1) * pageSize + 1;
  const end = Math.min(totalProducts, catalogPage * pageSize);
  els.catalogPagination.innerHTML = `
    <div class="catalog-page-status">${start}-${end} de ${totalProducts}</div>
    <div class="catalog-page-actions">
      <button type="button" data-catalog-page="prev" ${catalogPage <= 1 ? "disabled" : ""}>Anterior</button>
      <span>Página ${catalogPage} de ${totalPages}</span>
      <button type="button" data-catalog-page="next" ${catalogPage >= totalPages ? "disabled" : ""}>Siguiente</button>
    </div>
  `;
  els.catalogPagination.querySelectorAll("[data-catalog-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.catalogPage;
      catalogPage += direction === "next" ? 1 : -1;
      renderProducts();
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function getVisibleProducts() {
  const visibleProducts = state.products.filter((product) => {
    if (!productMatchesCatalogDiscovery(product)) return false;
    if (catalogQuickFilter === "stock") return Number(product.stock || 0) > 0;
    if (catalogQuickFilter === "offer") return String(product.badge || "").toLowerCase() === "oferta";
    return true;
  });
  if (catalogSort === "price-asc") return visibleProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (catalogSort === "price-desc") return visibleProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (catalogSort === "name") return visibleProducts.sort((a, b) => naturalProductTextCompare(a.name, b.name));
  if (!searchQuery) return visibleProducts.sort(compareProductsByBrandAndModel);
  return visibleProducts.sort((left, right) => {
    const scoreDelta = getProductSearchScore(right, searchQuery) - getProductSearchScore(left, searchQuery);
    return scoreDelta || compareProductsByBrandAndModel(left, right);
  });
}

function compareProductsByBrandAndModel(left, right) {
  const brandDelta = naturalProductTextCompare(left.brand, right.brand);
  if (brandDelta) return brandDelta;
  const modelDelta = naturalProductTextCompare(left.model, right.model);
  if (modelDelta) return modelDelta;
  return naturalProductTextCompare(left.name, right.name);
}

function naturalProductTextCompare(left, right) {
  return String(left || "").localeCompare(String(right || ""), "es", {
    numeric: true,
    sensitivity: "base",
    ignorePunctuation: true
  });
}

function productMatchesCatalogDiscovery(product) {
  const haystack = getProductSearchText(product);
  const isDirectMatch = product.category === activeFilter;
  const category = getCategory(product.category);
  const isChildMatch = category?.parentId === activeFilter;
  const matchesFilter = searchQuery
    ? true
    : activeFilter === "all" || isDirectMatch || isChildMatch;
  const matchesSearch = !searchQuery || productMatchesSearch(product, haystack, searchQuery);
  return matchesFilter && matchesSearch;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchTokenAliases(token) {
  const normalizedToken = normalizeSearchText(token);
  const aliases = new Set([normalizedToken]);
  const aliasGroups = [
    ["pantalla", "pantallas", "display", "displays", "pan", "dis", "modulo", "lcd", "touch", "screen"],
    ["repuesto", "repuestos", "respuesto", "respuestos", "pieza", "piezas", "partes", "replacement"],
    ["celular", "celulares", "telefono", "telefonos", "smartphone", "smartphones", "movil", "moviles", "cel"],
    ["notebook", "notebooks", "laptop", "laptops", "computadora", "computadoras", "pc"],
    ["auricular", "auriculares", "audifono", "audifonos", "audio", "parlante", "parlantes"],
    ["cargador", "cargadores", "charger", "cable", "usb", "tipo c", "type c"],
    ["bateria", "baterias", "pila", "pilas", "battery"],
    ["camara", "camaras", "camera", "lente", "sensor"],
    ["nuevo", "nueva", "oferta", "promo", "promocion", "popular"],
  ];
  aliasGroups.forEach((group) => {
    const shouldExpand = group.some((alias) => alias.startsWith(normalizedToken) || normalizedToken.startsWith(alias));
    if (shouldExpand) group.forEach((alias) => aliases.add(normalizeSearchText(alias)));
  });
  return Array.from(aliases).filter(Boolean);
}

function getSearchGroups(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  return normalizedQuery.split(" ").map(getSearchTokenAliases).filter((group) => group.length);
}

function productMatchesSearch(product, haystack, query) {
  const groups = getSearchGroups(query);
  if (!groups.length) return true;
  const compactHaystack = haystack.replace(/\s+/g, "");
  const compactQuery = normalizeSearchText(query).replace(/\s+/g, "");
  if (compactQuery && compactHaystack.includes(compactQuery)) return true;
  return groups.every((group) => group.some((term) => textContainsSearchTerm(haystack, term)));
}

function textContainsSearchTerm(text, term) {
  if (!term) return false;
  if (text.includes(term)) return true;
  const compactText = text.replace(/\s+/g, "");
  const compactTerm = term.replace(/\s+/g, "");
  if (compactTerm && compactText.includes(compactTerm)) return true;
  return text.split(" ").some((word) => word.startsWith(term) || term.startsWith(word));
}

function getProductSearchScore(product, query) {
  const haystack = getProductSearchText(product);
  const nameText = normalizeSearchText(product.name);
  const modelText = normalizeSearchText(product.model);
  const brandText = normalizeSearchText(product.brand);
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const compactHaystack = haystack.replace(/\s+/g, "");
  let score = 0;
  if (nameText === normalizedQuery || modelText === normalizedQuery || brandText === normalizedQuery) score += 120;
  if (nameText.includes(normalizedQuery)) score += 70;
  if (modelText.includes(normalizedQuery) || brandText.includes(normalizedQuery)) score += 55;
  if (compactQuery && compactHaystack.includes(compactQuery)) score += 45;
  getSearchGroups(query).forEach((group) => {
    if (group.some((term) => nameText.includes(term))) score += 22;
    else if (group.some((term) => modelText.includes(term) || brandText.includes(term))) score += 18;
    else if (group.some((term) => textContainsSearchTerm(haystack, term))) score += 10;
  });
  return score;
}

function getProductSearchBoostText(text) {
  const normalizedText = normalizeSearchText(text);
  const boostParts = [];
  const boostGroups = [
    ["pantalla", "pantallas", "display", "displays", "modulo", "lcd", "touch", "screen", "pan", "dis"],
    ["repuesto", "repuestos", "respuesto", "respuestos", "pieza", "piezas", "partes"],
    ["celular", "celulares", "telefono", "telefonos", "smartphone", "smartphones", "movil", "moviles", "cel"],
    ["notebook", "notebooks", "laptop", "laptops", "computadora", "computadoras", "pc"],
    ["auricular", "auriculares", "audifono", "audifonos", "audio", "parlante", "parlantes"],
    ["cargador", "cargadores", "charger", "cable", "usb", "tipo c", "type c"],
    ["bateria", "baterias", "pila", "pilas", "battery"],
  ];
  boostGroups.forEach((group) => {
    if (group.some((term) => normalizedText.includes(normalizeSearchText(term)))) {
      boostParts.push(...group);
    }
  });
  return boostParts.join(" ");
}

function getProductSearchText(product) {
  const category = getCategory(product.category);
  const parentCategory = category?.parentId ? getCategory(category.parentId) : null;
  const parts = [
    product.name,
    product.description,
    product.brand,
    product.model,
    String(product.productCode || ""),
    formatProductCode(product.productCode),
    product.badge,
    category?.name || "",
    category?.code || "",
    category?.description || "",
    parentCategory?.name || "",
    parentCategory?.code || "",
    parentCategory?.description || "",
    getCategoryLabel(product.category),
  ];
  const baseText = parts.join(" ");
  const boostText = getProductSearchBoostText(baseText);
  if (boostText) {
    parts.push(boostText);
  }
  return normalizeSearchText(parts.join(" "));
}


function clearStoreSearch(keepFocus = false) {
  searchQuery = "";
  catalogPage = 1;
  if (els.productSearch) {
    els.productSearch.value = "";
    if (keepFocus) els.productSearch.focus();
  }
  renderFilters();
  renderProducts();
  renderHeroVisibility();
  renderServicesVisibility();
  closeSearchSuggestions();
}

function renderSearchSuggestions() {
  const panel = document.querySelector("#search-suggestions");
  if (!panel) return;
  const query = els.productSearch?.value.trim() || "";
  if (query.length < 2) {
    closeSearchSuggestions();
    return;
  }
  const matches = state.products
    .filter((product) => productMatchesSearch(product, getProductSearchText(product), query))
    .sort((left, right) => getProductSearchScore(right, query) - getProductSearchScore(left, query))
    .slice(0, 6);
  panel.hidden = false;
  panel.innerHTML = matches.length ? `
    <div class="search-suggestions-head"><strong>Productos encontrados</strong><span>${matches.length} sugerencia${matches.length === 1 ? "" : "s"}</span></div>
    ${matches.map((product) => `
      <button class="search-suggestion" type="button" role="option" data-search-product="${escapeHtml(product.id)}">
        <span class="search-suggestion-media">${getProductImageMarkup(product, { fallbackClass: "search-suggestion-fallback" })}</span>
        <span class="search-suggestion-copy">
          <strong>${escapeHtml(product.name)}</strong>
          <small>${escapeHtml(getCategoryLabel(product.category))} · ${escapeHtml(getProductColorLabel(product))} · Cod. ${escapeHtml(formatProductCode(product.productCode))}</small>
        </span>
        <span class="search-suggestion-price">${formatPrice(product.price, product.currency)}</span>
      </button>
    `).join("")}
    <button class="search-view-all" type="button">Ver todos los resultados</button>
  ` : `
    <div class="search-empty">
      <strong>No encontramos “${escapeHtml(query)}”</strong>
      <span>Probá con la marca, el modelo, la categoría o el código.</span>
    </div>
  `;
  panel.querySelectorAll("[data-search-product]").forEach((button) => {
    button.addEventListener("click", () => {
      closeSearchSuggestions();
      openProductModal(button.dataset.searchProduct);
    });
  });
  panel.querySelector(".search-view-all")?.addEventListener("click", () => {
    closeSearchSuggestions();
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function closeSearchSuggestions() {
  const panel = document.querySelector("#search-suggestions");
  if (panel) panel.hidden = true;
}

function resetStoreDiscovery({ shouldScroll = true } = {}) {
  activeFilter = "all";
  catalogPage = 1;
  renderCategories();
  clearStoreSearch(false);
  if (shouldScroll) document.querySelector("#inicio")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function productCard(product) {
  const category = getCategory(product.category);
  const stockText = getVisibleStockText(product);
  const categoryLabel = getCategoryLabel(product.category);
  const imageSource = getProductImageSource(product);
  const image = getProductImageMarkup(product, { fallbackClass: "" });
  const imageClass = isImageSource(imageSource) ? "product-image" : "product-image product-icon";

  return `
    <article class="product-card ${product.stock <= 0 ? "is-sold-out" : ""}" data-category="${escapeHtml(product.category)}" data-product-id="${escapeHtml(product.id)}">
      ${product.stock <= 0 ? `<span class="sold-out-ribbon">Agotado</span>` : ""}
      <span class="badge ${badgeClass(product.badge)}">${escapeHtml(product.badge)}</span>
      <div class="${imageClass}">${image}</div>
      <div class="product-info">
        <div class="product-meta">
          <span class="stock-pill ${product.stock > 0 ? "in-stock" : "out-stock"}">${stockText}</span>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <span class="product-color">${escapeHtml(getProductColorLabel(product))}</span>
        <p>${escapeHtml(product.description)}</p>
        <div class="price-row">
          <strong>${formatPrice(product.price, product.currency)}</strong>
          <span class="product-stock-copy">
            <span class="product-code">Cod. ${escapeHtml(formatProductCode(product.productCode))}</span>
            <span>Stock real</span>
          </span>
        </div>
        <div class="product-card-actions">
          <button class="view-product" type="button" data-view-product="${escapeHtml(product.id)}">Ver detalles</button>
          <button class="add-cart" type="button" data-id="${escapeHtml(product.id)}" ${product.stock <= 0 ? "disabled" : ""}>Agregar</button>
        </div>
      </div>
    </article>
  `;
}

function getVisibleStockText(product) {
  const stock = Math.max(0, Number(product?.stock || 0));
  if (stock <= 0) return "Sin stock";
  if (!["admin", "superadmin"].includes(state.currentUser?.role || "")) return "En stock";
  return `En stock · ${stock} ${stock === 1 ? "unidad" : "unidades"}`;
}

function bindCatalogExperience() {
  document.querySelectorAll("[data-catalog-quick]").forEach((button) => {
    button.addEventListener("click", () => {
      catalogQuickFilter = button.dataset.catalogQuick || "all";
      catalogPage = 1;
      document.querySelectorAll("[data-catalog-quick]").forEach((item) => {
        const active = item.dataset.catalogQuick === catalogQuickFilter;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderFilters();
      renderProducts();
    });
  });
  document.querySelector("#catalog-sort")?.addEventListener("change", (event) => {
    catalogSort = event.target.value || "featured";
    catalogPage = 1;
    renderProducts();
  });
}

function badgeClass(badge) {
  if (badge === "Popular") return "badge-popular";
  if (badge === "Oferta") return "badge-offer";
  return "badge-new";
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  const availableStock = getProductAvailableStock(product);
  if (!product || availableStock <= 0) return;

  if (cart.has(id)) {
    if (cart.get(id).qty >= availableStock) {
      showCartStockNotice(product, availableStock);
      openCart();
      return;
    }
    cart.get(id).qty += 1;
  } else {
    cart.set(id, { id, name: product.name, price: product.price, currency: product.currency || DEFAULT_CURRENCY, qty: 1 });
  }

  saveCart();
  renderCart();
  openCart();
}

function getProductAvailableStock(product) {
  return Math.max(0, Number(product?.stock || 0));
}

function showCartStockNotice(product, stock) {
  if (!els.cartStockNotice) return;
  const productName = product?.name || "este producto";
  const unitLabel = stock === 1 ? "unidad" : "unidades";
  cartStockNoticeProductId = product?.id || null;
  if (els.cartStockTitle) els.cartStockTitle.textContent = "Stock disponible";
  if (els.cartStockMessage) {
    els.cartStockMessage.textContent = `Solo quedan ${stock} ${unitLabel} de ${productName}. Ya tienes esa cantidad en el carrito. Puedes continuar con la compra o cancelarla.`;
  }
  els.cartStockNotice.hidden = false;
}

function dismissCartStockNotice() {
  if (els.cartStockNotice) els.cartStockNotice.hidden = true;
  cartStockNoticeProductId = null;
}

function removeCartStockNoticeProduct() {
  if (cartStockNoticeProductId) {
    cart.delete(cartStockNoticeProductId);
    saveCart();
  }
  dismissCartStockNotice();
  renderCart();
}

function openCart() {
  els.cartDrawer?.classList.add("is-open");
  els.cartDrawer?.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  els.cartDrawer?.classList.remove("is-open");
  els.cartDrawer?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function renderCart() {
  const products = Array.from(cart.values());
  const totalQty = products.reduce((sum, item) => sum + item.qty, 0);
  const total = products.reduce((sum, item) => sum + convertPrice(item.price * item.qty, item.currency, selectedCurrency), 0);

  els.cartCount.textContent = totalQty;
  els.cartTotal.textContent = formatPrice(total, selectedCurrency, selectedCurrency);
  const cartItemCount = document.querySelector("#cart-item-count");
  if (cartItemCount) cartItemCount.textContent = `${totalQty} producto${totalQty === 1 ? "" : "s"}`;

  if (!products.length) {
    els.cartItems.innerHTML = `
      <div class="cart-empty-state">
        <span class="cart-empty-icon" aria-hidden="true">🛒</span>
        <strong>Tu carrito está vacío</strong>
        <p>Explorá el catálogo y agregá los productos que necesitás.</p>
        <button class="cart-empty-explore" type="button">Explorar productos</button>
      </div>`;
    els.cartItems.querySelector(".cart-empty-explore")?.addEventListener("click", () => {
      closeCart();
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    updateCheckoutLink();
    return;
  }

  els.cartItems.innerHTML = products.map((item) => {
    const product = state.products.find((entry) => entry.id === item.id);
    const imageSource = getProductImageSource(product);
    const imageMarkup = isImageSource(imageSource)
      ? `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.name)}">`
      : `<span>${escapeHtml(product?.image || getCategory(product?.category)?.code || "PR")}</span>`;
    const imageClass = isImageSource(imageSource) ? "cart-item-media" : "cart-item-media cart-item-media-fallback";
    return `
      <div class="cart-item">
        <div class="${imageClass}">${imageMarkup}</div>
        <div class="cart-item-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <small class="cart-item-code">Cod. ${escapeHtml(formatProductCode(product?.productCode))}</small>
          <small>${escapeHtml(getCategoryLabel(product?.category || ""))}</small>
          <span class="cart-item-color">${escapeHtml(getProductColorLabel(product))}</span>
          <span>${formatPrice(item.price, item.currency)} por unidad</span>
          <button class="cart-remove" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.name)} del carrito">Eliminar</button>
        </div>
        <div class="cart-item-side">
          <strong class="cart-item-line-total">${formatPrice(item.price * item.qty, item.currency)}</strong>
          <div class="cart-qty">
            <button type="button" data-action="minus" data-id="${escapeHtml(item.id)}" aria-label="Restar unidad">-</button>
            <strong>${item.qty}</strong>
            <button type="button" data-action="plus" data-id="${escapeHtml(item.id)}" aria-label="Sumar unidad">+</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  els.cartItems.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => updateQuantity(button.dataset.id, button.dataset.action));
  });
  updateCheckoutLink();
}

function openProductModal(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || !els.productModalBody) return;
  const category = getCategory(product.category);
  const stockText = getVisibleStockText(product);
  const imageMarkup = getProductImageMarkup(product, { fallbackClass: "product-modal-fallback" });
  els.productModalBody.innerHTML = `
    <div class="product-modal-gallery">${imageMarkup}</div>
    <div class="product-modal-copy">
      <div class="product-modal-labels">
        <span class="eyebrow">${escapeHtml(getCategoryLabel(product.category))}</span>
        <span class="product-code product-code-modal">Cod. ${escapeHtml(formatProductCode(product.productCode))}</span>
      </div>
      <h2>${escapeHtml(product.name)}</h2>
      <div class="product-modal-meta">
        <span class="product-modal-price">${formatPrice(product.price, product.currency)}</span>
        <span class="stock-pill ${product.stock > 0 ? "in-stock" : "out-stock"}">${stockText}</span>
      </div>
      <p class="product-modal-description">${escapeHtml(product.description || "Consultá disponibilidad y compatibilidad antes de finalizar tu compra.")}</p>
      <div class="product-modal-specs">
        <div><strong>Marca</strong><span>${escapeHtml(product.brand || "-")}</span></div>
        <div><strong>Modelo</strong><span>${escapeHtml(product.model || "-")}</span></div>
        <div><strong>Color</strong><span>${escapeHtml(product.color || "Sin especificar")}</span></div>
        <div><strong>Moneda base</strong><span>${escapeHtml(product.currency || DEFAULT_CURRENCY)}</span></div>
      </div>
      <div class="product-modal-purchase">
        <button class="primary-btn product-modal-add" type="button" data-modal-add="${escapeHtml(product.id)}" ${product.stock <= 0 ? "disabled" : ""}>${product.stock > 0 ? "Agregar al carrito" : "Producto sin stock"}</button>
        <small>${product.stock > 0 ? `${product.stock} unidad${product.stock === 1 ? "" : "es"} disponible${product.stock === 1 ? "" : "s"}` : "Consultanos por una próxima reposición"}</small>
      </div>
    </div>
  `;
  els.productModalBody.querySelector("[data-modal-add]")?.addEventListener("click", () => {
    addToCart(product.id);
    closeProductModal();
  });
  els.productModal?.classList.add("is-open");
  els.productModal?.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
  els.productModal?.classList.remove("is-open");
  els.productModal?.setAttribute("aria-hidden", "true");
}

function openCheckout(event) {
  event?.preventDefault();
  if (!cart.size) return;
  resetCheckoutConfirmation();
  clearCheckoutProfileIssues();
  hydrateCheckoutFields();
  renderCheckout();
  closeCart();
  els.checkoutModal?.classList.add("is-open");
  els.checkoutModal?.setAttribute("aria-hidden", "false");
}

function closeCheckout() {
  els.checkoutModal?.classList.remove("is-open");
  els.checkoutModal?.setAttribute("aria-hidden", "true");
  resetCheckoutConfirmation();
}

function toggleAccountMenu() {
  if (!state.currentUser || !els.accountMenu) return;
  const isOpen = els.accountMenu.classList.contains("is-open");
  if (isOpen) closeAccountMenu();
  else openAccountMenu();
}

function openAccountMenu() {
  if (!state.currentUser || !els.accountMenu) return;
  syncAccountMenuActions();
  els.accountMenu.classList.add("is-open");
  els.accountMenu.setAttribute("aria-hidden", "false");
}

function closeAccountMenu() {
  els.accountMenu?.classList.remove("is-open");
  els.accountMenu?.setAttribute("aria-hidden", "true");
}

function handleAccountAction(action) {
  closeAccountMenu();
  if (action === "admin") {
    if (!["admin", "superadmin"].includes(state.currentUser?.role || "")) return;
    openAdmin();
    return;
  }
  if (action === "logout") {
    logout();
    return;
  }
  if (action === "prices") {
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "orders") {
    openOrdersHistory();
    return;
  }
  if (action === "account") {
    openProfile();
    return;
  }
}

async function openOrdersHistory() {
  if (!state.currentUser) {
    openAuth("login");
    return;
  }
  els.ordersHistoryModal?.classList.add("is-open");
  els.ordersHistoryModal?.setAttribute("aria-hidden", "false");
  if (els.ordersHistoryList) {
    els.ordersHistoryList.innerHTML = `<p class="orders-history-empty">Cargando tus compras...</p>`;
  }
  if (els.ordersHistoryDetail) {
    els.ordersHistoryDetail.innerHTML = `<p class="orders-history-empty">Selecciona una orden para ver el detalle.</p>`;
  }
  try {
    await fetchCurrentUserOrders();
    renderOrdersHistory();
  } catch (error) {
    if (els.ordersHistoryList) {
      els.ordersHistoryList.innerHTML = `<p class="orders-history-empty">${escapeHtml(error.message)}</p>`;
    }
  }
}

function closeOrdersHistory() {
  els.ordersHistoryModal?.classList.remove("is-open");
  els.ordersHistoryModal?.setAttribute("aria-hidden", "true");
}

async function fetchCurrentUserOrders() {
  if (!state.currentUser?.id) {
    customerOrders = [];
    return customerOrders;
  }
  const payload = await apiRequest("/api/orders");
  customerOrders = payload.orders || [];
  return customerOrders;
}

function renderOrdersHistory(selectedOrderId = customerOrders[0]?.id || "") {
  if (!els.ordersHistoryList || !els.ordersHistoryDetail) return;
  if (!customerOrders.length) {
    els.ordersHistoryList.innerHTML = `<p class="orders-history-empty">Todavía no tenés compras cerradas.</p>`;
    els.ordersHistoryDetail.innerHTML = `<p class="orders-history-empty">Cuando finalices una orden, aparecera aca con su boleta y productos.</p>`;
    return;
  }
  const selectedOrder = customerOrders.find((order) => order.id === selectedOrderId) || customerOrders[0];
  els.ordersHistoryList.innerHTML = customerOrders.map((order) => `
    <button class="orders-history-card ${order.id === selectedOrder.id ? "is-active" : ""}" type="button" data-view-order="${escapeHtml(order.id)}">
      <span>
        <strong>Boleta ${escapeHtml(order.invoiceNumber || order.id)}</strong>
        <small>${escapeHtml(order.createdAt || "")}</small>
      </span>
      <span>
        <b>${formatPrice(order.total, order.currency || DEFAULT_CURRENCY, order.currency || DEFAULT_CURRENCY)}</b>
        <em>${escapeHtml(order.status || "Pendiente")}</em>
      </span>
    </button>
  `).join("");
  els.ordersHistoryDetail.innerHTML = `
    <div class="orders-history-detail-head">
      <div>
        <span class="eyebrow">Detalle de orden</span>
        <h3>Boleta ${escapeHtml(selectedOrder.invoiceNumber || selectedOrder.id)}</h3>
      </div>
      <button class="ghost-btn" type="button" data-print-history-invoice="${escapeHtml(selectedOrder.id)}">Imprimir</button>
    </div>
    ${getOrderInvoiceMarkup(selectedOrder, { compact: true })}
  `;
  els.ordersHistoryList.querySelectorAll("[data-view-order]").forEach((button) => {
    button.addEventListener("click", () => renderOrdersHistory(button.dataset.viewOrder));
  });
  els.ordersHistoryDetail.querySelector("[data-print-history-invoice]")?.addEventListener("click", (event) => {
    printOrderInvoice(event.currentTarget.dataset.printHistoryInvoice);
  });
}

function openProfile() {
  if (!state.currentUser || !els.profileForm) return;
  fillProfileForm();
  els.profileModal?.classList.add("is-open");
  els.profileModal?.setAttribute("aria-hidden", "false");
}

function closeProfile() {
  els.profileModal?.classList.remove("is-open");
  els.profileModal?.setAttribute("aria-hidden", "true");
}

function fillProfileForm() {
  if (!els.profileForm || !state.currentUser) return;
  const user = state.users.find((item) => item.id === state.currentUser.id || item.email === state.currentUser.email || item.username === state.currentUser.username);
  const source = user || state.currentUser;
  Object.entries({
    firstName: source.firstName || source.name?.split(" ")?.[0] || "",
    lastName: source.lastName || source.name?.split(" ").slice(1).join(" ") || "",
    email: source.email || "",
    phone: source.phone || "",
    ci: source.ci || "",
    rut: source.rut || "",
    department: source.department || "",
    locality: source.locality || "",
    address: source.address || "",
    company: source.company || "",
    references: source.references || "",
  }).forEach(([key, value]) => {
    const field = els.profileForm.elements[key];
    if (!field) return;
    field.value = value;
    field.readOnly = Boolean(value);
  });
}

async function saveProfile(event) {
  event.preventDefault();
  if (!state.currentUser || !els.profileForm) return;
  const data = Object.fromEntries(new FormData(els.profileForm));
  try {
    const payload = await apiRequest(`/api/users/${encodeURIComponent(state.currentUser.id)}/profile`, {
      method: "PATCH",
      body: {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        ci: data.ci || "",
        rut: data.rut || "",
        department: data.department || "",
        locality: data.locality || "",
        address: data.address || "",
        company: data.company || "",
        references: data.references || "",
      },
    });
    mergeUserIntoState(payload.user);
  } catch (error) {
    alert(error.message);
    return;
  }
  closeProfile();
  alert("Tus datos fueron actualizados.");
}

function hydrateCheckoutFields() {
  const currentUser = state.currentUser || {};
  const isAdministrativeCheckout = ["admin", "superadmin"].includes(currentUser.role || "");
  const profileCard = document.querySelector(".checkout-card-profile");
  if (profileCard) profileCard.hidden = isAdministrativeCheckout;
  const isRegisteredCustomer = Boolean(currentUser && !["admin", "superadmin"].includes(currentUser.role || "") && (currentUser.email || currentUser.username));
  const firstName = currentUser.firstName || currentUser.name?.split(" ")?.[0] || "";
  const lastName = currentUser.lastName || currentUser.name?.split(" ").slice(1).join(" ") || "";
  setCheckoutFieldValue("checkoutName", firstName, isRegisteredCustomer && Boolean(firstName), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutLastName", lastName, isRegisteredCustomer && Boolean(lastName), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutPhone", currentUser.phone || "", isRegisteredCustomer && Boolean(currentUser.phone), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutCi", currentUser.ci || "", isRegisteredCustomer && Boolean(currentUser.ci), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutRut", currentUser.rut || "", isRegisteredCustomer && Boolean(currentUser.rut), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutDepartment", currentUser.department || "", isRegisteredCustomer && Boolean(currentUser.department), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutLocality", currentUser.locality || "", isRegisteredCustomer && Boolean(currentUser.locality), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutAddress", currentUser.address || "", isRegisteredCustomer && Boolean(currentUser.address), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutEmail", currentUser.email || "", isRegisteredCustomer && Boolean(currentUser.email), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutCompany", currentUser.company || "", isRegisteredCustomer && Boolean(currentUser.company), isRegisteredCustomer);
  setCheckoutFieldValue("checkoutReferences", currentUser.references || "", isRegisteredCustomer && Boolean(currentUser.references), isRegisteredCustomer);
  document.querySelectorAll('input[name="checkoutCurrency"]').forEach((input) => {
    input.checked = input.value === selectedCurrency;
  });
  renderCheckoutProfileSummary();
}

function setCheckoutFieldValue(fieldName, value, lockField = false, forceValue = false) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!field) return;
  if (forceValue || !field.value) field.value = value;
  field.readOnly = lockField;
  field.classList.toggle("is-readonly", lockField);
}

function renderCheckoutProfileSummary() {
  if (!els.checkoutProfileSummary) return;
  const profile = getCheckoutProfileDraft();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || state.currentUser?.name || "Cliente";
  const contact = [profile.email, profile.phone].filter(Boolean).join(" - ") || "Datos registrados";
  const documentValue = profile.rut || profile.ci || "Documento registrado";
  const address = [profile.address, profile.locality, profile.department].filter(Boolean).join(", ") || "Retiro / direccion registrada";
  els.checkoutProfileSummary.innerHTML = `
    <div><strong>${escapeHtml(fullName)}</strong><span>${escapeHtml(contact)}</span></div>
    <div><strong>${escapeHtml(documentValue)}</strong><span>${escapeHtml(address)}</span></div>
  `;
}

function getSelectedCheckoutPaymentMethodId() {
  return document.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || "";
}

function renderCheckoutPaymentMethods() {
  if (!els.checkoutPaymentMethods || !els.checkoutPaymentNote) return;
  const activeMethods = orderCheckoutPaymentMethods(getActivePaymentMethods());
  if (!activeMethods.length) {
    els.checkoutPaymentMethods.innerHTML = '<p class="empty-cart">No hay métodos de pago activos en este momento.</p>';
    els.checkoutPaymentNote.innerHTML = "";
    return;
  }
  const selectedId = getSelectedCheckoutPaymentMethodId();
  const fallbackId = activeMethods[0]?.id || "";
  const effectiveId = activeMethods.some((method) => method.id === selectedId) ? selectedId : fallbackId;
  const methodInstructions = (method) => method.id === "tarjetas"
    ? "Redirección segura a Stripe. En pruebas usá la clave sk_test; BEIM no guarda tarjetas."
    : (method.instructions || method.detail || "");
  const cardMarkup = (method) => `
    <label class="checkout-payment-card ${method.id === effectiveId ? "is-selected" : ""}">
      <input type="radio" name="checkoutPaymentMethod" value="${escapeHtml(method.id)}" ${method.id === effectiveId ? "checked" : ""}>
      <span class="payment-method-logo">${getPaymentMethodLogoMarkup(method)}</span>
      <span class="payment-method-copy">
        <strong>${escapeHtml(method.name)}</strong>
        <small>${escapeHtml(method.detail || "Método disponible")}</small>
      </span>
    </label>
  `;
  els.checkoutPaymentMethods.innerHTML = `
    <div class="checkout-payment-mancru">
      <div class="checkout-payment-mancru-head">Forma de pago</div>
      <div class="checkout-payment-list">
        ${activeMethods.map((method) => cardMarkup(method)).join("")}
      </div>
    </div>
  `;
  const selectedMethod = activeMethods.find((method) => method.id === effectiveId) || activeMethods[0];
  els.checkoutPaymentNote.innerHTML = selectedMethod
    ? `<strong>${escapeHtml(selectedMethod.name)}</strong><p>${escapeHtml(methodInstructions(selectedMethod))}</p>`
    : "";
  const receiptAllowed = selectedMethod && !["tarjetas", "efectivo-retiro"].includes(selectedMethod.id);
  if (els.checkoutPaymentReceipt) els.checkoutPaymentReceipt.hidden = !receiptAllowed;
  els.checkoutPaymentMethods.querySelectorAll('input[name="checkoutPaymentMethod"]').forEach((input) => {
    input.addEventListener("change", renderCheckout);
  });
}

function orderCheckoutPaymentMethods(methods = []) {
  return [...methods].sort((left, right) => getCheckoutPaymentRank(left) - getCheckoutPaymentRank(right) || sortBySortOrder(left, right));
}

function getCheckoutPaymentRank(method = {}) {
  if (method.id === "tarjetas") return 0;
  if (method.id === "brou") return 1;
  if (method.id === "santander") return 2;
  if (method.id === "itau") return 3;
  if (method.id === "prex") return 4;
  if (method.id === "mi-dinero") return 5;
  if (method.id === "transferencia-bancaria") return 6;
  if (method.id === "efectivo-retiro") return 7;
  if (method.id === "usdt") return 8;
  return 10;
}

function getPaymentMethodLogoMarkup(method = {}) {
  const source = PAYMENT_METHOD_ASSETS[method.id] || "";
  if (!source) return `<span>${escapeHtml((method.name || "P").slice(0, 2).toUpperCase())}</span>`;
  return `<img src="${escapeHtml(source)}" alt="${escapeHtml(method.name || "Método de pago")}">`;
}

function renderCheckout() {
  if (!els.checkoutItems) return;
  renderCheckoutProfileSummary();
  const products = Array.from(cart.values());
  const subtotal = products.reduce((sum, item) => sum + convertPrice(item.price * item.qty, item.currency, selectedCurrency), 0);
  els.checkoutItems.innerHTML = products.map((item) => {
    const product = state.products.find((entry) => entry.id === item.id);
    const imageSource = getProductImageSource(product);
    const imageMarkup = isImageSource(imageSource)
      ? `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.name)}">`
      : `<span>${escapeHtml(product?.image || getCategory(product?.category)?.code || "PR")}</span>`;
    const imageClass = isImageSource(imageSource) ? "checkout-item-media" : "checkout-item-media checkout-item-media-fallback";
    return `
      <div class="checkout-item">
        <div class="${imageClass}">${imageMarkup}</div>
        <div class="checkout-item-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(getCategoryLabel(product?.category || ""))}</span>
        </div>
        <div class="checkout-item-side">
          <div class="checkout-item-qty">
            <button type="button" data-checkout-action="minus" data-checkout-id="${escapeHtml(item.id)}">-</button>
            <strong>${item.qty}</strong>
            <button type="button" data-checkout-action="plus" data-checkout-id="${escapeHtml(item.id)}">+</button>
          </div>
          <strong>${formatPrice(item.price * item.qty, item.currency, selectedCurrency)}</strong>
        </div>
      </div>
    `;
  }).join("");
  els.checkoutSubtotal.textContent = formatPrice(subtotal, selectedCurrency, selectedCurrency);
  els.checkoutTotal.textContent = formatPrice(subtotal, selectedCurrency, selectedCurrency);
  els.checkoutFooterTotal.textContent = formatPrice(subtotal, selectedCurrency, selectedCurrency);
  renderCheckoutPaymentMethods();
  els.checkoutItems.querySelectorAll("[data-checkout-action]").forEach((button) => {
    button.addEventListener("click", () => {
      updateQuantity(button.dataset.checkoutId, button.dataset.checkoutAction);
      if (!cart.size) closeCheckout();
      else renderCheckout();
    });
  });
}

async function submitCheckout() {
  const paymentMethodId = getSelectedCheckoutPaymentMethodId();
  const profile = getCheckoutProfileDraft();
  const isAdministrativeCheckout = ["admin", "superadmin"].includes(state.currentUser?.role || "");
  if (!cart.size) {
    closeCheckout();
    return;
  }
  const missingFields = isAdministrativeCheckout ? [] : getMissingCheckoutProfileFields(profile);
  if (missingFields.length) {
    showCheckoutProfileMissingFields(missingFields);
    showUxMessage({
      title: "Faltan datos para continuar",
      message: `Completá: ${missingFields.map((field) => field.label).join(", ")}.`,
    });
    return;
  }
  clearCheckoutProfileIssues();
  if (!paymentMethodId) {
    alert("Seleccioná un método de pago para continuar.");
    return;
  }
  if (paymentMethodId === "tarjetas" && selectedCurrency === "USDT") {
    alert("Para pagar con tarjeta seleccioná UYU o USD. USDT queda disponible como método de pago separado.");
    return;
  }
  const savedProfile = await persistCheckoutProfileIfNeeded(profile);
  if (!savedProfile) return;
  setCheckoutSubmitting(true);
  const created = await createOrder();
  setCheckoutSubmitting(false);
  if (!created) return;
  if (paymentMethodId === "tarjetas") {
    await startStripeCheckout(created);
    return;
  }
  showCheckoutConfirmation(created);
}

function setCheckoutSubmitting(isSubmitting) {
  const button = document.querySelector(".checkout-continue");
  if (!button) return;
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? "Enviando orden..." : "Continuar";
}

function getCheckoutProfileDraft() {
  return {
    firstName: document.querySelector('[name="checkoutName"]')?.value.trim() || "",
    lastName: document.querySelector('[name="checkoutLastName"]')?.value.trim() || "",
    email: document.querySelector('[name="checkoutEmail"]')?.value.trim() || "",
    phone: document.querySelector('[name="checkoutPhone"]')?.value.trim() || "",
    ci: document.querySelector('[name="checkoutCi"]')?.value.trim() || "",
    rut: document.querySelector('[name="checkoutRut"]')?.value.trim() || "",
    department: document.querySelector('[name="checkoutDepartment"]')?.value.trim() || "",
    locality: document.querySelector('[name="checkoutLocality"]')?.value.trim() || "",
    address: document.querySelector('[name="checkoutAddress"]')?.value.trim() || "",
    company: document.querySelector('[name="checkoutCompany"]')?.value.trim() || "",
    references: document.querySelector('[name="checkoutReferences"]')?.value.trim() || "",
  };
}

function getMissingCheckoutProfileFields(profile) {
  const missing = REQUIRED_ORDER_PROFILE_FIELDS
    .filter((field) => !String(profile[field] || "").trim())
    .map((field) => CHECKOUT_PROFILE_FIELDS[field]);
  if (state.currentUser?.isWholesaler) {
    REQUIRED_WHOLESALE_ORDER_PROFILE_FIELDS
      .filter((field) => !String(profile[field] || "").trim())
      .forEach((field) => missing.push(CHECKOUT_PROFILE_FIELDS[field]));
  } else if (!profile.ci && !profile.rut) {
    missing.push(CHECKOUT_PROFILE_FIELDS.document);
  }
  return missing.filter(Boolean);
}

function showCheckoutProfileMissingFields(missingFields = []) {
  const profileCard = document.querySelector(".checkout-card-profile");
  profileCard?.classList.add("is-editing-profile", "has-missing-profile");
  renderCheckoutProfileMissingFields(missingFields);
  const firstEditableField = missingFields
    .flatMap((field) => field.inputs || [])
    .map((inputName) => document.querySelector(`[name="${inputName}"]`))
    .find((input) => input && !input.readOnly);
  profileCard?.scrollIntoView({ behavior: "smooth", block: "start" });
  firstEditableField?.focus({ preventScroll: true });
}

function renderCheckoutProfileMissingFields(missingFields = []) {
  clearCheckoutProfileIssues({ keepMessage: true });
  missingFields.forEach((field) => {
    (field.inputs || []).forEach((inputName) => {
      const input = document.querySelector(`[name="${inputName}"]`);
      input?.classList.add("is-missing");
      input?.setAttribute("aria-invalid", "true");
      input?.closest("label")?.classList.add("is-missing");
    });
  });
  if (els.checkoutProfileMissing) {
    els.checkoutProfileMissing.hidden = false;
    els.checkoutProfileMissing.innerHTML = `
      <strong>Faltan datos para generar la orden.</strong>
      <span>Completá los campos marcados. El RUT queda disponible para cargarlo si corresponde, pero no es obligatorio cuando ya ingresaste CI.</span>
      <ul>${missingFields.map((field) => `<li>${escapeHtml(field.label)}</li>`).join("")}</ul>
    `;
  }
}

function clearCheckoutProfileIssues({ keepMessage = false } = {}) {
  document.querySelectorAll(".checkout-form-grid .is-missing").forEach((node) => {
    node.classList.remove("is-missing");
    node.removeAttribute("aria-invalid");
  });
  if (!keepMessage && els.checkoutProfileMissing) {
    els.checkoutProfileMissing.hidden = true;
    els.checkoutProfileMissing.innerHTML = "";
    document.querySelector(".checkout-card-profile")?.classList.remove("has-missing-profile");
  }
}

function clearCheckoutProfileFieldIssue(fieldName) {
  const input = document.querySelector(`[name="${fieldName}"]`);
  input?.classList.remove("is-missing");
  input?.removeAttribute("aria-invalid");
  input?.closest("label")?.classList.remove("is-missing");
}

async function persistCheckoutProfileIfNeeded(profile) {
  if (!state.currentUser?.id || ["admin", "superadmin"].includes(state.currentUser.role || "")) return true;
  try {
    const payload = await apiRequest(`/api/users/${encodeURIComponent(state.currentUser.id)}/profile`, {
      method: "PATCH",
      body: profile,
    });
    mergeUserIntoState(payload.user);
    state.currentUser = { ...state.currentUser, ...payload.user };
    hydrateCheckoutFields();
    return true;
  } catch (error) {
    alert(error.message);
    return false;
  }
}

function updateQuantity(id, action) {
  const item = cart.get(id);
  if (!item) return;

  if (action === "remove") {
    cart.delete(id);
    dismissCartStockNotice();
    saveCart();
    renderCart();
    return;
  }

  if (action === "plus") {
    const product = state.products.find((entry) => entry.id === id);
    const availableStock = getProductAvailableStock(product);
    if (!product || availableStock <= 0) {
      cart.delete(id);
      saveCart();
      renderCart();
      return;
    }
    if (item.qty >= availableStock) {
      item.qty = availableStock;
      saveCart();
      renderCart();
      showCartStockNotice(product, availableStock);
      return;
    }
  }

  item.qty += action === "plus" ? 1 : -1;
  if (item.qty <= 0) cart.delete(id);
  dismissCartStockNotice();
  saveCart();
  renderCart();
}

function updateCheckoutLink() {
  const products = Array.from(cart.values());
  const total = products.reduce((sum, item) => sum + convertPrice(item.price * item.qty, item.currency, selectedCurrency), 0);
  const currencyLabel = getCurrencyLabel(selectedCurrency);
  const text = products.length
    ? `Hola! Quiero comprar en ${currencyLabel}:%0A${products.map((item) => `${item.qty} x ${item.name} - ${formatPrice(convertPrice(item.price * item.qty, item.currency, selectedCurrency), selectedCurrency, selectedCurrency)}`).join("%0A")}%0ATotal: ${formatPrice(total, selectedCurrency, selectedCurrency)}`
    : "Hola! Quiero hacer una compra";
  els.checkoutLink.href = "#checkout";
  els.checkoutLink.dataset.whatsappUrl = `https://wa.me/${state.settings.whatsapp}?text=${text}`;
  els.checkoutLink.classList.toggle("is-disabled", products.length === 0);
  els.checkoutLink.setAttribute("aria-disabled", products.length === 0 ? "true" : "false");
  els.checkoutLink.setAttribute("tabindex", products.length === 0 ? "-1" : "0");
}

async function createOrder() {
  const products = Array.from(cart.values());
  if (!products.length) return false;
  const canCreate = products.every((item) => {
    const product = state.products.find((entry) => entry.id === item.id);
    return product && product.stock >= item.qty;
  });
  if (!canCreate) {
    alert("Hay productos sin stock suficiente.");
    return false;
  }
  const total = products.reduce((sum, item) => sum + convertPrice(item.price * item.qty, item.currency, selectedCurrency), 0);
  const profile = getCheckoutProfileDraft();
  const administrativeRoleLabel = state.currentUser?.role === "superadmin"
    ? "Administrador principal"
    : state.currentUser?.role === "admin"
      ? "Administrador"
      : "";
  const checkoutName = administrativeRoleLabel || profile.firstName || state.currentUser?.firstName || state.currentUser?.name || "Invitado";
  const checkoutLastName = administrativeRoleLabel ? "" : profile.lastName || state.currentUser?.lastName || "";
  const checkoutEmail = administrativeRoleLabel ? "" : profile.email || state.currentUser?.email || "sin cuenta";
  const checkoutPhone = profile.phone || state.currentUser?.phone || "";
  const checkoutCi = profile.ci || state.currentUser?.ci || "";
  const checkoutRut = profile.rut || state.currentUser?.rut || "";
  const checkoutAddress = profile.address || state.currentUser?.address || "";
  const shipping = document.querySelector('input[name="checkoutShipping"]:checked')?.value || "Retiro en empresa";
  const comments = document.querySelector('[name="checkoutComments"]')?.value.trim() || "";
  const paymentMethod = getPaymentMethod(getSelectedCheckoutPaymentMethodId());
  const documentValue = checkoutRut || checkoutCi;
  const documentType = checkoutRut ? "RUT" : "CI";
  if (!paymentMethod || !paymentMethod.isActive) {
    alert("El método de pago seleccionado no está disponible.");
    return false;
  }
  const order = {
    id: `ORD-${Date.now()}`,
    firstName: checkoutName,
    lastName: checkoutLastName,
    customer: `${checkoutName} ${checkoutLastName}`.trim(),
    email: checkoutEmail,
    phone: checkoutPhone,
    ci: checkoutCi,
    rut: checkoutRut,
    documentType,
    documentValue,
    address: checkoutAddress,
    department: profile.department,
    locality: profile.locality,
    company: profile.company,
    references: profile.references,
    shipping,
    comments,
    paymentMethodId: paymentMethod.id,
    paymentMethodName: paymentMethod.name,
    paymentInstructions: paymentMethod.instructions || paymentMethod.detail || "",
    paymentReceipt: !["tarjetas", "efectivo-retiro"].includes(paymentMethod.id) ? checkoutPaymentReceipt : null,
    items: products.map((item) => ({ ...item })),
    total,
    currency: selectedCurrency,
    status: "Pendiente",
    createdAt: new Date().toLocaleString(),
  };
  try {
    const payload = await apiRequest("/api/orders", {
      method: "POST",
      body: order,
    });
    state.orders.unshift(payload.order);
    checkoutPaymentReceipt = null;
    if (els.checkoutPaymentReceiptFile) els.checkoutPaymentReceiptFile.value = "";
    if (els.checkoutPaymentReceiptStatus) els.checkoutPaymentReceiptStatus.textContent = "Podés adjuntar JPG, PNG, WEBP o PDF de hasta 5 MB.";
    (payload.products || []).forEach((updatedProduct) => {
      const index = state.products.findIndex((item) => item.id === updatedProduct.id);
      if (index >= 0) state.products[index] = updatedProduct;
    });
    cart = new Map();
    saveCart();
    saveState();
    renderStore();
    renderCart();
    updateOrdersFloat();
    if (["admin", "superadmin"].includes(state.currentUser?.role)) {
      await syncOrdersFromApi(false);
    }
    renderAdmin();
    closeCart();
    return payload.order;
  } catch (error) {
    alert(error.message);
    return false;
  }
}

async function startStripeCheckout(order) {
  try {
    const payload = await apiRequest("/api/stripe/checkout-session", {
      method: "POST",
      body: { orderId: order.id },
    });
    if (!payload.checkoutUrl) {
      throw new Error("Stripe no devolvio una URL de pago.");
    }
    window.location.href = payload.checkoutUrl;
  } catch (error) {
    alert(error.message);
    showCheckoutConfirmation(order);
  }
}

function showCheckoutConfirmation(order) {
  if (!order || !els.checkoutConfirmation) return;
  document.querySelector(".checkout-body")?.setAttribute("hidden", "");
  document.querySelector(".checkout-footer")?.setAttribute("hidden", "");
  els.checkoutConfirmation.hidden = false;
  els.checkoutConfirmation.innerHTML = `
    <div class="checkout-success-head">
      <span>Pedido confirmado</span>
      <h2>Boleta ${escapeHtml(order.invoiceNumber || order.id)}</h2>
      <p>Tu orden fue generada correctamente y ya quedó disponible para administración. Conservá este número para seguimiento.</p>
    </div>
    ${getOrderInvoiceMarkup(order, { compact: true })}
    <div class="checkout-success-actions">
      <button class="primary-btn" type="button" data-confirmation-print="${escapeHtml(order.id)}">Imprimir boleta</button>
      <button class="ghost-btn" type="button" data-confirmation-close>Cerrar</button>
    </div>
  `;
  els.checkoutConfirmation.querySelector("[data-confirmation-print]")?.addEventListener("click", () => printOrderInvoice(order.id));
  els.checkoutConfirmation.querySelector("[data-confirmation-close]")?.addEventListener("click", closeCheckout);
}

function resetCheckoutConfirmation() {
  if (els.checkoutConfirmation) {
    els.checkoutConfirmation.hidden = true;
    els.checkoutConfirmation.innerHTML = "";
  }
  document.querySelector(".checkout-body")?.removeAttribute("hidden");
  document.querySelector(".checkout-footer")?.removeAttribute("hidden");
}

function openAuth(tab) {
  setAuthTab(tab);
  hydrateRememberedLogin();
  els.authModal?.classList.add("is-open");
  els.authModal?.setAttribute("aria-hidden", "false");
}

function closeAuth() {
  els.authModal?.classList.remove("is-open");
  els.authModal?.setAttribute("aria-hidden", "true");
}

function setAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  document.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.classList.toggle("active", form.dataset.authForm === tab);
  });
  renderGoogleButtons();
}

async function handleAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const type = form.dataset.authForm;
  const data = Object.fromEntries(new FormData(form));

  if (type === "register") {
    try {
      const payload = await apiRequest("/api/auth/register", {
        method: "POST",
        includeActor: false,
        body: data,
      });
      mergeUserIntoState(payload.user);
      form.reset();
      setAuthTab("login");
      alert(payload.message || "Registro enviado correctamente.");
      if (["admin", "superadmin"].includes(state.currentUser?.role)) {
        await syncUsersFromApi(false);
        renderAdmin();
      }
      return;
    } catch (error) {
      alert(error.message);
      return;
    }
  } else {
    try {
      const payload = await apiRequest("/api/auth/login", {
        method: "POST",
        includeActor: false,
        body: {
          username: data.username,
          password: data.password,
        },
      });
      persistRememberedLogin({
        username: data.username,
        password: data.password,
        rememberPassword: data.rememberPassword === "yes",
      });
      saveCart();
      state.currentUser = payload.user;
      mergeUserIntoState(payload.user);
      loadActiveCart();
    } catch (error) {
      alert(error.message);
      return;
    }
  }

  saveState();
  renderSessionSensitiveViews();
  closeAuth();
  if (["admin", "superadmin"].includes(state.currentUser.role)) {
    await syncUsersFromApi(false);
    await syncOrdersFromApi(false);
    renderAdmin();
  }
  form.reset();
}

function initGoogleAuth() {
  if (!GOOGLE_CLIENT_ID) {
    renderGoogleButtons();
    return;
  }
  let attempts = 0;
  const setup = () => {
    attempts += 1;
    if (!window.google?.accounts?.id) {
      if (attempts < 40) window.setTimeout(setup, 150);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    renderGoogleButtons();
  };
  setup();
}

function renderGoogleButtons() {
  document.querySelectorAll("[data-google-auth-button]").forEach((target) => {
    target.innerHTML = "";
    if (!GOOGLE_CLIENT_ID) {
      target.innerHTML = '<button class="google-auth-btn" type="button" data-google-auth><span class="google-auth-icon" aria-hidden="true">G</span><span>Google</span></button>';
      target.querySelector("[data-google-auth]")?.addEventListener("click", handleGoogleLogin);
      return;
    }
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(target, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: Math.min(340, target.clientWidth || 320),
      text: "continue_with",
      locale: "es",
    });
  });
}

function handleGoogleLogin() {
  if (!GOOGLE_CLIENT_ID) {
    alert("Google Login no está configurado. Agregá GOOGLE_CLIENT_ID en el archivo .env del servidor y reiniciá BEIM.");
    return;
  }
  if (!window.google?.accounts?.id) {
    alert("Google todavía no terminó de cargar. Intentá de nuevo en unos segundos.");
    return;
  }
  window.google.accounts.id.prompt();
}

function initFacebookAuth() {
  if (!FACEBOOK_APP_ID) return;
  let attempts = 0;
  const setup = () => {
    attempts += 1;
    if (!window.FB) {
      if (attempts < 40) window.setTimeout(setup, 150);
      return;
    }
    window.FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: false,
      version: "v20.0",
    });
  };
  setup();
}

function handleSocialAuthSuccess(user) {
  saveCart();
  state.currentUser = user;
  mergeUserIntoState(user);
  loadActiveCart();
  saveState();
  renderSessionSensitiveViews();
  closeAuth();
  if (["admin", "superadmin"].includes(state.currentUser.role)) {
    return Promise.all([syncUsersFromApi(false), syncOrdersFromApi(false)]).then(() => renderAdmin());
  }
  return Promise.resolve();
}

async function handleGoogleCredential(response) {
  const credential = String(response?.credential || "");
  if (!credential) {
    alert("No se pudo obtener la credencial de Google.");
    return;
  }
  try {
    const payload = await apiRequest("/api/auth/google", {
      method: "POST",
      includeActor: false,
      body: { credential },
    });
    await handleSocialAuthSuccess(payload.user);
  } catch (error) {
    alert(error.message);
  }
}

function handleFacebookLogin() {
  if (!FACEBOOK_APP_ID) {
    alert("Facebook Login no está configurado. Agregá FACEBOOK_APP_ID en el archivo .env del servidor y reiniciá BEIM.");
    return;
  }
  if (!window.FB) {
    alert("Facebook todavía no terminó de cargar. Intentá de nuevo en unos segundos.");
    return;
  }
  window.FB.login(async (response) => {
    const accessToken = response?.authResponse?.accessToken;
    if (!accessToken) return;
    try {
      const payload = await apiRequest("/api/auth/facebook", {
        method: "POST",
        includeActor: false,
        body: { accessToken },
      });
      await handleSocialAuthSuccess(payload.user);
    } catch (error) {
      alert(error.message);
    }
  }, { scope: "public_profile,email" });
}

function hydrateRememberedLogin() {
  const loginForm = document.querySelector('[data-auth-form="login"]');
  if (!loginForm) return;
  const remembered = readRememberedLogin();
  loginForm.elements.username.value = remembered?.username || "";
  loginForm.elements.password.value = remembered?.password || "";
  if (loginForm.elements.rememberPassword) {
    loginForm.elements.rememberPassword.checked = Boolean(remembered?.rememberPassword);
  }
}

function readRememberedLogin() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistRememberedLogin(payload) {
  if (!payload.rememberPassword) {
    localStorage.removeItem(REMEMBER_KEY);
    return;
  }
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({
    username: payload.username,
    password: payload.password,
    rememberPassword: true,
  }));
}

function renderSession() {
  const loginBtn = document.querySelector(".login-btn");
  const accountMenuName = document.querySelector("#account-menu-name");
  const accountMenuRole = document.querySelector("#account-menu-role");
  if (!state.currentUser) {
    loginBtn.textContent = "Iniciar sesión";
    loginBtn.classList.remove("is-user");
    syncAccountMenuActions();
    closeAccountMenu();
    stopOrdersPolling();
    updateOrdersFloat();
    return;
  }
  const displayName = state.currentUser.firstName
    || state.currentUser.name?.split(" ")?.[0]
    || state.currentUser.username?.split("@")?.[0]
    || "Mi cuenta";
  loginBtn.textContent = displayName;
  loginBtn.classList.add("is-user");
  syncAccountMenuActions();
  if (accountMenuName) accountMenuName.textContent = state.currentUser.name || displayName;
  if (accountMenuRole) {
    accountMenuRole.textContent = state.currentUser.role === "cliente"
      ? state.currentUser.isWholesaler ? "Cliente mayorista" : "Cliente habilitado"
      : "Administrador";
  }
  if (["admin", "superadmin"].includes(state.currentUser.role)) startOrdersPolling();
  else stopOrdersPolling();
  updateOrdersFloat();
}

function logout() {
  saveCart();
  state.currentUser = null;
  saveState();
  loadActiveCart();
  syncAccountMenuActions();
  closeAccountMenu();
  renderSessionSensitiveViews();
  closeAdmin();
  stopOrdersPolling();
  updateOrdersFloat();
}

function syncAccountMenuActions() {
  const adminMenuAction = document.querySelector('[data-account-action="admin"]');
  if (!adminMenuAction) return;
  const canManage = ["admin", "superadmin"].includes(state.currentUser?.role || "");
  adminMenuAction.hidden = !canManage;
  adminMenuAction.disabled = !canManage;
  adminMenuAction.setAttribute("aria-hidden", canManage ? "false" : "true");
  adminMenuAction.tabIndex = canManage ? 0 : -1;
  adminMenuAction.style.display = canManage ? "" : "none";
}

async function openAdmin() {
  if (!["admin", "superadmin"].includes(state.currentUser?.role)) return;
  await syncUsersFromApi(false);
  await syncOrdersFromApi(false);
  markOrdersAsSeen();
  renderAdmin();
  els.adminPanel?.classList.add("is-open");
  els.adminPanel?.setAttribute("aria-hidden", "false");
}

function closeAdmin() {
  els.adminPanel?.classList.remove("is-open");
  els.adminPanel?.setAttribute("aria-hidden", "true");
}

function setAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
  document.querySelectorAll(".admin-view").forEach((view) => view.classList.toggle("active", view.dataset.adminView === tab));
  if (tab === "orders") markOrdersAsSeen();
}

function renderAdmin() {
  renderProductCategoryOptions();
  renderProductBrandOptions();
  renderCategoryParentOptions();
  syncPaymentMethodsAdminAccess();
  renderProductsTable();
  renderCategoriesTable();
  renderOrdersTable();
  renderUsersTable();
  fillSettingsForm();
  renderPaymentMethodsTable();
  renderPromoSlideList();
  renderPromoTable();
  ensurePromoEditorState();
}

function syncPaymentMethodsAdminAccess() {
  const canManagePayments = isSuperAdminSession();
  if (els.adminPaymentsTab) {
    els.adminPaymentsTab.hidden = !canManagePayments;
  }
  if (els.paymentMethodsSection) {
    els.paymentMethodsSection.hidden = !canManagePayments;
  }
  if (els.paymentMethodForm) {
    els.paymentMethodForm.querySelectorAll("input, textarea, select, button").forEach((field) => {
      field.disabled = !canManagePayments;
    });
  }
  const activePaymentsView = document.querySelector('.admin-view.active[data-admin-view="payments"]');
  if (!canManagePayments && activePaymentsView) setAdminTab("settings");
}

function getVisibleUsersForAdmin() {
  const currentRole = state.currentUser?.role || "";
  return state.users.filter((user) => {
    if (currentRole === "admin" && user.role === "superadmin") return false;
    return true;
  });
}

function getUserRoleLabel(role) {
  if (role === "superadmin") return "Administrador principal";
  if (role === "admin") return "Administrador";
  return "Cliente";
}

function getUserDocumentLabel(user) {
  if (user.rut) return `RUT: ${user.rut}`;
  if (user.ci) return `CI: ${user.ci}`;
  return "-";
}

function renderUsersTable() {
  if (!els.usersTable) return;
  const visibleUsers = getVisibleUsersForAdmin();
  const customerUsers = visibleUsers.filter((user) => user.role === "cliente");
  const pendingUsers = customerUsers.filter((user) => !user.isApproved).length;
  const approvedUsers = customerUsers.filter((user) => user.isApproved).length;
  const wholesalerUsers = customerUsers.filter((user) => user.isApproved && user.isWholesaler).length;
  els.usersTable.innerHTML = `
    <div class="admin-stats-grid">
      <article class="admin-stat-card">
        <span>Clientes</span>
        <strong>${customerUsers.length}</strong>
      </article>
      <article class="admin-stat-card">
        <span>Pendientes</span>
        <strong>${pendingUsers}</strong>
      </article>
      <article class="admin-stat-card">
        <span>Habilitados</span>
        <strong>${approvedUsers}</strong>
      </article>
      <article class="admin-stat-card">
        <span>Mayoristas</span>
        <strong>${wholesalerUsers}</strong>
      </article>
    </div>
    <table>
      <thead><tr><th>Usuario</th><th>Rol</th><th>Contacto</th><th>Documento</th><th>Permisos</th><th>Acciones</th></tr></thead>
      <tbody>
        ${visibleUsers.map((user) => {
          const canToggleWholesale = user.role === "cliente";
          const canToggleApproval = user.role === "cliente";
          const canAssignCommercialType = canToggleWholesale && user.isApproved;
          return `
            <tr>
              <td>${escapeHtml(user.name || user.username || user.email || "Usuario")}<br><small>${escapeHtml(user.username || user.email || "-")}</small></td>
              <td><span class="type-pill ${user.role === "superadmin" ? "is-role-principal" : user.role === "admin" ? "is-role-admin" : "is-role-client"}">${escapeHtml(getUserRoleLabel(user.role))}</span></td>
              <td>${escapeHtml(user.email || "-")}<br><small>${escapeHtml(user.phone || "Sin teléfono")}</small></td>
              <td>${escapeHtml(getUserDocumentLabel(user))}</td>
              <td>
                <div class="user-status-stack">
                  <span class="type-pill ${user.isApproved ? "is-approved" : "is-pending"}">${user.isApproved ? "Habilitado" : "Pendiente"}</span>
                  <span class="type-pill ${!user.isApproved ? "is-awaiting-type" : user.isWholesaler ? "is-wholesaler" : "is-retail"}">${!user.isApproved ? "Por definir" : user.isWholesaler ? "Mayorista" : "Minorista"}</span>
                </div>
              </td>
              <td>
                <div class="table-actions">
                  ${user.role === "cliente"
                    ? `<button type="button" data-edit-user-profile="${escapeHtml(user.id)}">Editar datos</button>`
                    : ""}
                  ${canToggleApproval
                    ? `<button type="button" data-toggle-approval="${escapeHtml(user.id)}">${user.isApproved ? "Quitar acceso" : "Dar acceso"}</button>`
                    : ""}
                  ${canToggleWholesale
                    ? `<button type="button" data-toggle-wholesale="${escapeHtml(user.id)}" ${canAssignCommercialType ? "" : "disabled"}>${canAssignCommercialType ? user.isWholesaler ? "Pasar a minorista" : "Pasar a mayorista" : "Aceptar primero"}</button>`
                    : `<button type="button" disabled>No aplica</button>`}
                </div>
              </td>
            </tr>
          `;
        }).join("") || `<tr><td colspan="6">No hay usuarios registrados todavía.</td></tr>`}
      </tbody>
    </table>
  `;
  els.usersTable.querySelectorAll("[data-toggle-wholesale]").forEach((button) => {
    button.addEventListener("click", () => toggleWholesalePermission(button.dataset.toggleWholesale));
  });
  els.usersTable.querySelectorAll("[data-toggle-approval]").forEach((button) => {
    button.addEventListener("click", () => toggleUserApproval(button.dataset.toggleApproval));
  });
  els.usersTable.querySelectorAll("[data-edit-user-profile]").forEach((button) => {
    button.addEventListener("click", () => editUserProfileForAdmin(button.dataset.editUserProfile));
  });
}

async function editUserProfileForAdmin(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user || user.role !== "cliente") return;
  const fields = [
    ["firstName", "Nombre"],
    ["lastName", "Apellido"],
    ["email", "Email"],
    ["phone", "Teléfono"],
    ["ci", "CI"],
    ["rut", "RUT"],
    ["department", "Departamento"],
    ["locality", "Localidad"],
    ["address", "Dirección"],
    ["company", "Razon social"],
    ["references", "Referencias comerciales"],
  ];
  const body = {};
  for (const [key, label] of fields) {
    const nextValue = prompt(label, user[key] || "");
    if (nextValue === null) return;
    body[key] = nextValue.trim();
  }
  try {
    const payload = await apiRequest(`/api/users/${encodeURIComponent(userId)}/profile`, {
      method: "PATCH",
      body,
    });
    mergeUserIntoState(payload.user);
    renderAdmin();
  } catch (error) {
    alert(error.message);
  }
}

async function toggleWholesalePermission(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user || user.role !== "cliente") return;
  try {
    const payload = await apiRequest(`/api/users/${encodeURIComponent(userId)}/wholesale`, {
      method: "PATCH",
      body: {
        isWholesaler: !user.isWholesaler,
      },
    });
    mergeUserIntoState(payload.user);
    renderAdmin();
  } catch (error) {
    alert(error.message);
  }
}

async function toggleUserApproval(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user || user.role !== "cliente") return;
  try {
    const payload = await apiRequest(`/api/users/${encodeURIComponent(userId)}/approval`, {
      method: "PATCH",
      body: {
        isApproved: !user.isApproved,
      },
    });
    mergeUserIntoState(payload.user);
    renderAdmin();
  } catch (error) {
    alert(error.message);
  }
}

function renderProductCategoryOptions(selectedCategory = "") {
  const select = els.productForm?.elements.category;
  if (!select) return;
  const subcategories = state.categories.filter((category) => category.parentId);
  const categories = subcategories.length ? subcategories : state.categories;
  const savedCategory = localStorage.getItem("beim-admin-last-product-category") || "";
  const validSavedCategory = categories.some((category) => category.id === savedCategory) ? savedCategory : "";
  const currentCategory = selectedCategory || validSavedCategory || select.value || categories[0]?.id || "";
  const options = [...categories];
  if (currentCategory && !options.some((category) => category.id === currentCategory)) {
    const fallbackCategory = getCategory(currentCategory);
    if (fallbackCategory) options.push(fallbackCategory);
  }
  select.innerHTML = options.map((category) => `<option value="${category.id}" ${category.id === currentCategory ? "selected" : ""}>${escapeHtml(getCategoryLabel(category.id))}</option>`).join("");
}

function renderProductBrandOptions(selectedBrand = "") {
  const select = els.productForm?.elements.brand;
  if (!select) return;
  const brands = getProductBrands();
  const currentBrand = selectedBrand || select.value || brands[0] || "";
  select.innerHTML = brands.map((brand) => `<option value="${escapeHtml(brand)}" ${brand === currentBrand ? "selected" : ""}>${escapeHtml(brand)}</option>`).join("");
}

function openProductEditorModal(title = "Añadir producto") {
  if (!els.adminProductModal) return;
  if (els.adminProductModalTitle) els.adminProductModalTitle.textContent = title;
  renderProductImagePreview();
  els.adminProductModal.classList.add("is-open");
  els.adminProductModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => els.productForm?.elements.brand?.focus(), 0);
}

function closeProductEditorModal() {
  els.adminProductModal?.classList.remove("is-open");
  els.adminProductModal?.setAttribute("aria-hidden", "true");
}

function openNewProductModal() {
  resetProductForm();
  openProductEditorModal("Añadir producto");
}

function renderCategoryParentOptions() {
  const select = els.categoryForm?.elements.parentId;
  if (!select) return;
  const currentId = els.categoryForm.elements.id.value;
  select.innerHTML = `<option value="">Categoría principal</option>${getTopCategories()
    .filter((category) => category.id !== currentId)
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("")}`;
}

function renderProductsTable() {
  const filteredProducts = state.products.filter((product) => {
    const categoryLabel = getCategoryLabel(product.category);
    const haystack = [
      product.name,
      product.brand,
      product.model,
      product.color,
      product.description,
      String(product.productCode || ""),
      formatProductCode(product.productCode),
      categoryLabel,
      product.badge,
    ].join(" ").toLowerCase();
    return !adminProductSearch || haystack.includes(adminProductSearch);
  }).sort(compareProductsByBrandAndModel);
  document.querySelector("#products-table").innerHTML = `
    <table>
      <thead><tr><th>Producto</th><th>Marca / modelo</th><th>Venta</th><th>Acciones</th></tr></thead>
      <tbody>
        ${filteredProducts.map((product) => `
          <tr class="admin-product-row" data-edit-product-row="${escapeHtml(product.id)}" title="Doble clic para editar">
            <td>
              <strong>${escapeHtml(product.name)}</strong>
              <small>Cod. ${escapeHtml(formatProductCode(product.productCode))} · ${escapeHtml(getCategoryLabel(product.category) || product.category)}</small>
            </td>
            <td>
              <strong>${escapeHtml(product.brand || "-")}</strong>
              <small>${escapeHtml(product.model || "-")} · ${escapeHtml(getProductColorLabel(product))}</small>
            </td>
            <td>
              <strong>${formatPrice(product.price, product.currency, product.currency || DEFAULT_CURRENCY)}</strong>
              <small>${escapeHtml(product.currency || DEFAULT_CURRENCY)} · Stock ${escapeHtml(String(product.stock))} · ${escapeHtml(product.badge)}</small>
            </td>
            <td><div class="table-actions"><button data-edit-product="${product.id}">Editar</button><button class="danger" data-delete-product="${product.id}">Eliminar</button></div></td>
          </tr>
        `).join("") || `<tr><td colspan="4">No encontramos productos con esa búsqueda.</td></tr>`}
      </tbody>
    </table>
  `;
  document.querySelectorAll("[data-edit-product-row]").forEach((row) => {
    row.addEventListener("dblclick", (event) => {
      if (event.target.closest("button")) return;
      editProduct(row.dataset.editProductRow);
    });
  });
  document.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => editProduct(button.dataset.editProduct)));
  document.querySelectorAll("[data-delete-product]").forEach((button) => button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct)));
}

async function saveProduct(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.productForm));
  const brand = ensureProductBrand(data.brand || data.brandCustom);
  const model = String(data.model || "").trim();
  const name = getProductDisplayName(data.category, brand, model, data.name);
  const color = String(data.color || "").trim();
  const isEditing = Boolean(data.id);
  const matchingVariants = isEditing ? [] : findMatchingProductVariants({ brand, model, color, category: data.category });
  const mergeTarget = matchingVariants[0] || null;
  const addedStock = Number(data.stock);
  const previousStock = matchingVariants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const product = {
    id: data.id || mergeTarget?.id || createProductVariantId(name, color, data.category),
    name,
    category: data.category,
    brand,
    model,
    color,
    costPrice: Number(data.costPrice),
    price: Number(data.price),
    currency: data.currency || DEFAULT_CURRENCY,
    stock: mergeTarget ? previousStock + addedStock : addedStock,
    badge: data.badge,
    image: data.image || "PR",
    description: data.description || "",
  };
  try {
    const shouldUpdate = isEditing || Boolean(mergeTarget);
    const targetId = data.id || mergeTarget?.id;
    const endpoint = shouldUpdate ? `/api/products/${encodeURIComponent(targetId)}` : "/api/products";
    const method = shouldUpdate ? "PUT" : "POST";
    const payload = await apiRequest(endpoint, { method, body: product });
    const savedProduct = payload.product;
    if (matchingVariants.length > 1) {
      await Promise.all(matchingVariants.slice(1).map((item) => apiRequest(`/api/products/${encodeURIComponent(item.id)}`, { method: "DELETE" })));
      const duplicateIds = new Set(matchingVariants.slice(1).map((item) => item.id));
      state.products = state.products.filter((item) => !duplicateIds.has(item.id));
    }
    localStorage.setItem("beim-admin-last-product-category", data.category);
    const index = state.products.findIndex((item) => item.id === data.id || item.id === savedProduct.id);
    if (index >= 0) state.products[index] = savedProduct;
    else state.products.push(savedProduct);
    await persistStoreSettings();
  } catch (error) {
    const isDuplicate = /duplicada|duplicate|products_pkey|unicidad/i.test(error.message || "");
    showUxMessage({
      title: isDuplicate ? "Este producto ya está registrado" : "No pudimos guardar el producto",
      message: isDuplicate
        ? "Ya existe un producto con esa misma variante. Revisá la marca, el modelo y el color antes de volver a guardar."
        : (error.message || "Revisá los datos e intentá nuevamente."),
    });
    return;
  }
  resetProductForm();
  closeProductEditorModal();
  renderStore();
  renderAdmin();
  if (mergeTarget) {
    showUxMessage({
      title: "Stock actualizado",
      message: `${name}${color ? ` · ${color}` : ""}: ${previousStock} + ${addedStock} = ${product.stock} unidades.`,
    });
  }
}

function getProductColorLabel(product) {
  const color = String(product?.color || "").trim();
  return color ? `Color: ${color}` : "Color: Sin especificar";
}

function findMatchingProductVariants({ brand, model, color, category }) {
  const key = [brand, model, color || "", category].map(normalizeSearchText).join("|");
  return state.products.filter((product) => {
    return [product.brand, product.model, product.color || "", product.category].map(normalizeSearchText).join("|") === key;
  });
}

async function handleCheckoutPaymentReceipt(event) {
  const file = event.target.files?.[0];
  checkoutPaymentReceipt = null;
  if (!file) {
    if (els.checkoutPaymentReceiptStatus) els.checkoutPaymentReceiptStatus.textContent = "Podés adjuntar JPG, PNG, WEBP o PDF de hasta 5 MB.";
    return;
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    event.target.value = "";
    alert("El comprobante debe ser JPG, PNG, WEBP o PDF.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    event.target.value = "";
    alert("El comprobante no puede superar los 5 MB.");
    return;
  }
  checkoutPaymentReceipt = {
    data: await readFileAsBase64(file),
    mimeType: file.type,
    fileName: file.name,
  };
  if (els.checkoutPaymentReceiptStatus) els.checkoutPaymentReceiptStatus.textContent = `Adjunto: ${file.name}`;
}

async function consolidateDuplicateProductVariants() {
  if (!["admin", "superadmin"].includes(state.currentUser?.role)) return;
  const groups = new Map();
  state.products.forEach((product) => {
    const key = [product.brand, product.model, product.color || "", product.category].map(normalizeSearchText).join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });
  for (const variants of groups.values()) {
    if (variants.length < 2) continue;
    const [primary, ...duplicates] = variants;
    const merged = { ...primary, stock: variants.reduce((sum, item) => sum + Number(item.stock || 0), 0) };
    try {
      const payload = await apiRequest(`/api/products/${encodeURIComponent(primary.id)}`, { method: "PUT", body: merged });
      for (const duplicate of duplicates) {
        await apiRequest(`/api/products/${encodeURIComponent(duplicate.id)}`, { method: "DELETE" });
      }
      const removedIds = new Set(duplicates.map((item) => item.id));
      state.products = state.products.filter((item) => !removedIds.has(item.id));
      const primaryIndex = state.products.findIndex((item) => item.id === primary.id);
      if (primaryIndex >= 0) state.products[primaryIndex] = payload.product;
    } catch (error) {
      console.warn("No se pudieron consolidar variantes duplicadas.", error);
    }
  }
}

function createProductVariantId(name, color, category) {
  const baseId = slugify([name, color || "sin-color", category].filter(Boolean).join(" "));
  let candidate = baseId;
  let suffix = 2;
  while (state.products.some((product) => product.id === candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

let uxMessageReturnFocus = null;
let uxConfirmResolve = null;
let uxConfirmReturnFocus = null;

function installUxAlerts() {
  window.alert = (message) => showUxMessage({ title: "Atención", message: String(message || "") });
}

function showUxMessage({ title, message } = {}) {
  const modal = document.querySelector("#ux-message-modal");
  if (!modal) return;
  uxMessageReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titleNode = modal.querySelector("#ux-message-title");
  const textNode = modal.querySelector("#ux-message-text");
  if (titleNode) titleNode.textContent = title || "No pudimos completar la acción";
  if (textNode) textNode.textContent = message || "Revisá los datos e intentá nuevamente.";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  modal.querySelector(".ux-message-confirm")?.focus();
}

function closeUxMessage() {
  const modal = document.querySelector("#ux-message-modal");
  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  uxMessageReturnFocus?.focus?.();
  uxMessageReturnFocus = null;
}

function showUxConfirm({ title = "Confirmar acción", message = "", acceptLabel = "Confirmar" } = {}) {
  const modal = document.querySelector("#ux-confirm-modal");
  if (!modal) return Promise.resolve(false);
  uxConfirmReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.querySelector("#ux-confirm-title").textContent = title;
  modal.querySelector("#ux-confirm-text").textContent = message;
  modal.querySelector(".ux-confirm-accept").textContent = acceptLabel;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  modal.querySelector(".ux-confirm-accept")?.focus();
  return new Promise((resolve) => {
    uxConfirmResolve = resolve;
  });
}

function closeUxConfirm(confirmed = false) {
  const modal = document.querySelector("#ux-confirm-modal");
  if (!modal?.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  const resolve = uxConfirmResolve;
  uxConfirmResolve = null;
  resolve?.(confirmed);
  uxConfirmReturnFocus?.focus?.();
  uxConfirmReturnFocus = null;
}

function editProduct(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;
  renderProductCategoryOptions(product.category || "");
  renderProductBrandOptions(product.brand || "");
  Object.entries(product).forEach(([key, value]) => {
    if (els.productForm.elements[key]) els.productForm.elements[key].value = value;
  });
  if (els.productForm.elements.brandCustom) els.productForm.elements.brandCustom.value = "";
  openProductEditorModal("Editar producto");
}

async function deleteProduct(id) {
  try {
    await apiRequest(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    alert(error.message);
    return;
  }
  state.products = state.products.filter((item) => item.id !== id);
  saveState();
  renderStore();
  renderAdmin();
}

function resetProductForm() {
  els.productForm.reset();
  els.productForm.elements.id.value = "";
  renderProductCategoryOptions();
  renderProductBrandOptions();
  renderProductImagePreview();
  if (els.adminProductModalTitle) els.adminProductModalTitle.textContent = "Añadir producto";
}

async function handleAddCustomBrand() {
  const input = els.productForm?.elements.brandCustom;
  const select = els.productForm?.elements.brand;
  if (!input || !select) return;
  const brand = ensureProductBrand(input.value);
  if (!brand) return;
  renderProductBrandOptions(brand);
  select.value = brand;
  input.value = "";
  await persistProductBrands();
}

async function handleEditSelectedBrand() {
  const select = els.productForm?.elements.brand;
  if (!select?.value) return;
  const currentBrand = select.value;
  const nextBrand = prompt("Nuevo nombre para la marca:", currentBrand);
  if (nextBrand === null) return;
  const cleanBrand = nextBrand.trim();
  if (!cleanBrand) {
    alert("La marca no puede quedar vacia.");
    return;
  }
  const brands = getProductBrands();
  const duplicated = brands.some((brand) => brand.toLowerCase() === cleanBrand.toLowerCase() && brand.toLowerCase() !== currentBrand.toLowerCase());
  if (duplicated) {
    alert("Ya existe una marca con ese nombre.");
    return;
  }
  state.settings.productBrands = brands.map((brand) => brand === currentBrand ? cleanBrand : brand);
  renderProductBrandOptions(cleanBrand);
  select.value = cleanBrand;
  await persistProductBrands();
}

async function handleDeleteSelectedBrand() {
  const select = els.productForm?.elements.brand;
  if (!select?.value) return;
  const currentBrand = select.value;
  const inUse = state.products.some((product) => String(product.brand || "").toLowerCase() === currentBrand.toLowerCase());
  const message = inUse
    ? `La marca "${currentBrand}" está usada por productos existentes. Se quitará de la lista para nuevos productos, pero esos productos conservarán su marca.`
    : `¿Querés quitar la marca "${currentBrand}" de la lista?`;
  if (!await showUxConfirm({ title: "Quitar marca", message, acceptLabel: "Quitar marca" })) return;
  state.settings.productBrands = getProductBrands().filter((brand) => brand !== currentBrand);
  const nextBrand = state.settings.productBrands[0] || "";
  renderProductBrandOptions(nextBrand);
  select.value = nextBrand;
  await persistProductBrands();
}

async function handleProductImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !els.productForm?.elements.image) return;
  try {
    els.productForm.elements.image.value = "Cargando imagen...";
    renderProductImagePreview();
    const upload = await uploadProductImageFile(file);
    els.productForm.elements.image.value = upload.image;
    renderProductImagePreview();
  } catch (error) {
    els.productForm.elements.image.value = "";
    renderProductImagePreview();
    alert(`No se pudo cargar la imagen: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const commaIndex = dataUrl.indexOf(",");
      if (commaIndex < 0) {
        reject(new Error("imagen sin datos base64"));
        return;
      }
      resolve(dataUrl.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(new Error("archivo no legible"));
    reader.readAsDataURL(file);
  });
}

async function uploadProductImageFile(file) {
  const mimeType = getImageMimeType(file);
  if (!mimeType) throw new Error("Seleccioná una imagen JPG, PNG, WEBP, GIF, AVIF o SVG.");
  const url = new URL("/api/uploads/product-image", API_BASE_URL || window.location.origin);
  if (state.currentUser?.id) {
    url.searchParams.set("actorId", state.currentUser.id);
  }
  const form = new FormData();
  form.append("image", file, file.name || "producto");
  form.append("mimeType", mimeType);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || "No se pudo cargar la imagen.");
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("La carga de la imagen tardo demasiado.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function getImageMimeType(file) {
  const explicitType = String(file?.type || "").toLowerCase();
  if (["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/x-png", "image/webp", "image/gif", "image/avif", "image/svg+xml"].includes(explicitType)) {
    return explicitType;
  }
  const extension = String(file?.name || "").split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg" || extension === "jfif") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";
  if (extension === "svg") return "image/svg+xml";
  return "";
}

function getProductDraftFromForm() {
  if (!els.productForm) return {};
  const form = els.productForm.elements;
  const brand = form.brand?.value || form.brandCustom?.value || "";
  const model = form.model?.value || "";
  const category = form.category?.value || "";
  return {
    name: getProductDisplayName(category, brand, model, ""),
    category,
    brand,
    model,
    image: form.image?.value || "",
  };
}

function renderProductImagePreview() {
  if (!els.productImagePreviewFrame) return;
  const product = getProductDraftFromForm();
  const imageSource = getProductImageSource(product);
  const isImage = isImageSource(imageSource);
  els.productImagePreviewFrame.classList.toggle("is-fallback", !isImage);
  els.productImagePreviewFrame.innerHTML = getProductImageMarkup(product, { fallbackClass: "product-image-preview-fallback" });
}

function renderCategoriesTable() {
  const orderedCategories = [...state.categories].sort((left, right) => {
    const parentDelta = String(left.parentId || "").localeCompare(String(right.parentId || ""), "es");
    if (parentDelta !== 0) return parentDelta;
    return sortCategoriesByOrder(left, right);
  }).filter((category) => {
    if (!adminCategorySearch) return true;
    const haystack = [
      category.name,
      category.code,
      category.description,
      category.id,
      category.parentId,
      getCategoryLabel(category.id),
      category.parentId ? getCategoryLabel(category.parentId) : "principal",
    ].join(" ").toLowerCase();
    return haystack.includes(adminCategorySearch);
  });
  document.querySelector("#categories-table").innerHTML = `
    <table>
      <thead><tr><th>Categoría</th><th>Tipo</th><th>Orden</th><th>Sigla</th><th>Descripción</th><th>Acciones</th></tr></thead>
      <tbody>
        ${orderedCategories.map((category) => `
          <tr>
            <td>${escapeHtml(getCategoryLabel(category.id))}</td>
            <td><span class="type-pill">${category.parentId ? "Subcategoría" : "Principal"}</span></td>
            <td>${Number(category.sortOrder || 0)}</td>
            <td>${escapeHtml(category.code)}</td>
            <td>${escapeHtml(category.description)}</td>
            <td><div class="table-actions"><button data-move-category="${category.id}" data-direction="up">Subir</button><button data-move-category="${category.id}" data-direction="down">Bajar</button><button data-edit-category="${category.id}">Editar</button><button class="danger" data-delete-category="${category.id}">Eliminar</button></div></td>
          </tr>
        `).join("") || `<tr><td colspan="6">${adminCategorySearch ? "No encontramos categorías con esa búsqueda." : "No hay categorías todavía."}</td></tr>`}
      </tbody>
    </table>
  `;
  document.querySelectorAll("[data-edit-category]").forEach((button) => button.addEventListener("click", () => editCategory(button.dataset.editCategory)));
  document.querySelectorAll("[data-delete-category]").forEach((button) => button.addEventListener("click", () => deleteCategory(button.dataset.deleteCategory)));
  document.querySelectorAll("[data-move-category]").forEach((button) => {
    button.addEventListener("click", () => moveCategoryOrder(button.dataset.moveCategory, button.dataset.direction));
  });
}

async function saveCategory(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.categoryForm));
  const category = {
    id: data.id || slugify(data.name),
    name: data.name,
    code: data.code,
    description: data.description || "",
    parentId: data.parentId || "",
  };
  try {
    const isEditing = Boolean(data.id);
    const endpoint = isEditing ? `/api/categories/${encodeURIComponent(data.id)}` : "/api/categories";
    const method = isEditing ? "PUT" : "POST";
    const payload = await apiRequest(endpoint, { method, body: category });
    const savedCategory = payload.category;
    const index = state.categories.findIndex((item) => item.id === data.id || item.id === savedCategory.id);
    if (index >= 0) state.categories[index] = savedCategory;
    else state.categories.push(savedCategory);
    if (data.id && data.id !== savedCategory.id) {
      state.products = state.products.map((product) => product.category === data.id ? { ...product, category: savedCategory.id } : product);
    }
    saveState();
  } catch (error) {
    alert(error.message);
    return;
  }
  resetCategoryForm();
  renderStore();
  renderAdmin();
}

function editCategory(id) {
  const category = state.categories.find((item) => item.id === id);
  if (!category) return;
  renderCategoryParentOptions();
  Object.entries(category).forEach(([key, value]) => {
    if (els.categoryForm.elements[key]) els.categoryForm.elements[key].value = value;
  });
  els.categoryForm.scrollIntoView({ behavior: "smooth", block: "start" });
  els.categoryForm.elements.name?.focus();
}

async function deleteCategory(id) {
  try {
    await apiRequest(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    alert(error.message);
    return;
  }
  const idsToDelete = [id, ...getSubcategories(id).map((item) => item.id)];
  state.categories = state.categories.filter((item) => !idsToDelete.includes(item.id));
  state.products = state.products.filter((item) => !idsToDelete.includes(item.category));
  if (activeFilter === id) activeFilter = "all";
  saveState();
  renderStore();
  renderAdmin();
}

async function moveCategoryOrder(id, direction) {
  try {
    await apiRequest(`/api/categories/${encodeURIComponent(id)}/move`, {
      method: "PATCH",
      body: { direction },
    });
    await hydrateCatalogFromApi();
    renderStore();
    renderAdmin();
  } catch (error) {
    alert(error.message);
  }
}

function resetCategoryForm() {
  els.categoryForm.reset();
  els.categoryForm.elements.id.value = "";
  if (els.categoryForm.elements.parentId) els.categoryForm.elements.parentId.value = "";
  renderCategoryParentOptions();
}

function renderOrdersTable() {
  const visibleOrders = getFilteredAdminOrders();
  const pendingCount = state.orders.filter((order) => (order.paymentStatus || "Pendiente de pago") !== "Pagado" && order.status !== "Cancelado").length;
  const paidCount = state.orders.filter((order) => order.paymentStatus === "Pagado" && order.status !== "Entregado").length;
  const deliveredCount = state.orders.filter((order) => order.status === "Entregado").length;
  const emptyText = adminOrderSearch
    ? "No encontramos pedidos con esa búsqueda."
    : adminOrderView === "paid"
      ? "No hay pedidos pagados todavía."
      : adminOrderView === "delivered"
        ? "No hay pedidos entregados todavía."
      : "No hay pedidos pendientes todavía.";
  document.querySelector("#orders-table").innerHTML = `
    <div class="orders-admin-toolbar">
      <div class="orders-admin-views">
        <button class="${adminOrderView === "orders" ? "active" : ""}" type="button" data-order-view="orders">Pedidos <span>${pendingCount}</span></button>
        <button class="${adminOrderView === "paid" ? "active" : ""}" type="button" data-order-view="paid">Pagado <span>${paidCount}</span></button>
        <button class="${adminOrderView === "delivered" ? "active" : ""}" type="button" data-order-view="delivered">Entregado <span>${deliveredCount}</span></button>
      </div>
      <label class="orders-admin-search">
        <span>Buscar pedido</span>
        <input type="search" id="admin-order-search" value="${escapeHtml(adminOrderSearch)}" placeholder="Número de orden o empresa">
      </label>
    </div>
    <table>
      <thead><tr><th>Orden</th><th>Cliente</th><th>Fecha</th><th>Pago</th><th>Comprobante</th><th>Entrega</th><th>Acciones</th><th>Total</th></tr></thead>
      <tbody>
        ${visibleOrders.map((order) => `
          <tr>
            <td><strong>${escapeHtml(order.invoiceNumber || order.id)}</strong><br><small>${escapeHtml(order.id)}</small></td>
            <td>${escapeHtml(order.customer)}<br><small>${escapeHtml(order.email)}</small></td>
            <td>${escapeHtml(order.createdAt || "")}</td>
            <td><select class="status-select ${getPaymentStatusClass(order.paymentStatus)}" data-order-payment-status="${order.id}" ${order.stockCommitted ? "data-stock-committed=\"true\"" : ""}>${["Pendiente de pago", "Comprobante recibido", "Pagado", "Rechazado"].map((status) => `<option ${status === (order.paymentStatus || "Pendiente de pago") ? "selected" : ""}>${status}</option>`).join("")}</select></td>
            <td>${order.paymentReceiptPath ? `<a class="payment-receipt-link" href="${escapeHtml(order.paymentReceiptPath)}" target="_blank" rel="noopener">Ver comprobante</a><small>${escapeHtml(order.paymentReceiptName || "Archivo adjunto")}</small>` : `<span class="payment-receipt-empty">Sin archivo</span>`}</td>
            <td><select class="status-select ${getOrderStatusClass(order.status)}" data-order-status="${order.id}">${["Pendiente", "Enviado", "Entregado", "Cancelado"].map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
            <td><button type="button" data-print-invoice="${escapeHtml(order.id)}">Factura</button></td>
            <td>${formatPrice(order.total, order.currency || DEFAULT_CURRENCY, order.currency || DEFAULT_CURRENCY)}</td>
          </tr>
        `).join("") || `<tr><td colspan="8">${emptyText}</td></tr>`}
      </tbody>
    </table>
  `;
  document.querySelectorAll("[data-order-view]").forEach((button) => {
    button.addEventListener("click", () => {
      adminOrderView = ["paid", "delivered"].includes(button.dataset.orderView) ? button.dataset.orderView : "orders";
      renderOrdersTable();
    });
  });
  document.querySelector("#admin-order-search")?.addEventListener("input", (event) => {
    adminOrderSearch = event.currentTarget.value;
    renderOrdersTable();
    const input = document.querySelector("#admin-order-search");
    input?.focus();
    input?.setSelectionRange(adminOrderSearch.length, adminOrderSearch.length);
  });
  document.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        const payload = await apiRequest(`/api/orders/${encodeURIComponent(select.dataset.orderStatus)}/status`, {
          method: "PATCH",
          body: { status: select.value },
        });
        const index = state.orders.findIndex((item) => item.id === payload.order.id);
        if (index >= 0) state.orders[index] = payload.order;
        select.className = `status-select ${getOrderStatusClass(payload.order.status)}`;
        saveState();
        renderOrdersTable();
      } catch (error) {
        alert(error.message);
        renderOrdersTable();
      }
    });
  });
  document.querySelectorAll("[data-order-payment-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      const previous = state.orders.find((item) => item.id === select.dataset.orderPaymentStatus)?.paymentStatus || "Pendiente de pago";
      if (select.value === "Pagado" && !await showUxConfirm({
        title: "Confirmar pago recibido",
        message: "¿Confirmás que el dinero fue recibido? Al continuar se descontará el stock de este pedido.",
        acceptLabel: "Confirmar pago",
      })) {
        select.value = previous;
        return;
      }
      try {
        const payload = await apiRequest(`/api/orders/${encodeURIComponent(select.dataset.orderPaymentStatus)}/payment-status`, { method: "PATCH", body: { paymentStatus: select.value } });
        const index = state.orders.findIndex((item) => item.id === payload.order.id);
        if (index >= 0) state.orders[index] = payload.order;
        state.products = payload.products || state.products;
        saveState();
        renderStore();
        renderOrdersTable();
      } catch (error) {
        alert(error.message);
        renderOrdersTable();
      }
    });
  });
  document.querySelectorAll("[data-print-invoice]").forEach((button) => {
    button.addEventListener("click", () => printOrderInvoice(button.dataset.printInvoice));
  });
}

function getOrderStatusClass(status = "Pendiente") {
  if (status === "Pendiente") return "is-pending";
  if (status === "Pagado") return "is-paid";
  if (status === "Entregado") return "is-delivered";
  return "";
}

function getPaymentStatusClass(status = "Pendiente de pago") {
  if (status === "Pagado") return "is-paid";
  if (status === "Rechazado") return "is-cancelled";
  if (status === "Comprobante recibido") return "is-received";
  return "is-pending";
}

function getFilteredAdminOrders() {
  const search = adminOrderSearch.trim().toLowerCase();
  return state.orders.filter((order) => {
    const status = order.status || "Pendiente";
    if (!search) {
      if (adminOrderView === "paid" && (order.paymentStatus !== "Pagado" || status === "Entregado")) return false;
      if (adminOrderView === "delivered" && status !== "Entregado") return false;
      if (adminOrderView === "orders" && ((order.paymentStatus || "Pendiente de pago") === "Pagado" || status === "Cancelado")) return false;
      return true;
    }
    return [
      order.id,
      order.invoiceNumber,
      order.customer,
      order.company,
      order.email,
      order.phone,
      status,
      order.paymentStatus,
    ].some((value) => String(value || "").toLowerCase().includes(search));
  });
}

function printOrderInvoice(orderId) {
  const order = state.orders.find((item) => item.id === orderId) || customerOrders.find((item) => item.id === orderId);
  if (!order) return;
  const pdfUrl = URL.createObjectURL(createOrderInvoicePdf(order));
  const win = window.open(pdfUrl, "_blank", "noopener");
  if (!win) {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.target = "_blank";
    link.download = `factura-${sanitizePdfText(order.invoiceNumber || order.id)}.pdf`;
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
}

function createOrderInvoicePdf(order) {
  const width = 595;
  const height = 842;
  const margin = 46;
  const pages = [[]];
  let y = 792;
  const addPage = () => {
    pages.push([]);
    y = 792;
  };
  const line = (text, { x = margin, fixedY = null, size = 10, bold = false, gap = 14 } = {}) => {
    if (fixedY === null && y < 58) addPage();
    const drawY = fixedY === null ? y : fixedY;
    pages[pages.length - 1].push({ text: sanitizePdfText(text), x, y: drawY, size, bold });
    if (fixedY === null) y -= gap;
  };
  const rule = (fromX = margin, toX = width - margin) => {
    if (y < 58) addPage();
    pages[pages.length - 1].push({ rule: true, x: fromX, y, to: toX });
    y -= 18;
  };
  const box = (x, topY, boxWidth, boxHeight) => {
    pages[pages.length - 1].push({ rect: true, x, y: topY - boxHeight, width: boxWidth, height: boxHeight });
  };
  const textAt = (text, x, fixedY, options = {}) => line(text, { ...options, x, fixedY });
  const wrapped = (text, options = {}) => {
    wrapPdfText(text, options.max || 76).forEach((part) => line(part, options));
  };
  const company = state.settings;
  const invoice = order.invoiceNumber || order.id;
  const currency = order.currency || DEFAULT_CURRENCY;
  const total = Number(order.total || 0);
  const subtotal = (order.items || []).reduce((sum, item) => {
    return sum + convertPrice(Number(item.price || 0) * Number(item.qty || 0), item.currency || currency, currency);
  }, 0);

  box(margin, 806, 316, 96);
  box(378, 806, 171, 96);
  textAt(company.companyName || "BEIM", 62, 782, { size: 24, bold: true });
  textAt("Tecnología y servicio técnico", 62, 762, { size: 9 });
  textAt(`RUT: ${company.companyRut || "-"}`, 62, 742, { size: 9 });
  textAt(company.companyAddress || "Dirección no configurada", 62, 728, { size: 9 });
  textAt(`${company.companyPhone || ""} ${company.companyEmail || ""}`, 62, 714, { size: 9 });
  textAt("FACTURA", 398, 780, { size: 16, bold: true });
  textAt(`Nro. ${invoice}`, 398, 758, { size: 13, bold: true });
  textAt(`Orden: ${order.id}`, 398, 738, { size: 9 });
  textAt(`Fecha: ${order.createdAt || ""}`, 398, 724, { size: 9 });

  y = 682;
  box(margin, y + 12, width - margin * 2, 86);
  line("DATOS DEL COMPRADOR", { x: 62, size: 11, bold: true, gap: 18 });
  line(`Cliente: ${order.customer || "-"}`, { x: 62, size: 10, gap: 14 });
  line(`Documento: ${order.documentType || "Documento"} ${order.documentValue || "-"}`, { x: 62, size: 10, gap: 14 });
  textAt(`Teléfono: ${order.phone || "-"}`, 330, 646, { size: 10 });
  textAt(`Email: ${order.email || "-"}`, 330, 632, { size: 10 });
  wrapped(`Dirección: ${order.address || "-"}`, { x: 62, max: 64, size: 10, gap: 13 });
  y = 570;
  line("DETALLE DE PRODUCTOS", { size: 12, bold: true, gap: 18 });
  pages[pages.length - 1].push({ fillRect: true, x: margin, y: y - 4, width: width - margin * 2, height: 20, color: 0.94 });
  textAt("Código", 54, y, { size: 9, bold: true });
  textAt("Cant.", 112, y, { size: 9, bold: true });
  textAt("Producto", 158, y, { size: 9, bold: true });
  textAt("Unitario", 402, y, { size: 9, bold: true });
  textAt("Subtotal", 486, y, { size: 9, bold: true });
  y -= 26;
  (order.items || []).forEach((item) => {
    if (y < 178) {
      addPage();
      line("DETALLE DE PRODUCTOS", { size: 12, bold: true, gap: 18 });
      textAt("Código", 54, y, { size: 9, bold: true });
      textAt("Cant.", 112, y, { size: 9, bold: true });
      textAt("Producto", 158, y, { size: 9, bold: true });
      textAt("Unitario", 402, y, { size: 9, bold: true });
      textAt("Subtotal", 486, y, { size: 9, bold: true });
      y -= 24;
    }
    const qty = Number(item.qty || 0);
    const unit = formatPrice(item.price, item.currency || currency, currency);
    const itemSubtotal = formatPrice(Number(item.price || 0) * qty, item.currency || currency, currency);
    textAt(formatProductCode(item.productCode), 54, y, { size: 9 });
    textAt(String(qty), 116, y, { size: 9 });
    textAt(sanitizePdfText(item.name || "").slice(0, 40), 158, y, { size: 9 });
    textAt(unit, 402, y, { size: 9 });
    textAt(itemSubtotal, 486, y, { size: 9 });
    y -= 17;
    rule(margin, width - margin);
    y += 5;
  });
  if (y < 168) addPage();
  y -= 10;
  box(344, y + 18, 205, 78);
  textAt("Subtotal", 362, y, { size: 10 });
  textAt(formatPrice(subtotal, currency, currency), 452, y, { size: 10 });
  y -= 18;
  textAt("Descuento", 362, y, { size: 10 });
  textAt(formatPrice(Math.max(0, subtotal - total), currency, currency), 452, y, { size: 10 });
  y -= 22;
  textAt("TOTAL", 362, y, { size: 14, bold: true });
  textAt(formatPrice(total, currency, currency), 452, y, { size: 14, bold: true });
  y -= 34;
  line(`Método de pago: ${order.paymentMethodName || "-"}`, { size: 10, bold: true });
  wrapped(order.paymentInstructions || "Pago sujeto a confirmación administrativa.", { max: 82, size: 9, gap: 12 });
  y = Math.max(y - 12, 76);
  rule();
  line("Gracias por tu compra. Este documento fue generado automáticamente por BEIM.", { size: 8, gap: 10 });
  line("Conservá esta factura para consultas, garantía o seguimiento del pedido.", { size: 8 });

  return buildPdfBlob(pages, width, height);
}

function buildPdfBlob(pages, width, height) {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const regularFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];
  pages.forEach((page) => {
    const stream = page.map((entry) => {
      if (entry.rule) return `${entry.x} ${entry.y} m ${entry.to} ${entry.y} l S`;
      if (entry.rect) return `${entry.x} ${entry.y} ${entry.width} ${entry.height} re S`;
      if (entry.fillRect) {
        const color = Number(entry.color ?? 0.94);
        return `q ${color} g ${entry.x} ${entry.y} ${entry.width} ${entry.height} re f Q`;
      }
      const font = entry.bold ? "F2" : "F1";
      return `BT /${font} ${entry.size} Tf ${entry.x} ${entry.y} Td (${escapePdfString(entry.text)}) Tj ET`;
    }).join("\n");
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function wrapPdfText(value, maxLength) {
  const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function sanitizePdfText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escapePdfString(value) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function getOrderInvoiceMarkup(order, { compact = false } = {}) {
  const company = state.settings;
  const isAdministrativeOrder = ["Administrador", "Administrador principal"].includes(order.customer || "");
  const rows = (order.items || []).map((item) => `
    <tr>
      <td>${escapeHtml(formatProductCode(item.productCode))}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${Number(item.qty || 0)}</td>
      <td>${formatPrice(item.price, item.currency || order.currency, order.currency || DEFAULT_CURRENCY)}</td>
      <td>${formatPrice(Number(item.price || 0) * Number(item.qty || 0), item.currency || order.currency, order.currency || DEFAULT_CURRENCY)}</td>
    </tr>
  `).join("");
  return `
    <section class="invoice-sheet ${compact ? "is-compact" : ""}">
      <header class="invoice-head">
        <div>
          <h1>${escapeHtml(company.companyName || "BEIM")}</h1>
          <div class="invoice-muted">${escapeHtml(company.companyRut ? `RUT: ${company.companyRut}` : "")}</div>
          <div>${escapeHtml(company.companyAddress || "")}</div>
          <div>${escapeHtml(company.companyPhone || "")} ${escapeHtml(company.companyEmail || "")}</div>
        </div>
        <div>
          <h1>Boleta ${escapeHtml(order.invoiceNumber || order.id)}</h1>
          <div>Orden: ${escapeHtml(order.id)}</div>
          <div>Fecha: ${escapeHtml(order.createdAt || "")}</div>
          <div>Estado: ${escapeHtml(order.status || "")}</div>
        </div>
      </header>
      <section class="invoice-box">
        <strong>${isAdministrativeOrder ? "Operación realizada por" : "Comprador"}</strong>
        <div>${escapeHtml(order.customer || "")}</div>
        ${isAdministrativeOrder ? "" : `
          <div>${escapeHtml(order.email || "")} ${escapeHtml(order.phone || "")}</div>
          <div>${escapeHtml(order.documentType || "")}: ${escapeHtml(order.documentValue || "")}</div>
          <div>${escapeHtml(order.address || "")}</div>
        `}
      </section>
      <table>
        <thead><tr><th>Código</th><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="invoice-total">Total: ${formatPrice(order.total, order.currency || DEFAULT_CURRENCY, order.currency || DEFAULT_CURRENCY)}</div>
      <p class="invoice-muted">Método de pago: ${escapeHtml(order.paymentMethodName || "")}</p>
    </section>
  `;
}

function startOrdersPolling() {
  if (ordersPollTimer || !["admin", "superadmin"].includes(state.currentUser?.role)) return;
  ordersPollTimer = window.setInterval(() => {
    syncOrdersFromApi(false).catch((error) => console.warn("No se pudieron consultar órdenes.", error));
  }, 20000);
}

function stopOrdersPolling() {
  if (!ordersPollTimer) return;
  window.clearInterval(ordersPollTimer);
  ordersPollTimer = null;
}

function openOrdersNotificationPanel() {
  if (!["admin", "superadmin"].includes(state.currentUser?.role)) return;
  adminOrderView = "orders";
  openAdmin().then(() => setAdminTab("orders"));
}

function markOrdersAsSeen() {
  const latestOrder = getLatestOrderTimestamp();
  localStorage.setItem(ORDERS_SEEN_KEY, String(latestOrder || Date.now()));
  updateOrdersFloat();
}

function updateOrdersFloat() {
  if (!els.ordersFloat) return;
  const canView = ["admin", "superadmin"].includes(state.currentUser?.role || "");
  document.body.classList.toggle("is-admin-session", canView);
  els.ordersFloat.hidden = !canView;
  if (!canView) return;
  const seenAt = Number(localStorage.getItem(ORDERS_SEEN_KEY) || 0);
  const newOrders = state.orders.filter((order) => getOrderTimestamp(order) > seenAt);
  els.ordersFloatCount.textContent = String(newOrders.length);
  els.ordersFloatLabel.textContent = newOrders.length
    ? `${newOrders.length} nueva${newOrders.length === 1 ? "" : "s"}`
    : "Sin novedades";
  els.ordersFloat.classList.toggle("has-new", newOrders.length > 0);
}

function getLatestOrderTimestamp() {
  return Math.max(0, ...state.orders.map(getOrderTimestamp));
}

function getOrderTimestamp(order) {
  if (Number(order?.createdAtMs || 0)) return Number(order.createdAtMs);
  const parsed = Date.parse(order?.createdAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOrdersWhatsappUrl(order = state.orders[0]) {
  const phone = normalizePhoneForWhatsapp(state.settings.ordersWhatsapp || state.settings.whatsapp);
  const message = order ? buildOrderWhatsappMessage(order) : "Hola! Hay pedidos nuevos para revisar en el panel BEIM.";
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#";
}

function openOrderWhatsappNotification(order) {
  const url = getOrdersWhatsappUrl(order);
  if (url === "#") return;
  window.open(url, "_blank", "noopener");
}

function buildOrderWhatsappMessage(order) {
  const items = (order.items || []).map((item) => `${item.qty} x ${item.name}`).join("\n");
  return [
    "Nueva orden BEIM",
    `Boleta: ${order.invoiceNumber || "-"}`,
    `Pedido: ${order.id}`,
    `Cliente: ${order.customer}`,
    `Teléfono: ${order.phone || "-"}`,
    `Email: ${order.email || "-"}`,
    `Total: ${formatPrice(order.total, order.currency || DEFAULT_CURRENCY, order.currency || DEFAULT_CURRENCY)}`,
    `Pago: ${order.paymentMethodName || "-"}`,
    items ? `Productos:\n${items}` : "",
  ].filter(Boolean).join("\n");
}

function normalizePhoneForWhatsapp(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function renderPaymentMethodsTable() {
  if (!els.paymentMethodsTable) return;
  if (!isSuperAdminSession()) {
    els.paymentMethodsTable.innerHTML = "";
    return;
  }
  const methods = getPaymentMethods();
  els.paymentMethodsTable.innerHTML = `
    <table>
      <thead><tr><th>Orden</th><th>Método</th><th>Detalle</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${methods.map((method) => `
          <tr>
            <td>${Number(method.sortOrder || 0)}</td>
            <td><strong>${escapeHtml(method.name)}</strong><br><small>${escapeHtml(method.instructions)}</small></td>
            <td>${escapeHtml(method.detail || "-")}</td>
            <td><span class="type-pill ${method.isActive ? "" : "is-pending"}">${method.isActive ? "Activo" : "Inactivo"}</span></td>
            <td>
              <div class="table-actions">
                <button type="button" data-move-payment-method="${method.id}" data-direction="up">Subir</button>
                <button type="button" data-move-payment-method="${method.id}" data-direction="down">Bajar</button>
                <button type="button" data-edit-payment-method="${method.id}">Editar</button>
                <button class="danger" type="button" data-delete-payment-method="${method.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join("") || `<tr><td colspan="5">Todavía no hay métodos de pago.</td></tr>`}
      </tbody>
    </table>
  `;
  els.paymentMethodsTable.querySelectorAll("[data-edit-payment-method]").forEach((button) => {
    button.addEventListener("click", () => editPaymentMethod(button.dataset.editPaymentMethod));
  });
  els.paymentMethodsTable.querySelectorAll("[data-delete-payment-method]").forEach((button) => {
    button.addEventListener("click", () => deletePaymentMethod(button.dataset.deletePaymentMethod));
  });
  els.paymentMethodsTable.querySelectorAll("[data-move-payment-method]").forEach((button) => {
    button.addEventListener("click", () => movePaymentMethod(button.dataset.movePaymentMethod, button.dataset.direction));
  });
}

function fillSettingsForm() {
  if (!els.settingsForm) return;
  els.settingsForm.elements.whatsapp.value = state.settings.whatsapp;
  els.settingsForm.elements.ordersWhatsapp.value = state.settings.ordersWhatsapp || state.settings.whatsapp;
  els.settingsForm.elements.instagram.value = state.settings.instagram;
  els.settingsForm.elements.companyName.value = state.settings.companyName || "BEIM";
  els.settingsForm.elements.companyRut.value = state.settings.companyRut || "";
  els.settingsForm.elements.companyAddress.value = state.settings.companyAddress || "";
  els.settingsForm.elements.companyPhone.value = state.settings.companyPhone || "";
  els.settingsForm.elements.companyEmail.value = state.settings.companyEmail || "";
  els.settingsForm.elements.heroText.value = state.settings.heroText;
  resetPaymentMethodForm();
}

function editPaymentMethod(id) {
  if (!isSuperAdminSession()) return;
  const method = getPaymentMethod(id);
  if (!method || !els.paymentMethodForm) return;
  els.paymentMethodForm.elements.id.value = method.id;
  els.paymentMethodForm.elements.name.value = method.name;
  els.paymentMethodForm.elements.detail.value = method.detail || "";
  els.paymentMethodForm.elements.instructions.value = method.instructions || "";
  els.paymentMethodForm.elements.isActive.value = method.isActive ? "true" : "false";
}

function resetPaymentMethodForm() {
  if (!els.paymentMethodForm) return;
  els.paymentMethodForm.reset();
  els.paymentMethodForm.elements.id.value = "";
  els.paymentMethodForm.elements.isActive.value = "true";
}

async function savePaymentMethod(event) {
  event.preventDefault();
  if (!isSuperAdminSession()) return;
  if (!els.paymentMethodForm) return;
  const data = Object.fromEntries(new FormData(els.paymentMethodForm));
  const methods = getPaymentMethods();
  const existing = methods.find((method) => method.id === data.id);
  const nextOrder = methods.length ? Math.max(...methods.map((method) => Number(method.sortOrder || 0))) + 1 : 1;
  const normalized = normalizePaymentMethod({
    id: existing?.id || slugify(data.name),
    name: data.name,
    detail: data.detail,
    instructions: data.instructions,
    isActive: data.isActive === "true",
    sortOrder: existing?.sortOrder || nextOrder,
  }, nextOrder);
  state.settings.paymentMethods = existing
    ? methods.map((method) => method.id === existing.id ? normalized : method)
    : [...methods, normalized];
  state.settings.paymentMethods = getPaymentMethods();
  try {
    await persistStoreSettings();
  } catch (error) {
    alert(error.message);
    return;
  }
  resetPaymentMethodForm();
  renderCheckout();
  renderAdmin();
}

async function deletePaymentMethod(id) {
  if (!isSuperAdminSession()) return;
  const methods = getPaymentMethods().filter((method) => method.id !== id);
  state.settings.paymentMethods = methods.map((method, index) => ({ ...method, sortOrder: index + 1 }));
  try {
    await persistStoreSettings();
  } catch (error) {
    alert(error.message);
    return;
  }
  resetPaymentMethodForm();
  renderCheckout();
  renderAdmin();
}

async function movePaymentMethod(id, direction) {
  if (!isSuperAdminSession()) return;
  const methods = [...getPaymentMethods()];
  const index = methods.findIndex((method) => method.id === id);
  if (index < 0) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= methods.length) return;
  [methods[index], methods[targetIndex]] = [methods[targetIndex], methods[index]];
  state.settings.paymentMethods = methods.map((method, orderIndex) => ({ ...method, sortOrder: orderIndex + 1 }));
  try {
    await persistStoreSettings();
  } catch (error) {
    alert(error.message);
    return;
  }
  renderCheckout();
  renderAdmin();
}

async function saveSettings(event) {
  event.preventDefault();
  state.settings = {
    ...state.settings,
    ...Object.fromEntries(new FormData(els.settingsForm)),
  };
  try {
    await persistStoreSettings();
  } catch (error) {
    alert(error.message);
    return;
  }
  applySettings();
}

function applySettings() {
  document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
    const message = link.href.split("text=")[1] || "Hola!";
    link.href = `https://wa.me/${state.settings.whatsapp}?text=${message}`;
  });
  document.querySelector(".instagram-btn").href = state.settings.instagram;
  updateCheckoutLink();
  renderHero();
}

async function persistStoreSettings() {
  ensureSettingsDefaults(state);
  const payload = await apiRequest("/api/settings/store", {
    method: "PUT",
    body: {
      whatsapp: state.settings.whatsapp,
      ordersWhatsapp: state.settings.ordersWhatsapp || state.settings.whatsapp,
      instagram: state.settings.instagram,
      companyName: state.settings.companyName || "BEIM",
      companyRut: state.settings.companyRut || "",
      companyAddress: state.settings.companyAddress || "",
      companyPhone: state.settings.companyPhone || "",
      companyEmail: state.settings.companyEmail || "",
      heroText: state.settings.heroText,
      productBrands: getProductBrands(),
      paymentMethods: getPaymentMethods(),
    },
  });
  state.settings = { ...state.settings, ...(payload.settings || {}) };
  ensureSettingsDefaults(state);
  saveState();
}

function convertPrice(value, sourceCurrency = DEFAULT_CURRENCY, targetCurrency = selectedCurrency) {
  const from = currencyConfig[sourceCurrency] || currencyConfig[DEFAULT_CURRENCY];
  const to = currencyConfig[targetCurrency] || currencyConfig[DEFAULT_CURRENCY];
  const valueInUsd = Number(value || 0) / from.rate;
  return valueInUsd * to.rate;
}

function formatPrice(value, sourceCurrency = selectedCurrency, displayCurrency = selectedCurrency) {
  const currency = currencyConfig[displayCurrency] || currencyConfig[DEFAULT_CURRENCY];
  const amount = convertPrice(value, sourceCurrency, displayCurrency);

  if (displayCurrency === "UYU") {
    return `${currency.label} ${Math.round(amount).toLocaleString("es-UY")}`;
  }

  return `${currency.symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCurrencyLabel(currencyCode = selectedCurrency) {
  return currencyConfig[currencyCode]?.label || DEFAULT_CURRENCY;
}

function renderPromoTable() {
  const target = document.querySelector("#promo-table");
  if (!target) return;
  target.innerHTML = `
    <table>
      <thead><tr><th>Etiqueta</th><th>Titulo</th><th>Imagen</th><th>Acciones</th></tr></thead>
      <tbody>
        ${state.promoSlides.map((slide) => `
          <tr>
            <td>${escapeHtml(slide.eyebrow)}</td>
            <td>${escapeHtml(slide.title)}</td>
            <td>${escapeHtml(slide.image)}</td>
            <td><div class="table-actions"><button data-edit-promo="${slide.id}">Editar</button><button class="danger" data-delete-promo="${slide.id}">Eliminar</button></div></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
  document.querySelectorAll("[data-edit-promo]").forEach((button) => button.addEventListener("click", () => editPromo(button.dataset.editPromo)));
  document.querySelectorAll("[data-delete-promo]").forEach((button) => button.addEventListener("click", () => deletePromo(button.dataset.deletePromo)));
}

async function savePromo(event) {
  event.preventDefault();
  const slide = getPromoDraft();
  try {
    const isEditing = Boolean(els.promoForm?.elements.id.value);
    const endpoint = isEditing ? `/api/promo-slides/${encodeURIComponent(els.promoForm.elements.id.value)}` : "/api/promo-slides";
    const method = isEditing ? "PUT" : "POST";
    const payload = await apiRequest(endpoint, { method, body: slide });
    const savedSlide = normalizePromoSlide(payload.slide);
    const index = state.promoSlides.findIndex((item) => item.id === els.promoForm.elements.id.value || item.id === savedSlide.id);
    if (index >= 0) state.promoSlides[index] = savedSlide;
    else state.promoSlides.push(savedSlide);
    saveState();
  } catch (error) {
    alert(error.message);
    return;
  }
  renderHero();
  renderAdmin();
  editPromo(slide.id);
}

function editPromo(id) {
  const slide = state.promoSlides.find((item) => item.id === id);
  if (!slide) return;
  fillPromoForm(slide);
}

async function deletePromo(id) {
  if (state.promoSlides.length <= 1) return;
  try {
    await apiRequest(`/api/promo-slides/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    alert(error.message);
    return;
  }
  state.promoSlides = state.promoSlides.filter((item) => item.id !== id);
  if (promoIndex >= state.promoSlides.length) promoIndex = 0;
  saveState();
  renderHero();
  renderAdmin();
}

function resetPromoForm() {
  els.promoForm.reset();
  els.promoForm.elements.id.value = "";
  renderPromoEditorPreview();
}

function ensurePromoEditorState() {
  if (!els.promoForm) return;
  const currentId = els.promoForm.elements.id.value;
  if (currentId && !state.promoSlides.some((slide) => slide.id === currentId)) {
    fillPromoForm(state.promoSlides[0] || defaults.promoSlides[0]);
    return;
  }
  if (!currentId && !hasPromoDraftContent()) {
    fillPromoForm(state.promoSlides[0] || defaults.promoSlides[0]);
    return;
  }
  renderPromoEditorPreview();
}

function hasPromoDraftContent() {
  if (!els.promoForm) return false;
  const defaultFields = new Set(["id", "imageX", "imageY", "imageScale", "imageFramePreset"]);
  return Array.from(els.promoForm.elements).some((field) => {
    if (!field.name || defaultFields.has(field.name)) return false;
    return String(field.value || "").trim() !== "";
  });
}

function fillPromoForm(slide) {
  if (!els.promoForm || !slide) return;
  const normalizedSlide = normalizePromoSlide(slide);
  Object.entries(normalizedSlide).forEach(([key, value]) => {
    if (els.promoForm.elements[key]) els.promoForm.elements[key].value = value ?? "";
  });
  renderPromoEditorPreview();
}

function getPromoDraft() {
  if (!els.promoForm) {
    return { ...(state.promoSlides[0] || defaults.promoSlides[0]) };
  }
  const data = Object.fromEntries(new FormData(els.promoForm));
  return normalizePromoSlide({
    id: data.id || `slide-${Date.now()}`,
    eyebrow: data.eyebrow || "Nueva promo",
    title: data.title || "Título de la placa",
    text: data.text || "Describí el mensaje principal del hero para esta campaña.",
    image: data.image || "assets/logo.png",
    primaryLabel: data.primaryLabel || "",
    primaryHref: data.primaryHref || "",
    secondaryLabel: data.secondaryLabel || "",
    secondaryHref: data.secondaryHref || "",
    imageX: data.imageX || 50,
    imageY: data.imageY || 50,
    imageScale: data.imageScale || 1,
    imageFramePreset: data.imageFramePreset || "default",
    imageFrameWidth: data.imageFrameWidth || "",
    imageFrameHeight: data.imageFrameHeight || "",
  });
}

function renderPromoSlideList() {
  if (!els.promoSlideList) return;
  const currentId = els.promoForm?.elements.id?.value;
  els.promoSlideList.innerHTML = state.promoSlides.map((slide, index) => `
    <button class="hero-admin-chip ${slide.id === currentId ? "active" : ""}" type="button" data-promo-select="${slide.id}">
      <span>Hoja ${index + 1}</span>
      <strong>${escapeHtml(slide.title)}</strong>
    </button>
  `).join("");
  els.promoSlideList.querySelectorAll("[data-promo-select]").forEach((button) => {
    button.addEventListener("click", () => editPromo(button.dataset.promoSelect));
  });
}

function renderPromoEditorPreview() {
  if (!els.promoPreview) return;
  const slide = getPromoDraft();
  const currentId = els.promoForm?.elements.id?.value;
  const imageMarkup = isEditableImageSource(slide.image)
    ? `<img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.title)}" style="${getPromoImageStyle(slide)}">`
    : `<div class="hero-admin-preview-fallback">${escapeHtml(slide.image || "IMG")}</div>`;

  els.promoPreview.innerHTML = `
    <article class="hero-admin-preview-card">
      <div class="hero-admin-preview-copy">
        <span class="pill">${escapeHtml(slide.eyebrow)}</span>
        <h4>${escapeHtml(slide.title)}</h4>
        <p>${escapeHtml(slide.text)}</p>
        <div class="hero-admin-preview-actions">
          ${slide.primaryLabel ? `<span class="hero-admin-btn primary">${escapeHtml(slide.primaryLabel)}</span>` : ""}
          ${slide.secondaryLabel ? `<span class="hero-admin-btn secondary">${escapeHtml(slide.secondaryLabel)}</span>` : ""}
        </div>
      </div>
      <div class="hero-admin-preview-media" style="${getPromoPreviewFrameStyle(slide)}">${imageMarkup}</div>
    </article>
  `;

  if (els.promoPreviewStatus) {
    els.promoPreviewStatus.textContent = currentId ? `Editando ${slide.id}` : "Nueva hoja";
  }
  renderPromoImageStage(slide);
  renderPromoSlideList();
}

function normalizePromoSlide(slide) {
  return {
    ...slide,
    imageX: clampNumber(slide.imageX, 0, 100, 50),
    imageY: clampNumber(slide.imageY, 0, 100, 50),
    imageScale: clampNumber(slide.imageScale, 0.35, 2.4, 1),
    imageFramePreset: PROMO_FRAME_PRESETS[slide.imageFramePreset] ? slide.imageFramePreset : "default",
    imageFrameWidth: clampOptionalNumber(slide.imageFrameWidth, 240, 760),
    imageFrameHeight: clampOptionalNumber(slide.imageFrameHeight, 180, 620),
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function clampOptionalNumber(value, min, max) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return Math.min(max, Math.max(min, number));
}

function getPromoImageStyle(slide) {
  const normalizedSlide = normalizePromoSlide(slide);
  return `object-position:${normalizedSlide.imageX}% ${normalizedSlide.imageY}%;transform:scale(${normalizedSlide.imageScale});transform-origin:center center;`;
}

function getPromoFrameConfig(slide) {
  const normalizedSlide = normalizePromoSlide(slide);
  const preset = PROMO_FRAME_PRESETS[normalizedSlide.imageFramePreset] || PROMO_FRAME_PRESETS.default;
  const customHeight = normalizedSlide.imageFrameHeight || "";
  const customWidth = normalizedSlide.imageFrameWidth || "";
  return {
    heroMinHeight: customHeight || preset.heroMinHeight,
    heroImageHeight: customHeight ? Math.max(120, customHeight - 30) : preset.heroImageHeight,
    previewHeight: customHeight ? Math.round(customHeight * 0.62) : preset.previewHeight,
    editorHeight: customHeight ? Math.round(customHeight * 0.75) : preset.editorHeight,
    frameWidth: customWidth || preset.frameWidth,
  };
}

function getPromoFrameStyle(slide) {
  const config = getPromoFrameConfig(slide);
  return `--hero-media-min-height:${config.heroMinHeight}px;--hero-media-image-height:${config.heroImageHeight}px;--hero-media-frame-width:${config.frameWidth}px;`;
}

function getPromoPreviewFrameStyle(slide) {
  const config = getPromoFrameConfig(slide);
  return `--hero-preview-height:${config.previewHeight}px;--hero-preview-width:${Math.round(config.frameWidth * 0.62)}px;`;
}

function getPromoEditorFrameStyle(slide) {
  const config = getPromoFrameConfig(slide);
  return `--hero-editor-height:${config.editorHeight}px;--hero-editor-width:${Math.round(config.frameWidth * 0.75)}px;`;
}

function renderPromoImageStage(slide) {
  if (!els.promoImageStage) return;
  if (!isEditableImageSource(slide.image)) {
    els.promoImageStage.innerHTML = `<div class="hero-image-editor-empty">Usá una ruta válida o cargá una imagen desde archivos para editarla dentro del cuadro.</div>`;
    promoImageDrag = null;
    return;
  }

  els.promoImageStage.innerHTML = `
    <div class="hero-image-editor-canvas" data-promo-image-canvas style="${getPromoEditorFrameStyle(slide)}">
      <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.title)}" data-promo-image style="${getPromoImageStyle(slide)}">
      <button class="hero-frame-resize hero-frame-resize-width" type="button" data-promo-resize="width" aria-label="Ajustar ancho del cuadro"></button>
      <button class="hero-frame-resize hero-frame-resize-height" type="button" data-promo-resize="height" aria-label="Ajustar alto del cuadro"></button>
    </div>
  `;
  bindPromoImageEditor();
}

function bindPromoImageEditor() {
  const canvas = els.promoImageStage?.querySelector("[data-promo-image-canvas]");
  if (!canvas || !els.promoForm) return;

  canvas.addEventListener("pointerdown", handlePromoImagePointerDown);
  canvas.addEventListener("pointermove", handlePromoImagePointerMove);
  canvas.addEventListener("pointerup", stopPromoImageDrag);
  canvas.addEventListener("pointerleave", stopPromoImageDrag);
  canvas.addEventListener("wheel", handlePromoImageWheel, { passive: false });
  canvas.querySelectorAll("[data-promo-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", handlePromoFrameResizeStart);
    handle.addEventListener("pointermove", handlePromoFrameResizeMove);
    handle.addEventListener("pointerup", stopPromoFrameResize);
    handle.addEventListener("pointerleave", stopPromoFrameResize);
  });
}

function handlePromoImagePointerDown(event) {
  if (event.target?.closest?.("[data-promo-resize]")) return;
  const canvas = event.currentTarget;
  promoImageDrag = { canvas };
  canvas.setPointerCapture?.(event.pointerId);
  updatePromoImagePositionFromPointer(event);
}

function handlePromoImagePointerMove(event) {
  if (!promoImageDrag) return;
  updatePromoImagePositionFromPointer(event);
}

function handlePromoFrameResizeStart(event) {
  if (!els.promoForm) return;
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  const canvas = handle.closest("[data-promo-image-canvas]");
  if (!canvas) return;
  const slide = getPromoDraft();
  const config = getPromoFrameConfig(slide);
  promoFrameResize = {
    canvas,
    handle,
    axis: handle.dataset.promoResize,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: Number(slide.imageFrameWidth || config.frameWidth),
    startHeight: Number(slide.imageFrameHeight || config.heroMinHeight),
  };
  handle.setPointerCapture?.(event.pointerId);
}

function handlePromoFrameResizeMove(event) {
  if (!promoFrameResize || !els.promoForm) return;
  event.preventDefault();
  event.stopPropagation();
  const editorScale = 0.75;
  if (promoFrameResize.axis === "width") {
    const nextWidth = promoFrameResize.startWidth + ((event.clientX - promoFrameResize.startX) / editorScale);
    els.promoForm.elements.imageFrameWidth.value = String(Math.round(clampNumber(nextWidth, 240, 760, 420)));
  }
  if (promoFrameResize.axis === "height") {
    const nextHeight = promoFrameResize.startHeight + ((event.clientY - promoFrameResize.startY) / editorScale);
    els.promoForm.elements.imageFrameHeight.value = String(Math.round(clampNumber(nextHeight, 180, 620, 260)));
  }
  updatePromoImageVisuals();
}

function stopPromoFrameResize(event) {
  if (!promoFrameResize) return;
  promoFrameResize.handle?.releasePointerCapture?.(event.pointerId);
  promoFrameResize = null;
}

function stopPromoImageDrag(event) {
  if (!promoImageDrag) return;
  promoImageDrag.canvas?.releasePointerCapture?.(event.pointerId);
  promoImageDrag = null;
}

function updatePromoImagePositionFromPointer(event) {
  if (!els.promoForm?.elements.imageX || !els.promoForm?.elements.imageY) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  els.promoForm.elements.imageX.value = String(clampNumber(x, 0, 100, 50));
  els.promoForm.elements.imageY.value = String(clampNumber(y, 0, 100, 50));
  updatePromoImageVisuals();
}

function handlePromoImageWheel(event) {
  event.preventDefault();
  if (!els.promoForm?.elements.imageScale) return;
  const currentScale = clampNumber(els.promoForm.elements.imageScale.value, 0.35, 2.4, 1);
  const nextScale = clampNumber(currentScale + (event.deltaY < 0 ? 0.08 : -0.08), 0.35, 2.4, 1);
  els.promoForm.elements.imageScale.value = String(Math.round(nextScale * 100) / 100);
  updatePromoImageVisuals();
}

function resetPromoImagePosition() {
  if (!els.promoForm) return;
  els.promoForm.elements.imageX.value = "50";
  els.promoForm.elements.imageY.value = "50";
  els.promoForm.elements.imageScale.value = "1";
  renderPromoEditorPreview();
}

function updatePromoImageVisuals() {
  const slide = getPromoDraft();
  const style = getPromoImageStyle(slide);
  els.promoPreview?.querySelector(".hero-admin-preview-media img")?.setAttribute("style", style);
  els.promoPreview?.querySelector(".hero-admin-preview-media")?.setAttribute("style", getPromoPreviewFrameStyle(slide));
  els.promoImageStage?.querySelector("[data-promo-image]")?.setAttribute("style", style);
  els.promoImageStage?.querySelector("[data-promo-image-canvas]")?.setAttribute("style", getPromoEditorFrameStyle(slide));
}

function isEditableImageSource(value) {
  const source = String(value || "").trim();
  return Boolean(source) && !/^[A-Z]{2,6}$/.test(source);
}

function handlePromoImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !els.promoForm?.elements.image) return;

  const reader = new FileReader();
  reader.onload = () => {
    els.promoForm.elements.image.value = String(reader.result || "");
    resetPromoImagePosition();
    renderPromoEditorPreview();
    event.target.value = "";
  };
  reader.readAsDataURL(file);
}
