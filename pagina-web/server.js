const http = require("http");
const fs = require("fs");
const https = require("https");
const path = require("path");
const crypto = require("crypto");
const { closeDatabase, getDatabaseHealth, getStorageMode, loadEnvFile, query, withTransaction } = require("./db");

const publicRoot = path.resolve(__dirname);
const publicBasePath = "/beim";
const boletaPublicPath = `${publicBasePath}/boleta`;
const boletaRoot = path.resolve(__dirname, "boleta");
loadEnvFile();
const port = Number(process.env.PORT || 3000);
const host = String(process.env.HOST || "127.0.0.1");
const googleClientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
const facebookAppId = String(process.env.FACEBOOK_APP_ID || "").trim();
const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
const corsOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
let googleJwksCache = { expiresAt: 0, keys: [] };
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};
const uploadAssetDir = path.join(__dirname, "assets", "uploads");
const gestionBackupDir = path.resolve(__dirname, "..", "sistema-gestion", "respaldos");
const REPAIR_STATUSES = [
  "Pendiente",
  "Ingresado",
  "En diagnóstico",
  "Presupuestado",
  "Esperando aprobación",
  "Esperando repuesto",
  "En reparación",
  "Control de calidad",
  "Listo para retirar",
  "Listo para entregar",
  "Entregado",
  "Cancelado",
];
const QUOTE_STATUSES = ["Borrador", "Enviado", "Aprobado", "Rechazado", "Vencido"];
const QA_STATUSES = ["Pendiente", "Aprobado", "Rechazado"];

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, {
      ok: false,
      error: error.message,
    });
  });
});

async function handleRequest(request, response) {
  applyCorsHeaders(request, response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
  const urlPath = decodeURIComponent(url.pathname);

  if (urlPath === "/api/health") {
    const database = await getDatabaseHealth();
    sendJson(response, 200, {
      ok: true,
      app: "beim",
      storageMode: getStorageMode(),
      database,
      serverTime: new Date().toISOString(),
    });
    return;
  }

  if (urlPath === "/beim/config.js") {
    sendClientConfig(response);
    return;
  }

  if (urlPath === "/api/catalog/bootstrap" && request.method === "GET") {
    const [settings, categories, products, promoSlides] = await Promise.all([
      getStoreSettings(),
      getCategories("web"),
      getProducts(),
      getPromoSlides(),
    ]);
    sendJson(response, 200, {
      ok: true,
      settings,
      categories,
      products: products
        .filter((product) => categories.some((category) => category.id === product.category))
        .map(toPublicCatalogProduct),
      promoSlides,
    });
    return;
  }

  if (urlPath === "/api/gestion/bootstrap" && request.method === "GET") {
    const [clients, receipts, categories, webCategories, products, services, serviceCategories, financialState, paymentMovements] = await Promise.all([
      getGestionClients(),
      searchBeimReceipts(""),
      getCategories("gestion"),
      getCategories("web"),
      getProducts(),
      getGestionServices(),
      getGestionServiceCategories(),
      getGestionFinancialState(),
      getGestionPaymentMovements(),
    ]);
    const sales = receipts.filter((receipt) => receipt.payload?.saleId).map((receipt) => {
      const payload = receipt.payload || {};
      const order = mapReceiptToGestionOrder(receipt);
      const items = (Array.isArray(payload.items) ? payload.items : []).map((item) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        total: Number(item.total || (Number(item.unitPrice || 0) * Number(item.quantity || 0))),
        unitCost: Number(item.unitCost || 0),
        costTotal: Number(item.costTotal || (Number(item.unitCost || 0) * Number(item.quantity || 0)))
      }));
      return {
        id: payload.saleId, number: payload.saleNumber || order.number, orderId: order.id, orderNumber: order.number, receiptId: receipt.id,
        clientId: payload.clientId || "client-default", clientName: payload.clientName || receipt.clientName || "Default",
        paymentMethod: payload.paymentMethod || "Efectivo", payments: Array.isArray(payload.payments) ? payload.payments : [], items,
        productId: items[0]?.productId || "", productDescription: items.map((item) => item.productDescription).filter(Boolean).join(" + "),
        quantity: items.reduce((sum, item) => sum + item.quantity, 0), total: Number(payload.total || receipt.price || items.reduce((sum, item) => sum + item.total, 0)),
        costTotal: items.reduce((sum, item) => sum + item.costTotal, 0), date: payload.entryDate || receipt.entryDate || String(receipt.createdAt || "").slice(0, 10), createdAt: receipt.createdAt
      };
    });
    sendJson(response, 200, {
      ok: true,
      clients,
      orders: receipts.map((receipt) => ({ ...mapReceiptToGestionOrder(receipt), paymentMovements: paymentMovements.filter((movement) => movement.receiptId === receipt.id) })),
      productCategories: categories.map(mapCategoryToGestionCategory),
      webProductCategories: webCategories.map(mapCategoryToGestionCategory),
      products: products.map(mapProductToGestionProduct),
      services,
      serviceCategories,
      sales,
      expenses: [],
      financialState,
    });
    return;
  }

  if (urlPath === "/api/gestion/financial-state" && request.method === "PUT") {
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.actorId, ["administrador", "caja"]);
    const capitalInitial = Math.max(0, Number(body.capitalInitial || 0));
    const expenses = Array.isArray(body.expenses) ? body.expenses : [];
    const menuItems = Array.isArray(body.menuItems) ? body.menuItems : [];
    const accountingState = body.accountingState && typeof body.accountingState === "object" ? body.accountingState : {};
    const preferences = body.preferences && typeof body.preferences === "object" ? body.preferences : {};
    const result = await query(`
      insert into gestion_financial_state (singleton_id, capital_initial, expenses, menu_items, accounting_state, preferences, updated_at)
      values (1, $1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, now())
      on conflict (singleton_id) do update set capital_initial=excluded.capital_initial, expenses=excluded.expenses, menu_items=excluded.menu_items, accounting_state=excluded.accounting_state, preferences=excluded.preferences, updated_at=now()
      returning *
    `, [capitalInitial, JSON.stringify(expenses), JSON.stringify(menuItems), JSON.stringify(accountingState), JSON.stringify(preferences)]);
    sendJson(response, 200, { ok: true, financialState: mapGestionFinancialState(result.rows[0]) });
    return;
  }

  if (urlPath === "/api/gestion/backups" && request.method === "POST") {
    const body = await readJsonBody(request);
    const snapshot = body?.snapshot;
    assert(snapshot && typeof snapshot === "object", "El respaldo no contiene datos válidos.");
    await fs.promises.mkdir(gestionBackupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `respaldo-automatico-${stamp}.json`;
    const target = path.join(gestionBackupDir, filename);
    await fs.promises.writeFile(target, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), snapshot }, null, 2), "utf8");
    const files = (await fs.promises.readdir(gestionBackupDir))
      .filter((name) => /^respaldo-automatico-.*\.json$/i.test(name))
      .sort()
      .reverse();
    await Promise.all(files.slice(30).map((name) => fs.promises.unlink(path.join(gestionBackupDir, name)).catch(() => {})));
    sendJson(response, 201, { ok: true, filename, savedAt: new Date().toISOString() });
    return;
  }

  if (urlPath === "/api/gestion/backups" && request.method === "GET") {
    await fs.promises.mkdir(gestionBackupDir, { recursive: true });
    const files = (await fs.promises.readdir(gestionBackupDir))
      .filter((name) => /^respaldo-automatico-.*\.json$/i.test(name))
      .sort()
      .reverse();
    sendJson(response, 200, { ok: true, backups: files });
    return;
  }

  if (urlPath === "/api/gestion/stock-movements" && request.method === "GET") {
    const productId = String(url.searchParams.get("productId") || "").trim();
    const params = [];
    const where = productId ? "where movement.product_id = $1" : "";
    if (productId) params.push(productId);
    const result = await query(`select movement.*, product.name as product_name from gestion_stock_movements movement left join products product on product.id = movement.product_id ${where} order by movement.created_at desc limit 500`, params);
    sendJson(response, 200, { ok: true, movements: result.rows.map(mapGestionStockMovement) });
    return;
  }

  if (urlPath === "/api/gestion/cash-sessions" && request.method === "GET") {
    const result = await query("select * from gestion_cash_sessions order by business_date desc limit 120");
    sendJson(response, 200, { ok: true, sessions: result.rows.map(mapGestionCashSession) });
    return;
  }

  if (urlPath === "/api/gestion/management-login" && request.method === "POST") {
    const body = await readJsonBody(request);
    const username = String(body.username || "").trim().toLowerCase();
    const result = await query("select * from gestion_users where lower(username)=$1 and active=true limit 1", [username]);
    assert(result.rowCount && verifyPassword(String(body.password || ""), result.rows[0].password_hash), "Usuario o contraseña incorrectos.");
    await query("update gestion_users set last_login_at=now() where id=$1", [result.rows[0].id]);
    sendJson(response, 200, { ok: true, user: mapGestionUser(result.rows[0]), rolePermissions: await getGestionRolePermissions() });
    return;
  }

  if (urlPath === "/api/gestion/management-setup-status" && request.method === "GET") {
    const result = await query("select count(*)::integer as count from gestion_users");
    sendJson(response, 200, { ok: true, needsSetup: Number(result.rows[0]?.count || 0) === 0 });
    return;
  }

  if (urlPath === "/api/gestion/management-setup" && request.method === "POST") {
    const count = await query("select count(*)::integer as count from gestion_users");
    assert(Number(count.rows[0]?.count || 0) === 0, "La configuración inicial ya fue completada.");
    const body = await readJsonBody(request);
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    assert(username.length >= 3 && password.length >= 8, "Usa un nombre de al menos 3 caracteres y una contraseña de al menos 8.");
    const result = await query("insert into gestion_users (username,name,password_hash,role) values ($1,$2,$3,'administrador_principal') returning *", [username, String(body.name || "Administrador principal"), hashPassword(password)]);
    sendJson(response, 201, { ok: true, user: mapGestionUser(result.rows[0]) });
    return;
  }

  if (urlPath === "/api/gestion/management-users" && request.method === "GET") {
    const actor = await getGestionActor(url.searchParams.get("actorId"));
    assert(isGestionAdmin(actor), "Solo un administrador puede consultar usuarios.");
    const result = await query("select * from gestion_users order by name, username");
    sendJson(response, 200, { ok: true, users: result.rows.map(mapGestionUser) });
    return;
  }

  if (urlPath === "/api/gestion/management-users" && request.method === "POST") {
    const body = await readJsonBody(request);
    const actor = await getGestionActor(body.actorId);
    assert(isGestionAdmin(actor), "Solo un administrador puede crear usuarios.");
    const username = String(body.username || "").trim().toLowerCase();
    const role = String(body.role || "vendedor");
    assert(username.length >= 3 && String(body.password || "").length >= 8, "Completa usuario y contraseña de al menos 8 caracteres.");
    assert(["administrador", "vendedor", "tecnico", "caja"].includes(role), "El rol seleccionado no es válido.");
    assert(role !== "administrador" || actor.role === "administrador_principal", "Solo el administrador principal puede crear otros administradores.");
    const result = await query(`
      insert into gestion_users (username,name,password_hash,role,web_user_id)
      values ($1,$2,$3,$4,case when $4='administrador' then (select id from users where role='admin' and is_approved=true order by case when lower(username) in ('administrador','admin') then 0 else 1 end, created_at limit 1) else null end)
      returning *
    `, [username, String(body.name || username), hashPassword(String(body.password)), role]);
    await writeAuditLog({ action: "management_user_created", entityType: "gestion_user", entityId: result.rows[0].id, details: { username, role, actorId: actor.id } });
    sendJson(response, 201, { ok: true, user: mapGestionUser(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/management-users\/[^/]+$/) && request.method === "PATCH") {
    const id = urlPath.split("/").pop();
    const body = await readJsonBody(request);
    const actor = await getGestionActor(body.actorId);
    assert(isGestionAdmin(actor), "Solo un administrador puede modificar usuarios.");
    const role = String(body.role || "vendedor");
    assert(["administrador_principal", "administrador", "vendedor", "tecnico", "caja"].includes(role), "Rol no válido.");
    const target = await getGestionActor(id);
    assert(target?.role !== "administrador_principal" || actor.role === "administrador_principal", "Solo el administrador principal puede modificar esa cuenta.");
    assert(target?.role !== "administrador" || actor.role === "administrador_principal", "Solo el administrador principal puede modificar administradores.");
    assert(role !== "administrador" || actor.role === "administrador_principal", "Solo el administrador principal puede asignar permisos de administrador.");
    assert(role !== "administrador_principal" || target?.role === "administrador_principal", "El rol de administrador principal es único y no puede asignarse a otra cuenta.");
    if (body.webUserId) await assertCompatibleWebRole(role, body.webUserId);
    const result = await query("update gestion_users set role=$2, active=$3, web_user_id=$4, updated_at=now() where id=$1 returning *", [id, role, body.active !== false, body.webUserId || null]);
    assert(result.rowCount, "No encontramos el usuario.");
    sendJson(response, 200, { ok: true, user: mapGestionUser(result.rows[0]) });
    return;
  }

  if (urlPath === "/api/gestion/management-role-permissions" && request.method === "GET") {
    const actor = await getGestionActor(url.searchParams.get("actorId"));
    assert(actor, "La sesión no es válida.");
    sendJson(response, 200, { ok: true, permissions: await getGestionRolePermissions() });
    return;
  }

  if (urlPath === "/api/gestion/management-role-permissions" && request.method === "PUT") {
    const body = await readJsonBody(request);
    const actor = await getGestionActor(body.actorId);
    assert(actor?.role === "administrador_principal", "Solo el administrador principal puede configurar permisos.");
    const role = String(body.role || "");
    assert(["administrador", "vendedor", "tecnico", "caja"].includes(role), "Rol no válido.");
    const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.map(String))] : [];
    await query("insert into gestion_role_permissions(role,permissions,updated_at) values($1,$2::jsonb,now()) on conflict(role) do update set permissions=excluded.permissions,updated_at=now()", [role, JSON.stringify(permissions)]);
    sendJson(response, 200, { ok: true, permissions: await getGestionRolePermissions() });
    return;
  }

  if (urlPath === "/api/gestion/management-web-users" && request.method === "GET") {
    const actor = await getGestionActor(url.searchParams.get("actorId"));
    assert(isGestionAdmin(actor), "Solo un administrador puede vincular cuentas web.");
    const result = await query("select * from users where is_approved=true or role in ('admin','superadmin') order by role desc,name,username");
    sendJson(response, 200, { ok: true, users: result.rows.map(mapUserRow) });
    return;
  }

  if (urlPath === "/api/gestion/management-web-launch" && request.method === "POST") {
    const body = await readJsonBody(request);
    const actor = await getGestionActor(body.actorId);
    assert(actor, "La sesión no es válida.");
    const result = await query("select u.* from gestion_users g join users u on u.id=g.web_user_id where g.id=$1 and g.active=true limit 1", [actor.id]);
    assert(result.rowCount, "Tu usuario no tiene una cuenta de la web vinculada. Un administrador debe configurarla.");
    await assertCompatibleWebRole(actor.role, result.rows[0].id);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await query("insert into gestion_web_access_tokens(token_hash,web_user_id,gestion_user_id,expires_at) values($1,$2,$3,now()+interval '90 seconds')", [tokenHash, result.rows[0].id, actor.id]);
    const launchUrl = `http://${request.headers.host || `${host}:${port}`}${publicBasePath}/?gestionAccess=${encodeURIComponent(rawToken)}`;
    sendJson(response, 200, { ok: true, url: launchUrl });
    return;
  }

  if (urlPath === "/api/gestion/cash-sessions/open" && request.method === "POST") {
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.actorId, ["administrador", "caja"]);
    const businessDate = String(body.businessDate || new Date().toISOString().slice(0, 10));
    const openingAmount = Number(body.openingAmount || 0);
    assert(Number.isFinite(openingAmount) && openingAmount >= 0, "El monto de apertura no es válido.");
    const result = await query(`insert into gestion_cash_sessions (business_date, opening_amount, status, opened_at) values ($1,$2,'open',now()) on conflict (business_date) do update set opening_amount = case when gestion_cash_sessions.status = 'open' then excluded.opening_amount else gestion_cash_sessions.opening_amount end returning *`, [businessDate, openingAmount]);
    await writeAuditLog({ action: "cash_session_opened", entityType: "cash_session", entityId: result.rows[0].id, details: { businessDate, openingAmount, actorId: body.actorId || "", actorName: body.actorName || "" } });
    sendJson(response, 201, { ok: true, session: mapGestionCashSession(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/cash-sessions\/[^/]+\/close$/) && request.method === "POST") {
    const id = urlPath.split("/").at(-2);
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.actorId, ["administrador", "caja"]);
    const expectedAmount = Number(body.expectedAmount || 0);
    const countedAmount = Number(body.countedAmount || 0);
    assert(Number.isFinite(expectedAmount) && Number.isFinite(countedAmount) && countedAmount >= 0, "Los valores del arqueo no son válidos.");
    const result = await query(`update gestion_cash_sessions set expected_amount=$2, counted_amount=$3, difference=$3-$2, notes=$4, status='closed', closed_at=now(), updated_at=now() where id=$1 and status='open' returning *`, [id, expectedAmount, countedAmount, String(body.notes || "")]);
    assert(result.rowCount, "La caja ya estaba cerrada o no existe.");
    await writeAuditLog({ action: "cash_session_closed", entityType: "cash_session", entityId: id, details: { expectedAmount, countedAmount, difference: countedAmount - expectedAmount, actorId: body.actorId || "", actorName: body.actorName || "" } });
    sendJson(response, 200, { ok: true, session: mapGestionCashSession(result.rows[0]) });
    return;
  }

  if (urlPath === "/api/gestion/clients" && request.method === "POST") {
    const body = await readJsonBody(request);
    const client = await createGestionClient(body);
    sendJson(response, 201, { ok: true, client });
    return;
  }

  if (urlPath === "/api/gestion/services" && request.method === "POST") {
    const body = await readJsonBody(request);
    const service = await saveGestionService(body);
    sendJson(response, 201, { ok: true, service });
    return;
  }

  if (urlPath === "/api/gestion/service-categories" && request.method === "POST") {
    const body = await readJsonBody(request);
    const category = await createGestionServiceCategory(body);
    sendJson(response, 201, { ok: true, category });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/service-categories\/[^/]+$/) && request.method === "DELETE") {
    const categoryId = decodeURIComponent(urlPath.split("/").pop());
    await query("delete from gestion_service_categories where id = $1", [categoryId]);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/services\/[^/]+$/) && request.method === "PUT") {
    const serviceId = decodeURIComponent(urlPath.split("/").pop());
    const body = await readJsonBody(request);
    const service = await saveGestionService(body, serviceId);
    sendJson(response, 200, { ok: true, service });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/services\/[^/]+$/) && request.method === "DELETE") {
    const serviceId = decodeURIComponent(urlPath.split("/").pop());
    await query("delete from gestion_services where id = $1", [serviceId]);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/gestion/sales-batch" && request.method === "POST") {
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.actorId, ["administrador", "vendedor", "caja"]);
    const saleId = String(body.saleId || "").trim();
    const items = Array.isArray(body.items) ? body.items.map((item) => ({
      productId: String(item.productId || "").trim(),
      quantity: Number(item.quantity || 0),
      productDescription: String(item.productDescription || "").trim(),
      serviceId: String(item.serviceId || "").trim()
    })) : [];
    assert(saleId && items.length, "La venta debe contener al menos un producto.");
    assert(items.every((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0), "Hay productos con cantidades inválidas.");
    const existingSale = await query("select * from beim_receipts where payload ->> 'saleId' = $1 limit 1", [saleId]);
    if (existingSale.rowCount) {
      const receipt = mapBeimReceiptRow(existingSale.rows[0]);
      sendJson(response, 200, { ok: true, duplicate: true, products: [], receipt, order: mapReceiptToGestionOrder(receipt) });
      return;
    }
    const transactionResult = await withTransaction(async (client) => {
      const soldProducts = [];
      for (const item of items) {
        const updated = await client.query(`update products set stock = stock - $2, updated_at = now() where id = $1 and stock >= $2 returning *`, [item.productId, item.quantity]);
        if (!updated.rowCount) {
          const current = await client.query("select name, stock from products where id = $1 limit 1", [item.productId]);
          assert(current.rowCount, "No encontramos uno de los productos seleccionados.");
          throw new Error(`No hay stock suficiente para ${current.rows[0].name}. Stock disponible: ${Number(current.rows[0].stock || 0)}.`);
        }
        const product = mapProductToGestionProduct(mapProductRow(updated.rows[0]));
        let unitPrice = Number(product.salePrice || product.price || 0);
        if (item.serviceId) {
          const serviceResult = await client.query("select id, name, sale_price from gestion_services where id = $1 and active = true limit 1", [item.serviceId]);
          assert(serviceResult.rowCount, "El servicio seleccionado ya no está disponible.");
          unitPrice = Number(serviceResult.rows[0].sale_price || 0);
          item.productDescription = serviceResult.rows[0].name || item.productDescription;
        }
        await insertGestionStockMovement(client, { productId: item.productId, movementType: "sale", quantity: -item.quantity, balanceAfter: product.stock, referenceType: "sale", referenceId: saleId, detail: item.productDescription || product.name });
        soldProducts.push({ ...product, soldQuantity: item.quantity, productDescription: item.productDescription || product.name, unitPrice, serviceId: item.serviceId });
      }
      const total = soldProducts.reduce((sum, product) => sum + Number(product.unitPrice || 0) * product.soldQuantity, 0);
      const salePayload = {
        orderType: "sale", saleId, total, items: soldProducts.map((product) => ({ productId: product.id, serviceId: product.serviceId || "", quantity: product.soldQuantity, productDescription: product.productDescription, unitPrice: Number(product.unitPrice || 0), total: Number(product.unitPrice || 0) * product.soldQuantity, unitCost: Number(product.costPrice || 0), costTotal: Number(product.costPrice || 0) * product.soldQuantity })),
        clientName: String(body.clientName || "Default"), clientId: String(body.clientId || ""), clientPhone: String(body.clientPhone || ""),
        deviceBrand: "Venta", deviceModel: soldProducts.map((product) => product.productDescription).join(" + "), deviceColor: "-",
        services: soldProducts.map((product) => `Venta: ${product.productDescription} x ${product.soldQuantity}`),
        serviceItems: soldProducts.map((product) => ({ description: product.productDescription, quantity: product.soldQuantity, price: Number(product.unitPrice || 0) * product.soldQuantity, approvalStatus: "Aprobado", source: product.serviceId ? "service" : "sale" })),
        reportedIssue: "Orden de venta", visualItems: [], entryDate: String(body.date || new Date().toISOString().slice(0, 10)), price: String(total),
        paymentStatus: String(body.paymentStatus || "Pagado"), paymentMethod: String(body.paymentMethod || "Efectivo"), payments: Array.isArray(body.payments) ? body.payments : [], terms: "Venta de productos realizada en el local."
      };
      const receiptResult = await client.query(`insert into beim_receipts (repair_status, client_name, client_id, client_phone, device_brand, device_model, device_color, services, reported_issue, visual_items, entry_date_text, delivery_time, delivery_unit, warranty_offered, price, payment_status, unlock_code, unlock_password, unlock_pattern, terms, payload) values ($1,$2,$3,$4,$5,$6,$7,$8::text[],$9,$10::text[],$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb) returning *`, ["Entregado", salePayload.clientName, salePayload.clientId, salePayload.clientPhone, salePayload.deviceBrand, salePayload.deviceModel, salePayload.deviceColor, salePayload.services, salePayload.reportedIssue, salePayload.visualItems, salePayload.entryDate, "Inmediata", "", "-", salePayload.price, salePayload.paymentStatus, "", "", "", salePayload.terms, JSON.stringify(salePayload)]);
      return { soldProducts, total, salePayload, receipt: mapBeimReceiptRow(receiptResult.rows[0]) };
    });
    await upsertGestionClientFromReceipt(transactionResult.salePayload);
    await writeAuditLog({ action: "gestion_sale_created", entityType: "sale", entityId: saleId, details: { items: transactionResult.salePayload.items, total: transactionResult.total, paymentMethod: transactionResult.salePayload.paymentMethod, actorId: body.actorId || "", actorName: body.actorName || "" } });
    sendJson(response, 201, { ok: true, products: transactionResult.soldProducts, receipt: transactionResult.receipt, order: mapReceiptToGestionOrder(transactionResult.receipt) });
    return;
  }

  if (urlPath === "/api/gestion/sales" && request.method === "POST") {
    const body = await readJsonBody(request);
    const saleId = String(body.saleId || "").trim();
    const productId = String(body.productId || "").trim();
    const quantity = Number(body.quantity || 0);
    assert(productId, "Selecciona un producto para registrar la venta.");
    assert(Number.isInteger(quantity) && quantity > 0, "La cantidad de la venta no es valida.");
    if (saleId) {
      const existingSale = await query("select * from beim_receipts where payload ->> 'saleId' = $1 limit 1", [saleId]);
      if (existingSale.rowCount) {
        const currentProduct = await query("select * from products where id = $1 limit 1", [productId]);
        const receipt = mapBeimReceiptRow(existingSale.rows[0]);
        sendJson(response, 200, { ok: true, duplicate: true, product: currentProduct.rowCount ? mapProductToGestionProduct(mapProductRow(currentProduct.rows[0])) : null, receipt, order: mapReceiptToGestionOrder(receipt) });
        return;
      }
    }

    const result = await query(`
      update products
      set stock = stock - $2,
          updated_at = now()
      where id = $1
        and stock >= $2
      returning *
    `, [productId, quantity]);

    if (!result.rowCount) {
      const current = await query("select name, stock from products where id = $1 limit 1", [productId]);
      assert(current.rowCount, "No encontramos el producto seleccionado.");
      throw new Error(`No hay stock suficiente para ${current.rows[0].name}. Stock disponible: ${Number(current.rows[0].stock || 0)}.`);
    }

    const soldProduct = mapProductToGestionProduct(mapProductRow(result.rows[0]));
    const total = Number(body.total || (Number(soldProduct.salePrice || soldProduct.price || 0) * quantity));
    const productDescription = String(body.productDescription || soldProduct.name || "Producto").trim();
    const salePayload = {
      orderType: "sale",
      saleId,
      clientName: String(body.clientName || "Cliente Mostrador"),
      clientId: String(body.clientId || ""),
      clientPhone: String(body.clientPhone || ""),
      deviceBrand: soldProduct.brand || "Venta",
      deviceModel: productDescription,
      deviceColor: soldProduct.color || "-",
      services: [`Venta: ${productDescription} x ${quantity}`],
      serviceItems: [{ description: productDescription, quantity, price: total, approvalStatus: "Aprobado", source: "sale" }],
      reportedIssue: "Orden de venta",
      visualItems: [],
      entryDate: String(body.date || new Date().toISOString().slice(0, 10)),
      price: String(total),
      paymentStatus: "Pagado",
      terms: "Venta de producto realizada en el local.",
    };
    const receiptResult = await query(`
      insert into beim_receipts (
        repair_status, client_name, client_id, client_phone, device_brand, device_model, device_color,
        services, reported_issue, visual_items, entry_date_text, delivery_time, delivery_unit,
        warranty_offered, price, payment_status, unlock_code, unlock_password, unlock_pattern, terms, payload, gestion_quote_items
      ) values (
        $1,$2,$3,$4,$5,$6,$7,
        $8::text[],$9,$10::text[],$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb
      ) returning *
    `, [
      "Entregado", salePayload.clientName, salePayload.clientId, salePayload.clientPhone,
      salePayload.deviceBrand, salePayload.deviceModel, salePayload.deviceColor,
      salePayload.services, salePayload.reportedIssue, salePayload.visualItems, salePayload.entryDate,
      "Inmediata", "", "-", salePayload.price, "Pagado", "", "", "", salePayload.terms,
      JSON.stringify(salePayload),
    ]);
    await upsertGestionClientFromReceipt(salePayload);
    const receipt = mapBeimReceiptRow(receiptResult.rows[0]);
    await writeAuditLog({ action: "gestion_sale_created", entityType: "sale", entityId: saleId || receipt.id, details: { productId, quantity, total, receiptId: receipt.id } });

    sendJson(response, 201, {
      ok: true,
      product: soldProduct,
      receipt,
      order: mapReceiptToGestionOrder(receipt),
    });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/sales\/[^/]+\/return$/) && request.method === "POST") {
    const saleId = urlPath.split("/").at(-2);
    const body = await readJsonBody(request);
    const requestedItems = Array.isArray(body.items) ? body.items.map((item) => ({ productId: String(item.productId || ""), quantity: Number(item.quantity || 0) })).filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0) : [];
    assert(requestedItems.length, "Selecciona al menos un producto para devolver.");
    const returned = await withTransaction(async (client) => {
      const result = await client.query("select * from beim_receipts where payload ->> 'saleId' = $1 for update", [saleId]);
      assert(result.rowCount, "No encontramos la venta.");
      const receipt = mapBeimReceiptRow(result.rows[0]);
      const payload = receipt.payload || {};
      assert(!payload.annulledAt, "Una venta anulada no admite devoluciones.");
      const soldItems = Array.isArray(payload.items) ? payload.items : [];
      const previousReturns = Array.isArray(payload.returns) ? payload.returns : [];
      const returnRecord = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), reason: String(body.reason || "Devolución de cliente"), items: [] };
      for (const requested of requestedItems) {
        const sold = soldItems.find((item) => String(item.productId) === requested.productId);
        assert(sold, "Uno de los productos no pertenece a esta venta.");
        const alreadyReturned = previousReturns.flatMap((entry) => entry.items || []).filter((item) => String(item.productId) === requested.productId).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        assert(alreadyReturned + requested.quantity <= Number(sold.quantity || 0), "La cantidad devuelta supera la cantidad vendida.");
        const updated = await client.query("update products set stock = stock + $2, updated_at = now() where id = $1 returning *", [requested.productId, requested.quantity]);
        assert(updated.rowCount, "No encontramos el producto devuelto.");
        const amount = Number(sold.unitPrice || 0) * requested.quantity;
        returnRecord.items.push({ productId: requested.productId, quantity: requested.quantity, amount, productDescription: sold.productDescription || "Producto" });
        await insertGestionStockMovement(client, { productId: requested.productId, movementType: "return", quantity: requested.quantity, balanceAfter: Number(updated.rows[0].stock || 0), referenceType: "sale", referenceId: saleId, detail: returnRecord.reason });
      }
      const nextPayload = { ...payload, returns: [...previousReturns, returnRecord] };
      const returnedTotal = nextPayload.returns.flatMap((entry) => entry.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const netTotal = Math.max(0, Number(payload.originalTotal || receipt.price || 0) - returnedTotal);
      nextPayload.originalTotal = Number(payload.originalTotal || receipt.price || 0);
      nextPayload.returnedTotal = returnedTotal;
      const updatedReceipt = await client.query("update beim_receipts set price = $2, payload = $3::jsonb, updated_at = now() where id = $1 returning *", [receipt.id, String(netTotal), JSON.stringify(nextPayload)]);
      return { returnRecord, receipt: mapBeimReceiptRow(updatedReceipt.rows[0]) };
    });
    await writeAuditLog({ action: "gestion_sale_returned", entityType: "sale", entityId: saleId, details: returned.returnRecord });
    sendJson(response, 201, { ok: true, return: returned.returnRecord, order: mapReceiptToGestionOrder(returned.receipt) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/sales\/[^/]+\/annul$/) && request.method === "POST") {
    const saleId = urlPath.split("/").at(-2);
    const body = await readJsonBody(request);
    const annulReason = String(body.reason || "").trim();
    assert(annulReason, "Debes escribir el motivo de la anulación.");
    const annulled = await withTransaction(async (client) => {
      const result = await client.query("select * from beim_receipts where payload ->> 'saleId' = $1 for update", [saleId]);
      assert(result.rowCount, "No encontramos la venta que deseas anular.");
      const receipt = mapBeimReceiptRow(result.rows[0]);
      const payload = receipt.payload || {};
      if (payload.stockRestoredAt && payload.financialReversedAt) return { duplicate: true, receipt, items: [] };

      const items = Array.isArray(payload.items) && payload.items.length
        ? payload.items
        : [{ productId: payload.productId || body.productId, quantity: payload.quantity || body.quantity }];
      const restoredAt = new Date().toISOString();
      const originalTotal = Number(payload.originalTotal || receipt.price || items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0));
      const annulledPayload = {
        ...payload,
        annulledAt: payload.annulledAt || restoredAt,
        annulReason,
        stockRestoredAt: payload.stockRestoredAt || restoredAt,
        financialReversedAt: restoredAt,
        originalTotal,
        returnedTotal: originalTotal,
        gestionPaid: 0,
      };
      for (const item of payload.stockRestoredAt ? [] : items) {
        const productId = String(item.productId || "").trim();
        const quantity = Number(item.quantity || 0);
        if (!productId || quantity <= 0) continue;
        let restored = await client.query("update products set stock = stock + $2, updated_at = now() where id = $1 returning stock", [productId, quantity]);
        if (!restored.rowCount) {
          const description = String(item.productDescription || payload.deviceModel || "Producto recuperado").trim();
          const category = await client.query("select id, name from categories where lower($1) like '%' || lower(name) || '%' order by length(name) desc limit 1", [description]);
          assert(category.rowCount, `No se pudo identificar la categoría de ${description}.`);
          const categoryName = String(category.rows[0].name || "");
          const identity = description.replace(new RegExp(categoryName, "i"), "").trim().split(/\s+/).filter(Boolean);
          const brand = identity.shift() || "Histórico";
          const model = identity.join(" ") || description;
          restored = await client.query(`
            insert into products (id, name, category_id, brand, model, color, cost_price, price, currency, stock, badge, description, product_type, min_stock, supplier_name, warranty_days)
            values ($1,$2,$3,$4,$5,'-',0,$6,'UYU',$7,'Recuperado',$8,'repuesto',0,'',0)
            returning stock
          `, [productId, description, category.rows[0].id, brand, model, Number(item.unitPrice || 0), Math.trunc(quantity), `Producto recuperado al anular la venta ${saleId}`]);
        }
        await insertGestionStockMovement(client, {
          productId,
          movementType: "sale_annulment",
          quantity,
          balanceAfter: Number(restored.rows[0].stock || 0),
          referenceType: "sale",
          referenceId: saleId,
          detail: annulReason,
        });
      }
      const updated = await client.query("update beim_receipts set repair_status = 'Cancelado', price = '0', payment_status = 'Sin abonar', payload = $2::jsonb, updated_at = now() where id = $1 returning *", [receipt.id, JSON.stringify(annulledPayload)]);
      return { duplicate: false, receipt: mapBeimReceiptRow(updated.rows[0]), items };
    });
    if (!annulled.duplicate) {
      await writeAuditLog({ action: "gestion_sale_annulled", entityType: "sale", entityId: saleId, details: { items: annulled.items, reason: annulReason } });
    }
    sendJson(response, 200, { ok: true, duplicate: annulled.duplicate, order: mapReceiptToGestionOrder(annulled.receipt) });
    return;
  }

  if (urlPath === "/api/gestion/purchases" && request.method === "POST") {
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.createdById || body.actorId, ["administrador"]);
    const purchaseId = String(body.id || body.purchaseId || "").trim();
    const productId = String(body.productId || "").trim();
    const quantity = Number(body.quantity || 0);
    const unitCost = Number(body.unitCost || 0);
    const categoryId = String(body.categoryId || "").trim();
    const brand = String(body.brand || "").trim();
    const model = String(body.model || "").trim();
    const color = String(body.color || "").trim() || "-";
    const salePrice = Number(body.salePrice || 0);
    const productName = String(body.productName || `${brand} ${model} ${color}`).trim();
    assert(productId, "Selecciona un producto para registrar la compra.");
    assert(Number.isInteger(quantity) && quantity > 0, "La cantidad comprada no es válida.");
    assert(Number.isFinite(unitCost) && unitCost >= 0, "El costo unitario no es válido.");
    assert(categoryId && brand && model, "Completa los datos del producto.");
    assert(Number.isFinite(salePrice) && salePrice >= 0, "El precio de venta no es válido.");
    if (purchaseId) {
      const duplicate = await query("select 1 from audit_logs where action = 'gestion_purchase_created' and entity_id = $1 limit 1", [purchaseId]);
      if (duplicate.rowCount) {
        const currentProduct = await query("select * from products where id = $1 limit 1", [productId]);
        sendJson(response, 200, { ok: true, duplicate: true, product: currentProduct.rowCount ? mapProductToGestionProduct(mapProductRow(currentProduct.rows[0])) : null });
        return;
      }
    }

    const result = await query(`
       update products
       set stock = stock + $2,
           cost_price = case
             when stock + $2 > 0 then ((stock * cost_price) + ($2 * $3)) / (stock + $2)
             else $3
           end,
          category_id = $4,
          brand = $5,
          model = $6,
          color = $7,
          price = $8,
          name = $9,
          updated_at = now()
      where id = $1
      returning *
    `, [productId, quantity, unitCost, categoryId, brand, model, color, salePrice, productName]);
    assert(result.rowCount, "No encontramos el producto seleccionado.");
    await insertGestionStockMovement(null, { productId, movementType: "purchase", quantity, balanceAfter: Number(result.rows[0].stock || 0), referenceType: "purchase", referenceId: purchaseId || productId, detail: `${productName} · ${body.supplier || "Sin proveedor"}` });
    await writeAuditLog({ action: "gestion_purchase_created", entityType: "purchase", entityId: purchaseId || productId, details: { productId, quantity, unitCost, supplier: body.supplier || "", actorId: body.createdById || body.actorId || "", actorName: body.createdBy || body.actorName || "" } });
    sendJson(response, 201, {
      ok: true,
      product: mapProductToGestionProduct(mapProductRow(result.rows[0])),
    });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/purchases\/[^/]+\/annul$/) && request.method === "POST") {
    const purchaseId = urlPath.split("/").at(-2);
    const body = await readJsonBody(request);
    const alreadyAnnulled = await query("select 1 from audit_logs where action = 'gestion_purchase_annulled' and entity_id = $1 limit 1", [purchaseId]);
    if (alreadyAnnulled.rowCount) {
      sendJson(response, 200, { ok: true, duplicate: true });
      return;
    }
    const created = await query("select details from audit_logs where action = 'gestion_purchase_created' and entity_id = $1 order by created_at desc limit 1", [purchaseId]);
    const details = created.rows[0]?.details || {};
    const productId = String(details.productId || body.productId || "").trim();
    const quantity = Number(details.quantity || body.quantity || 0);
    assert(productId && quantity > 0, "La compra no tiene datos suficientes para revertir el stock.");
    const result = await query("update products set stock = stock - $2, updated_at = now() where id = $1 and stock >= $2 returning *", [productId, quantity]);
    assert(result.rowCount, "No se puede anular: el stock actual es menor que la cantidad de esta compra.");
    await insertGestionStockMovement(null, { productId, movementType: "purchase_annulment", quantity: -quantity, balanceAfter: Number(result.rows[0].stock || 0), referenceType: "purchase", referenceId: purchaseId, detail: String(body.reason || "Anulación manual") });
    await writeAuditLog({ action: "gestion_purchase_annulled", entityType: "purchase", entityId: purchaseId, details: { productId, quantity, reason: String(body.reason || "Anulación manual") } });
    sendJson(response, 200, { ok: true, product: mapProductToGestionProduct(mapProductRow(result.rows[0])) });
    return;
  }

  if (urlPath === "/api/gestion/receipts/next-number" && request.method === "GET") {
    const result = await query("select greatest(coalesce(max(receipt_number), 999) + 1, 1000) as next_number from beim_receipts");
    sendJson(response, 200, { ok: true, nextNumber: Number(result.rows[0]?.next_number || 1000) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/clients\/[^/]+$/) && request.method === "DELETE") {
    const clientId = urlPath.split("/").pop();
    await query("delete from gestion_clients where id = $1", [clientId]);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/gestion/receipts" && request.method === "POST") {
    const body = await readJsonBody(request);
    validateBeimReceiptPayload(body);
    const result = await query(`
      insert into beim_receipts (
        repair_status, client_name, client_id, client_phone, device_brand, device_model, device_color,
        services, reported_issue, visual_items, entry_date_text, delivery_time, delivery_unit,
        warranty_offered, price, payment_status, unlock_code, unlock_password, unlock_pattern, terms, payload, gestion_quote_items
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,
        $8::text[],$9,$10::text[],$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb
      )
      returning *
    `, [
      "En diagnostico",
      body.clientName || "",
      body.clientId || "",
      body.clientPhone || "",
      body.deviceBrand || "",
      body.deviceModel || "",
      body.deviceColor || "",
      sanitizeTextArray(body.services),
      body.reportedIssue || "",
      sanitizeTextArray(body.visualItems),
      body.entryDate || "",
      body.deliveryTime || "",
      body.deliveryUnit || "",
      body.warrantyOffered || "",
      body.price || "",
      normalizeGestionPaymentStatus(body.paymentStatus),
      body.unlockCode || "",
      body.unlockPassword || "",
      body.unlockPattern || "",
      body.terms || "",
      JSON.stringify(body),
      JSON.stringify(normalizeGestionServiceItems(body.serviceItems || [])),
    ]);
    await upsertGestionClientFromReceipt(body);
    sendJson(response, 201, { ok: true, receipt: mapBeimReceiptRow(result.rows[0]), order: mapReceiptToGestionOrder(mapBeimReceiptRow(result.rows[0])) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/receipts\/[^/]+\/status$/) && request.method === "PATCH") {
    const receiptId = urlPath.split("/").at(-2);
    const body = await readJsonBody(request);
    const status = String(body.status || "").trim() || "En diagnostico";
    const fields = ["repair_status = $2", "updated_at = now()"];
    const values = [receiptId, status];
    if ("technicianNotes" in body) {
      values.push(String(body.technicianNotes || "").trim());
      fields.push(`diagnostic_notes = $${values.length}`);
    }
    if ("quoteTotal" in body) {
      const quoteTotal = Number(body.quoteTotal || 0);
      assert(Number.isFinite(quoteTotal) && quoteTotal >= 0, "El total del presupuesto no es válido.");
      values.push(quoteTotal);
      fields.push(`quote_total = $${values.length}`);
    }
    let normalizedServiceItems = null;
    let normalizedServiceItemsValueIndex = -1;
    if ("serviceItems" in body) {
      normalizedServiceItems = normalizeGestionServiceItems(body.serviceItems);
      values.push(JSON.stringify(normalizedServiceItems));
      normalizedServiceItemsValueIndex = values.length - 1;
      fields.push(`gestion_quote_items = $${values.length}::jsonb`);
    }
    const updatedReceipt = await withTransaction(async (client) => {
      const locked = await client.query("select id, gestion_quote_items from beim_receipts where id = $1 for update", [receiptId]);
      assert(locked.rowCount, "Orden no encontrada.");
      if (normalizedServiceItems) {
        const previousServiceItems = normalizeGestionServiceItems(locked.rows[0].gestion_quote_items || []);
        await reconcileGestionOrderItemStock(client, receiptId, previousServiceItems, normalizedServiceItems);
        await commitGestionOrderItemStock(client, receiptId, normalizedServiceItems, false);
        values[normalizedServiceItemsValueIndex] = JSON.stringify(normalizedServiceItems);
      }
      const result = await client.query(`update beim_receipts set ${fields.join(", ")} where id = $1 returning *`, values);
      return result.rows[0];
    });
    sendJson(response, 200, { ok: true, receipt: mapBeimReceiptRow(updatedReceipt), order: mapReceiptToGestionOrder(mapBeimReceiptRow(updatedReceipt)) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/receipts\/[^/]+\/payment-status$/) && request.method === "PATCH") {
    const receiptId = urlPath.split("/").at(-2);
    const body = await readJsonBody(request);
    const paymentStatus = normalizeGestionPaymentStatus(body.paymentStatus);
    const paid = Math.max(Number(body.paid || 0), 0);
    const paidAt = paid > 0 ? String(body.paidAt || new Date().toISOString()) : "";
    const updatedReceipt = await withTransaction(async (client) => {
      const currentResult = await client.query("select * from beim_receipts where id = $1 for update", [receiptId]);
      assert(currentResult.rowCount, "Orden no encontrada.");
      const current = currentResult.rows[0];
      const storedItems = Array.isArray(current.gestion_quote_items) && current.gestion_quote_items.length
        ? current.gestion_quote_items
        : (current.payload?.serviceItems || []);
      const serviceItems = normalizeGestionServiceItems(storedItems);
      const previousPaid = Math.max(Number(current.payload?.gestionPaid || 0), 0);
      const paymentDelta = paid - previousPaid;

      if (paymentStatus === "Pagado") await commitGestionOrderItemStock(client, receiptId, serviceItems, true);

      const result = await client.query(`
        update beim_receipts
        set payment_status = $2,
            gestion_quote_items = $5::jsonb,
            payload = jsonb_set(jsonb_set(coalesce(payload, '{}'::jsonb), '{gestionPaid}', to_jsonb($3::numeric), true), '{gestionPaidAt}', to_jsonb($4::text), true),
            updated_at = now()
        where id = $1
        returning *
      `, [receiptId, paymentStatus, paid, paidAt, JSON.stringify(serviceItems)]);
      if (Math.abs(paymentDelta) > 0.001) {
        await client.query(`insert into gestion_payment_movements (receipt_id, amount, payment_status, method, business_date, created_at) values ($1,$2,$3,$4,$5,$6)`, [receiptId, paymentDelta, paymentStatus, String(body.paymentMethod || "Efectivo"), String(body.businessDate || paidAt.slice(0, 10)), paidAt || new Date().toISOString()]);
      }
      return result.rows[0];
    });
    sendJson(response, 200, { ok: true, receipt: mapBeimReceiptRow(updatedReceipt), order: mapReceiptToGestionOrder(mapBeimReceiptRow(updatedReceipt)) });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/receipts\/[^/]+$/) && request.method === "DELETE") {
    const receiptId = urlPath.split("/").pop();
    await query("delete from beim_receipts where id = $1", [receiptId]);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/gestion/categories" && request.method === "POST") {
    const body = await readJsonBody(request);
    const category = await createGestionCategory(body);
    sendJson(response, 201, { ok: true, category });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/categories\/[^/]+$/) && request.method === "PATCH") {
    const categoryId = decodeURIComponent(urlPath.split("/").pop());
    const body = await readJsonBody(request);
    const category = await updateGestionCategory(categoryId, body);
    sendJson(response, 200, { ok: true, category });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/categories\/[^/]+$/) && request.method === "DELETE") {
    const categoryId = urlPath.split("/").pop();
    await deleteGestionCategory(categoryId);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/gestion/stock-transfers/web-to-workshop" && request.method === "POST") {
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.actorId, ["administrador"]);
    const sourceProductId = String(body.sourceProductId || "").trim();
    const categoryId = String(body.categoryId || "").trim();
    const quantity = Number(body.quantity || 0);
    const workshopSalePrice = Number(body.workshopSalePrice || 0);
    assert(sourceProductId && categoryId, "Selecciona el producto web y la subcategoria del taller.");
    assert(Number.isInteger(quantity) && quantity > 0, "La cantidad a transferir no es válida.");
    assert(Number.isFinite(workshopSalePrice) && workshopSalePrice >= 0, "El precio de venta del taller no es válido.");
    const transferId = `transfer-${crypto.randomUUID()}`;
    const result = await withTransaction(async (client) => {
      const sourceResult = await client.query("select * from products where id = $1 for update", [sourceProductId]);
      assert(sourceResult.rowCount, "No encontramos el producto de la web.");
      const source = sourceResult.rows[0];
      assert(!["repuesto", "servicio", "taller", "insumo", "herramienta"].includes(String(source.product_type || "").toLowerCase()), "El producto seleccionado ya pertenece al taller.");
      assert(Number(source.stock || 0) >= quantity, `No hay stock suficiente en la web. Disponible: ${Number(source.stock || 0)}.`);
      const destinationId = `workshop-web-${sourceProductId}`;
      const sourceWebPrice = Number(source.price || 0);
      const destinationResult = await client.query(`
        insert into products (id, name, category_id, brand, model, color, cost_price, price, currency, stock, badge, description, product_type, min_stock, supplier_name, warranty_days)
        values ($1,$2,$3,$4,$5,$6,$7,$8,coalesce($9,'UYU'),$10,'Taller',$11,'repuesto',0,'Stock Web',0)
        on conflict (id) do update set
          category_id=excluded.category_id, cost_price=excluded.cost_price, price=excluded.price,
          stock=products.stock + excluded.stock, updated_at=now()
        returning *
      `, [destinationId, source.name, categoryId, source.brand || "-", source.model || source.name, source.color || "-", sourceWebPrice, workshopSalePrice, source.currency, quantity, `Transferido desde la web: ${sourceProductId}`]);
      const sourceUpdated = await client.query("update products set stock=stock-$2, updated_at=now() where id=$1 returning *", [sourceProductId, quantity]);
      const destination = mapProductToGestionProduct(mapProductRow(destinationResult.rows[0]));
      await insertGestionStockMovement(client, { productId: sourceProductId, movementType: "web_transfer_out", quantity: -quantity, balanceAfter: Number(sourceUpdated.rows[0].stock || 0), referenceType: "stock_transfer", referenceId: transferId, detail: `Salida hacia taller: ${source.name}` });
      await insertGestionStockMovement(client, { productId: destinationId, movementType: "web_transfer_in", quantity, balanceAfter: destination.stock, referenceType: "stock_transfer", referenceId: transferId, detail: `Ingreso desde web a ${sourceWebPrice} por unidad` });
      return { source: mapProductToGestionProduct(mapProductRow(sourceUpdated.rows[0])), destination, sourceWebPrice };
    });
    await writeAuditLog({ actorUserId: body.actorId || null, action: "gestion_web_stock_transferred", entityType: "stock_transfer", entityId: transferId, details: { sourceProductId, destinationProductId: result.destination.id, quantity, sourceWebPrice: result.sourceWebPrice, workshopSalePrice, actorName: body.actorName || "" } });
    sendJson(response, 201, { ok: true, transferId, sourceProduct: result.source, workshopProduct: result.destination });
    return;
  }

  if (urlPath === "/api/gestion/products" && request.method === "POST") {
    const body = await readJsonBody(request);
    await requireGestionRoleIfConfigured(body.createdById || body.actorId, ["administrador"]);
    const product = await createGestionProduct(body);
    if (Number(product.stock || 0) > 0) await insertGestionStockMovement(null, { productId: product.id, movementType: "initial_stock", quantity: Number(product.stock), balanceAfter: Number(product.stock), referenceType: "product", referenceId: product.id, detail: "Carga inicial del producto" });
    sendJson(response, 201, { ok: true, product });
    return;
  }

  if (urlPath.match(/^\/api\/gestion\/products\/[^/]+$/) && request.method === "DELETE") {
    const productId = urlPath.split("/").pop();
    await query("delete from products where id = $1", [productId]);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/auth/login" && request.method === "POST") {
    const body = await readJsonBody(request);
    const loginValue = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!loginValue || !password) {
      sendJson(response, 400, { ok: false, error: "Completá usuario y contraseña." });
      return;
    }
    const result = await query(`
      select *
      from users
      where lower(coalesce(username, '')) = $1
         or lower(coalesce(email, '')) = $1
      limit 1
    `, [loginValue]);
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      sendJson(response, 401, { ok: false, error: "Credenciales incorrectas." });
      return;
    }
    if (user.role === "cliente" && !user.is_approved) {
      sendJson(response, 403, { ok: false, error: "Tu usuario todavía no fue habilitado por administración." });
      return;
    }
    await writeAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.login",
      entityType: "user",
      entityId: String(user.id),
      details: { username: user.username, email: user.email },
    });
    sendJson(response, 200, { ok: true, user: mapUserRow(user) });
    return;
  }

  if (urlPath === "/api/auth/gestion-access" && request.method === "POST") {
    const body = await readJsonBody(request);
    const tokenHash = crypto.createHash("sha256").update(String(body.token || "")).digest("hex");
    const consumed = await withTransaction(async (client) => {
      const token = await client.query("delete from gestion_web_access_tokens where token_hash=$1 and expires_at>now() returning web_user_id", [tokenHash]);
      if (!token.rowCount) return null;
      const user = await client.query("select * from users where id=$1 limit 1", [token.rows[0].web_user_id]);
      return user.rows[0] || null;
    });
    assert(consumed, "El acceso vinculado venció o ya fue utilizado.");
    sendJson(response, 200, { ok: true, user: mapUserRow(consumed) });
    return;
  }

  if (urlPath === "/api/auth/register" && request.method === "POST") {
    const body = await readJsonBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const password = String(body.password || "");
    validateEmail(email);
    validatePassword(password);
    if (!email || !password || !firstName) {
      sendJson(response, 400, { ok: false, error: "Completá los datos obligatorios del registro." });
      return;
    }
    const existing = await query("select id from users where lower(email) = $1 limit 1", [email]);
    if (existing.rowCount) {
      sendJson(response, 409, { ok: false, error: "Ese email ya existe." });
      return;
    }
    const fullName = `${firstName} ${lastName}`.trim();
    const inserted = await query(`
      insert into users (
        name, first_name, last_name, username, email, password_hash, role, phone, company, ci, rut,
        department, locality, address, website, trade_references, is_wholesaler, is_approved
      )
      values (
        $1, $2, $3, $4, $5, $6, 'cliente', $7, $8, $9, $10,
        $11, $12, $13, $14, $15, false, false
      )
      returning *
    `, [
      fullName,
      firstName,
      lastName,
      email,
      email,
      hashPassword(password),
      body.phone || "",
      body.company || "",
      body.ci || "",
      body.rut || "",
      body.department || "",
      body.locality || "",
      body.address || "",
      body.website || "",
      body.references || "",
    ]);
    sendJson(response, 201, {
      ok: true,
      message: "Tu registro fue enviado. Un administrador debe habilitar tu acceso antes de entrar al sitio.",
      user: mapUserRow(inserted.rows[0]),
    });
    await writeAuditLog({
      actorUserId: inserted.rows[0].id,
      actorRole: inserted.rows[0].role,
      action: "auth.register",
      entityType: "user",
      entityId: String(inserted.rows[0].id),
      details: { email },
    });
    return;
  }

  if (urlPath === "/api/auth/google" && request.method === "POST") {
    if (!googleClientId) {
      sendJson(response, 503, { ok: false, error: "Google Login no está configurado en el servidor." });
      return;
    }
    const body = await readJsonBody(request);
    const credential = String(body.credential || "").trim();
    if (!credential) {
      sendJson(response, 400, { ok: false, error: "Falta la credencial de Google." });
      return;
    }
    const profile = await verifyGoogleCredential(credential);
    if (!profile.email || !profile.emailVerified) {
      sendJson(response, 403, { ok: false, error: "Google no confirmo el email de la cuenta." });
      return;
    }
    const user = await findOrCreateGoogleUser(profile);
    await writeAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.google",
      entityType: "user",
      entityId: String(user.id),
      details: { email: user.email },
    });
    sendJson(response, 200, { ok: true, user: mapUserRow(user) });
    return;
  }

  if (urlPath === "/api/auth/facebook" && request.method === "POST") {
    if (!facebookAppId) {
      sendJson(response, 503, { ok: false, error: "Facebook Login no está configurado en el servidor." });
      return;
    }
    const body = await readJsonBody(request);
    const accessToken = String(body.accessToken || "").trim();
    if (!accessToken) {
      sendJson(response, 400, { ok: false, error: "Falta la credencial de Facebook." });
      return;
    }
    const profile = await verifyFacebookCredential(accessToken);
    if (!profile.email) {
      sendJson(response, 403, { ok: false, error: "Facebook no entrego un email para crear la cuenta." });
      return;
    }
    const user = await findOrCreateFacebookUser(profile);
    await writeAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.facebook",
      entityType: "user",
      entityId: String(user.id),
      details: { email: user.email },
    });
    sendJson(response, 200, { ok: true, user: mapUserRow(user) });
    return;
  }

  if (urlPath === "/api/users" && request.method === "GET") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const result = await query(`
      select *
      from users
      ${actor.role === "admin" ? "where role <> 'superadmin'" : ""}
      order by created_at desc, name asc
    `);
    sendJson(response, 200, { ok: true, users: result.rows.map(mapUserRow) });
    return;
  }

  if (urlPath === "/api/orders" && request.method === "GET") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin", "cliente"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const orders = ["admin", "superadmin"].includes(actor.role)
      ? await getOrders()
      : await getOrders("", actor.id);
    sendJson(response, 200, { ok: true, orders });
    return;
  }

  if (urlPath === "/api/beim/receipts/next-number" && request.method === "GET") {
    const actor = await getActorFromRequest(url);
    if (!canAccessBeimReceipts(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const result = await query("select greatest(coalesce(max(receipt_number), 999) + 1, 1000) as next_number from beim_receipts");
    sendJson(response, 200, { ok: true, nextNumber: Number(result.rows[0]?.next_number || 1000) });
    return;
  }

  if (urlPath === "/api/beim/receipts" && request.method === "GET") {
    const actor = await getActorFromRequest(url);
    if (!canAccessBeimReceipts(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const search = String(url.searchParams.get("query") || "").trim();
    const receipts = await searchBeimReceipts(search);
    sendJson(response, 200, { ok: true, receipts });
    return;
  }

  if (urlPath === "/api/beim/receipts" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    if (!canAccessBeimReceipts(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateBeimReceiptPayload(body);
    const result = await query(`
      insert into beim_receipts (
        user_id, client_name, client_id, client_phone, device_brand, device_model, device_color,
        services, reported_issue, visual_items, entry_date_text, delivery_time, delivery_unit,
        warranty_offered, price, unlock_code, unlock_password, unlock_pattern, terms, payload, gestion_quote_items
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,
        $8::text[],$9,$10::text[],$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20::jsonb,$21::jsonb
      )
      returning *
    `, [
      actor.id,
      body.clientName || "",
      body.clientId || "",
      body.clientPhone || "",
      body.deviceBrand || "",
      body.deviceModel || "",
      body.deviceColor || "",
      sanitizeTextArray(body.services),
      body.reportedIssue || "",
      sanitizeTextArray(body.visualItems),
      body.entryDate || "",
      body.deliveryTime || "",
      body.deliveryUnit || "",
      body.warrantyOffered || "",
      body.price || "",
      body.unlockCode || "",
      body.unlockPassword || "",
      body.unlockPattern || "",
      body.terms || "",
      JSON.stringify(body),
      JSON.stringify(normalizeGestionServiceItems(body.serviceItems || [])),
    ]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "beim_receipt.create",
      entityType: "beim_receipt",
      entityId: String(result.rows[0].receipt_number),
      details: { receiptNumber: result.rows[0].receipt_number, clientName: body.clientName || "", deviceModel: body.deviceModel || "" },
    });
    sendJson(response, 201, { ok: true, receipt: mapBeimReceiptRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/status$/) && request.method === "PATCH") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canAccessBeimReceipts(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const status = validateRepairStatus(body.status);
    const result = await query(`
      update beim_receipts
      set repair_status = $2,
          updated_at = now()
      where id = $1
      returning *
    `, [receiptId, status]);
    if (!result.rowCount) {
      sendJson(response, 404, { ok: false, error: "Boleta no encontrada." });
      return;
    }
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "beim_receipt.status",
      entityType: "beim_receipt",
      entityId: String(result.rows[0].receipt_number),
      details: { status },
    });
    sendJson(response, 200, { ok: true, receipt: mapBeimReceiptRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/workflow$/) && request.method === "GET") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canAccessBeimReceipts(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const workflow = await getBeimReceiptWorkflow(receiptId);
    if (!workflow) {
      sendJson(response, 404, { ok: false, error: "Boleta no encontrada." });
      return;
    }
    sendJson(response, 200, { ok: true, workflow });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/workflow$/) && request.method === "PATCH") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canManageBeimWorkflow(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const receipt = await updateBeimReceiptWorkflow(receiptId, body, actor);
    if (!receipt) {
      sendJson(response, 404, { ok: false, error: "Boleta no encontrada." });
      return;
    }
    sendJson(response, 200, { ok: true, receipt });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/parts$/) && request.method === "POST") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canManageBeimWorkflow(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const part = await addBeimReceiptPart(receiptId, body, actor);
    sendJson(response, 201, { ok: true, part });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/purchases$/) && request.method === "POST") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canAccessBeimReceipts(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const purchase = await addBeimReceiptPurchase(receiptId, body, actor);
    sendJson(response, 201, { ok: true, purchase });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/approve$/) && request.method === "POST") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canManageBeimWorkflow(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const workflow = await approveBeimQuote(receiptId, body, actor);
    sendJson(response, 200, { ok: true, workflow });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/qa$/) && request.method === "POST") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canManageBeimWorkflow(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const qa = await saveBeimQaChecklist(receiptId, body, actor);
    sendJson(response, 200, { ok: true, qa });
    return;
  }

  if (urlPath.match(/^\/api\/beim\/receipts\/[^/]+\/payments$/) && request.method === "POST") {
    const receiptId = urlPath.split("/")[4];
    const actor = await getActorFromRequest(url);
    if (!canManageBeimWorkflow(actor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const payment = await addBeimReceiptPayment(receiptId, body, actor);
    sendJson(response, 201, { ok: true, payment });
    return;
  }

  if (urlPath === "/api/orders" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    const body = await readJsonBody(request);
    validateOrderPayload(body, actor);
    const created = await createOrderRecord(body, actor);
    sendJson(response, 201, { ok: true, order: created.order, products: created.products });
    return;
  }

  if (urlPath === "/api/stripe/checkout-session" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    const body = await readJsonBody(request);
    const orderId = String(body.orderId || "").trim();
    assert(orderId, "Falta la orden para generar el pago con tarjeta.");
    const orders = actor?.role === "cliente"
      ? await getOrders(orderId, actor.id)
      : await getOrders(orderId);
    const order = orders[0];
    if (!order) {
      sendJson(response, 404, { ok: false, error: "Orden no encontrada." });
      return;
    }
    const session = await createStripeCheckoutSession(order, request);
    sendJson(response, 200, { ok: true, checkoutUrl: session.url, sessionId: session.id });
    return;
  }

  if (urlPath.match(/^\/api\/orders\/[^/]+\/status$/) && request.method === "PATCH") {
    const orderId = urlPath.split("/")[3];
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateOrderStatus(body.status);
    const result = await query(`
      update orders
      set status = $2,
          updated_at = now()
      where id = $1
      returning *
    `, [orderId, body.status || "Pendiente"]);
    if (!result.rowCount) {
      sendJson(response, 404, { ok: false, error: "Pedido no encontrado." });
      return;
    }
    const orders = await getOrders(orderId);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "order.status",
      entityType: "order",
      entityId: orderId,
      details: { status: body.status || "Pendiente" },
    });
    sendJson(response, 200, { ok: true, order: orders[0] });
    return;
  }

  if (urlPath.match(/^\/api\/orders\/[^/]+\/payment-status$/) && request.method === "PATCH") {
    const orderId = urlPath.split("/")[3];
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const paymentStatus = String(body.paymentStatus || "").trim();
    assert(["Pendiente de pago", "Comprobante recibido", "Pagado", "Rechazado"].includes(paymentStatus), "El estado de pago no es válido.");
    const order = await updateOrderPaymentStatus(orderId, paymentStatus, actor);
    sendJson(response, 200, { ok: true, order, products: await getProducts() });
    return;
  }

  if (urlPath === "/api/settings/store" && request.method === "PUT") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateStoreSettings(body);
    const currentSettings = await getStoreSettings();
    const payload = {
      whatsapp: body.whatsapp || "",
      ordersWhatsapp: body.ordersWhatsapp || body.whatsapp || "",
      instagram: body.instagram || "",
      companyName: body.companyName || "BEIM",
      companyRut: body.companyRut || "",
      companyAddress: body.companyAddress || "",
      companyPhone: body.companyPhone || "",
      companyEmail: body.companyEmail || "",
      heroText: body.heroText || "",
      productBrands: Array.isArray(body.productBrands) ? body.productBrands : [],
      paymentMethods: actor.role === "superadmin"
        ? normalizePaymentMethods(body.paymentMethods)
        : normalizePaymentMethods(currentSettings.paymentMethods),
    };
    await query(`
      insert into app_settings (key, value, updated_at)
      values ('store', $1::jsonb, now())
      on conflict (key)
      do update set value = excluded.value, updated_at = now()
    `, [JSON.stringify(payload)]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "settings.update",
      entityType: "settings",
      entityId: "store",
      details: payload,
    });
    sendJson(response, 200, { ok: true, settings: payload });
    return;
  }

  if (urlPath === "/api/categories" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateCategoryPayload(body);
    const sortOrder = await getNextCategorySortOrder(body.parentId || "");
    const result = await query(`
      insert into categories (id, name, code, description, parent_id, sort_order, updated_at)
      values ($1, $2, $3, $4, nullif($5, ''), $6, now())
      returning *
    `, [body.id, body.name, body.code, body.description, body.parentId || "", sortOrder]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "category.create",
      entityType: "category",
      entityId: body.id,
      details: body,
    });
    sendJson(response, 201, { ok: true, category: mapCategoryRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/categories\/[^/]+$/) && request.method === "PUT") {
    const categoryId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateCategoryPayload(body);
    const currentResult = await query("select * from categories where id = $1 limit 1", [categoryId]);
    if (!currentResult.rowCount) {
      sendJson(response, 404, { ok: false, error: "Categoría no encontrada." });
      return;
    }
    const currentCategory = currentResult.rows[0];
    const parentChanged = (currentCategory.parent_id || "") !== (body.parentId || "");
    const nextSortOrder = parentChanged
      ? await getNextCategorySortOrder(body.parentId || "")
      : Number(currentCategory.sort_order || 0);
    const result = await query(`
      update categories
      set id = $2,
          name = $3,
          code = $4,
          description = $5,
          parent_id = nullif($6, ''),
          sort_order = $7,
          updated_at = now()
      where id = $1
      returning *
    `, [categoryId, body.id, body.name, body.code, body.description, body.parentId || "", nextSortOrder]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "category.update",
      entityType: "category",
      entityId: body.id,
      details: { previousId: categoryId, ...body },
    });
    sendJson(response, 200, { ok: true, category: mapCategoryRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/categories\/[^/]+\/move$/) && request.method === "PATCH") {
    const categoryId = urlPath.split("/")[3];
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const direction = String(body.direction || "");
    if (!["up", "down"].includes(direction)) {
      sendJson(response, 400, { ok: false, error: "Dirección no válida." });
      return;
    }
    const moved = await moveCategory(categoryId, direction);
    if (!moved) {
      sendJson(response, 404, { ok: false, error: "No se pudo mover la categoría." });
      return;
    }
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "category.move",
      entityType: "category",
      entityId: categoryId,
      details: { direction },
    });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath.match(/^\/api\/categories\/[^/]+$/) && request.method === "DELETE") {
    const categoryId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const childResult = await query("select id from categories where parent_id = $1", [categoryId]);
    const idsToDelete = [categoryId, ...childResult.rows.map((row) => row.id)];
    await query("delete from products where category_id = any($1::text[])", [idsToDelete]);
    await query("delete from categories where id = any($1::text[])", [idsToDelete]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "category.delete",
      entityType: "category",
      entityId: categoryId,
      details: { deletedIds: idsToDelete },
    });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/products" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateProductPayload(body);
    body.image = materializeInlineImage(body.image, "product", body.id, { strict: true });
    const result = await query(`
      insert into products (id, name, category_id, brand, model, color, cost_price, price, currency, stock, badge, image, description, updated_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
      returning *
    `, [body.id, body.name, body.category, body.brand, body.model, body.color || "", body.costPrice, body.price, body.currency, body.stock, body.badge, body.image, body.description]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "product.create",
      entityType: "product",
      entityId: body.id,
      details: body,
    });
    sendJson(response, 201, { ok: true, product: mapProductRow(result.rows[0]) });
    return;
  }

  if (urlPath === "/api/uploads/product-image" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readUploadBody(request);
    let upload;
    try {
      upload = body.file
        ? saveUploadedImageBuffer(body.file, "product")
        : saveUploadedImage(body, "product");
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
      return;
    }
    sendJson(response, 201, { ok: true, image: upload.path });
    return;
  }

  if (urlPath.match(/^\/api\/products\/[^/]+$/) && request.method === "PUT") {
    const productId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validateProductPayload(body);
    body.image = materializeInlineImage(body.image, "product", body.id, { strict: true });
    const result = await query(`
      update products
      set id = $2,
          name = $3,
          category_id = $4,
          brand = $5,
          model = $6,
          color = $7,
          cost_price = $8,
          price = $9,
          currency = $10,
          stock = $11,
          badge = $12,
          image = $13,
          description = $14,
          updated_at = now()
      where id = $1
      returning *
    `, [productId, body.id, body.name, body.category, body.brand, body.model, body.color || "", body.costPrice, body.price, body.currency, body.stock, body.badge, body.image, body.description]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "product.update",
      entityType: "product",
      entityId: body.id,
      details: { previousId: productId, ...body },
    });
    sendJson(response, 200, { ok: true, product: mapProductRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/products\/[^/]+$/) && request.method === "DELETE") {
    const productId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    await query("delete from products where id = $1", [productId]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "product.delete",
      entityType: "product",
      entityId: productId,
      details: {},
    });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/promo-slides" && request.method === "POST") {
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validatePromoPayload(body);
    const result = await query(`
      insert into promo_slides (
        id, eyebrow, title, text, image, primary_label, primary_href, secondary_label, secondary_href,
        image_x, image_y, image_scale, image_frame_preset, image_frame_width, image_frame_height, sort_order, updated_at
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now())
      returning *
    `, [body.id, body.eyebrow, body.title, body.text, body.image, body.primaryLabel, body.primaryHref, body.secondaryLabel, body.secondaryHref, body.imageX || 50, body.imageY || 50, body.imageScale || 1, body.imageFramePreset || "default", body.imageFrameWidth || null, body.imageFrameHeight || null, body.sortOrder || 0]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "promo.create",
      entityType: "promo_slide",
      entityId: body.id,
      details: body,
    });
    sendJson(response, 201, { ok: true, slide: mapPromoSlideRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/promo-slides\/[^/]+$/) && request.method === "PUT") {
    const slideId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    validatePromoPayload(body);
    const result = await query(`
      update promo_slides
      set id = $2,
          eyebrow = $3,
          title = $4,
          text = $5,
          image = $6,
          primary_label = $7,
          primary_href = $8,
          secondary_label = $9,
          secondary_href = $10,
          image_x = $11,
          image_y = $12,
          image_scale = $13,
          image_frame_preset = $14,
          image_frame_width = $15,
          image_frame_height = $16,
          sort_order = $17,
          updated_at = now()
      where id = $1
      returning *
    `, [slideId, body.id, body.eyebrow, body.title, body.text, body.image, body.primaryLabel, body.primaryHref, body.secondaryLabel, body.secondaryHref, body.imageX || 50, body.imageY || 50, body.imageScale || 1, body.imageFramePreset || "default", body.imageFrameWidth || null, body.imageFrameHeight || null, body.sortOrder || 0]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "promo.update",
      entityType: "promo_slide",
      entityId: body.id,
      details: { previousId: slideId, ...body },
    });
    sendJson(response, 200, { ok: true, slide: mapPromoSlideRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/promo-slides\/[^/]+$/) && request.method === "DELETE") {
    const slideId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    await query("delete from promo_slides where id = $1", [slideId]);
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "promo.delete",
      entityType: "promo_slide",
      entityId: slideId,
      details: {},
    });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath.startsWith("/api/users/") && request.method === "GET") {
    const userId = urlPath.split("/").pop();
    const actor = await getActorFromRequest(url);
    if (!actor || (actor.id !== userId && !["admin", "superadmin"].includes(actor.role))) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const result = await query("select * from users where id = $1 limit 1", [userId]);
    if (!result.rowCount) {
      sendJson(response, 404, { ok: false, error: "Usuario no encontrado." });
      return;
    }
    if (actor.role === "admin" && result.rows[0].role === "superadmin") {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    sendJson(response, 200, { ok: true, user: mapUserRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/users\/[^/]+\/profile$/) && request.method === "PATCH") {
    const userId = urlPath.split("/")[3];
    const actor = await getActorFromRequest(url);
    const isAdminActor = ["admin", "superadmin"].includes(actor?.role || "");
    if (!actor || (actor.id !== userId && !isAdminActor)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    if (actor.role === "admin") {
      const target = await query("select role from users where id = $1 limit 1", [userId]);
      if (!target.rowCount || target.rows[0].role === "superadmin") {
        sendJson(response, 403, { ok: false, error: "No autorizado." });
        return;
      }
    }
    const body = await readJsonBody(request);
    const updated = isAdminActor
      ? await updateUserProfile(userId, body, false)
      : await updateUserProfile(userId, body, true);
    sendJson(response, 200, { ok: true, user: mapUserRow(updated.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/users\/[^/]+\/approval$/) && request.method === "PATCH") {
    const userId = urlPath.split("/")[3];
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const approved = Boolean(body.isApproved);
    const result = await query(`
      update users
      set is_approved = $2,
          is_wholesaler = case when $2 = false then false else is_wholesaler end,
          updated_at = now()
      where id = $1 and role = 'cliente'
      returning *
    `, [userId, approved]);
    if (!result.rowCount) {
      sendJson(response, 404, { ok: false, error: "Usuario no encontrado o no editable." });
      return;
    }
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "user.approval",
      entityType: "user",
      entityId: userId,
      details: { isApproved: approved },
    });
    sendJson(response, 200, { ok: true, user: mapUserRow(result.rows[0]) });
    return;
  }

  if (urlPath.match(/^\/api\/users\/[^/]+\/wholesale$/) && request.method === "PATCH") {
    const userId = urlPath.split("/")[3];
    const actor = await getActorFromRequest(url);
    if (!actor || !["admin", "superadmin"].includes(actor.role)) {
      sendJson(response, 403, { ok: false, error: "No autorizado." });
      return;
    }
    const body = await readJsonBody(request);
    const wholesaler = Boolean(body.isWholesaler);
    const result = await query(`
      update users
      set is_wholesaler = $2,
          updated_at = now()
      where id = $1 and role = 'cliente' and is_approved = true
      returning *
    `, [userId, wholesaler]);
    if (!result.rowCount) {
      sendJson(response, 404, { ok: false, error: "Usuario no encontrado o todavía no habilitado." });
      return;
    }
    await writeAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "user.wholesale",
      entityType: "user",
      entityId: userId,
      details: { isWholesaler: wholesaler },
    });
    sendJson(response, 200, { ok: true, user: mapUserRow(result.rows[0]) });
    return;
  }

  serveStatic(urlPath, response);
}

function serveStatic(urlPath, response) {
  if (urlPath === "/" || urlPath === publicBasePath) {
    response.writeHead(302, { Location: `${publicBasePath}/` });
    response.end();
    return;
  }

  if (urlPath === boletaPublicPath) {
    response.writeHead(302, { Location: `${boletaPublicPath}/` });
    response.end();
    return;
  }

  if (urlPath.startsWith(`${boletaPublicPath}/`)) {
    let filePathUrl = urlPath.slice(boletaPublicPath.length + 1);
    if (!filePathUrl || filePathUrl.endsWith("/")) {
      filePathUrl += "index.html";
    }

    const normalizedUrl = filePathUrl.replace(/\\/g, "/");
    const isAllowedBoletaFile =
      ["index.html", "styles.css", "store-pro.css", "script.js"].includes(normalizedUrl)
      || normalizedUrl.startsWith("assets/");
    const hasHiddenSegment = normalizedUrl.split("/").some((segment) => segment.startsWith("."));

    if (!isAllowedBoletaFile || hasHiddenSegment) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    serveFile(response, boletaRoot, normalizedUrl);
    return;
  }

  if (!urlPath.startsWith(`${publicBasePath}/`)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  let filePathUrl = urlPath.slice(publicBasePath.length + 1);
  if (!filePathUrl || filePathUrl.endsWith("/")) {
    filePathUrl += "index.html";
  }

  const normalizedUrl = filePathUrl.replace(/\\/g, "/");
  const isAllowedPublicFile =
    ["index.html", "styles.css", "store-pro.css", "script.js"].includes(normalizedUrl)
    || normalizedUrl.startsWith("assets/");
  const hasHiddenSegment = normalizedUrl.split("/").some((segment) => segment.startsWith("."));

  if (!isAllowedPublicFile || hasHiddenSegment) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  serveFile(response, publicRoot, normalizedUrl);
}

function serveFile(response, rootDir, normalizedUrl) {
  const filePath = path.resolve(rootDir, normalizedUrl);
  const relativePath = path.relative(rootDir, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, body) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    response.end(body);
  });
}

function sendClientConfig(response) {
  const body = `window.BEIM_CONFIG = ${JSON.stringify(
    {
      apiBaseUrl: "",
      googleClientId,
      facebookAppId,
    },
    null,
    2
  )};\n`;
  response.writeHead(200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  response.end(body);
}

function applyCorsHeaders(request, response) {
  const requestOrigin = request.headers.origin;
  if (!requestOrigin) return;
  if (requestOrigin === "null") {
    response.setHeader("Access-Control-Allow-Origin", "null");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Vary", "Origin");
    return;
  }

  if (!corsOrigins.length) return;
  const allowedOrigin = corsOrigins.includes("*")
    ? "*"
    : corsOrigins.includes(requestOrigin)
      ? requestOrigin
      : "";
  if (!allowedOrigin) return;

  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Vary", "Origin");
}

async function getActorFromRequest(url) {
  const actorId = String(url.searchParams.get("actorId") || "").trim();
  if (!actorId) return null;
  const result = await query("select * from users where id = $1 limit 1", [actorId]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readUploadBody(request) {
  const contentType = String(request.headers["content-type"] || "");
  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    return parseMultipartFormData(await readRawBody(request), contentType);
  }
  if (contentType.toLowerCase().includes("application/json")) {
    return JSON.parse((await readRawBody(request)).toString("utf8") || "{}");
  }
  return {};
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function verifyGoogleCredential(credential) {
  const parts = credential.split(".");
  assert(parts.length === 3, "La credencial de Google no es válida.");
  const header = JSON.parse(base64UrlDecode(parts[0]).toString("utf8"));
  const payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf8"));
  assert(header.alg === "RS256", "La firma de Google no es válida.");
  assert(payload.aud === googleClientId, "La credencial de Google no corresponde a esta aplicación.");
  assert(["accounts.google.com", "https://accounts.google.com"].includes(payload.iss), "El emisor de Google no es válido.");
  assert(Number(payload.exp || 0) * 1000 > Date.now(), "La credencial de Google expiró.");

  const keys = await getGoogleJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  assert(jwk, "No se encontró la clave pública de Google.");
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  const isValid = verifier.verify(crypto.createPublicKey({ key: jwk, format: "jwk" }), base64UrlDecode(parts[2]));
  assert(isValid, "La firma de Google no es válida.");

  return {
    email: String(payload.email || "").trim().toLowerCase(),
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    firstName: String(payload.given_name || "").trim(),
    lastName: String(payload.family_name || "").trim(),
    name: String(payload.name || "").trim(),
    subject: String(payload.sub || "").trim(),
  };
}

async function getGoogleJwks() {
  if (googleJwksCache.expiresAt > Date.now() && googleJwksCache.keys.length) {
    return googleJwksCache.keys;
  }
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  assert(response.ok, "No se pudieron obtener las claves públicas de Google.");
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  const payload = await response.json();
  googleJwksCache = {
    expiresAt: Date.now() + Math.max(60, maxAge) * 1000,
    keys: Array.isArray(payload.keys) ? payload.keys : [],
  };
  return googleJwksCache.keys;
}

async function verifyFacebookCredential(accessToken) {
  const url = new URL("https://graph.facebook.com/me");
  url.searchParams.set("fields", "id,name,email,first_name,last_name");
  url.searchParams.set("access_token", accessToken);
  const graphResponse = await fetch(url);
  const profile = await graphResponse.json().catch(() => ({}));
  assert(graphResponse.ok && profile.id, profile.error?.message || "Facebook no validó la cuenta.");
  return {
    email: String(profile.email || "").trim().toLowerCase(),
    firstName: String(profile.first_name || "").trim(),
    lastName: String(profile.last_name || "").trim(),
    name: String(profile.name || "").trim(),
    subject: String(profile.id || "").trim(),
  };
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

async function findOrCreateGoogleUser(profile) {
  validateEmail(profile.email);
  const existing = await query("select * from users where lower(email) = $1 limit 1", [profile.email]);
  if (existing.rowCount) return existing.rows[0];

  const firstName = profile.firstName || profile.name.split(" ")[0] || "Cliente";
  const lastName = profile.lastName || profile.name.split(" ").slice(1).join(" ");
  const fullName = profile.name || `${firstName} ${lastName}`.trim();
  const passwordHash = hashPassword(`google:${profile.subject}:${crypto.randomUUID()}`);
  const inserted = await query(`
    insert into users (
      name, first_name, last_name, username, email, password_hash, role, phone, company, ci, rut,
      department, locality, address, website, trade_references, is_wholesaler, is_approved
    )
    values (
      $1, $2, $3, $4, $5, $6, 'cliente', '', '', '', '',
      '', '', '', '', '', true, true
    )
    returning *
  `, [fullName, firstName, lastName, profile.email, profile.email, passwordHash]);
  return inserted.rows[0];
}

async function findOrCreateFacebookUser(profile) {
  validateEmail(profile.email);
  const existing = await query("select * from users where lower(email) = $1 limit 1", [profile.email]);
  if (existing.rowCount) return existing.rows[0];

  const firstName = profile.firstName || profile.name.split(" ")[0] || "Cliente";
  const lastName = profile.lastName || profile.name.split(" ").slice(1).join(" ");
  const fullName = profile.name || `${firstName} ${lastName}`.trim();
  const passwordHash = hashPassword(`facebook:${profile.subject}:${crypto.randomUUID()}`);
  const inserted = await query(`
    insert into users (
      name, first_name, last_name, username, email, password_hash, role, phone, company, ci, rut,
      department, locality, address, website, trade_references, is_wholesaler, is_approved
    )
    values (
      $1, $2, $3, $4, $5, $6, 'cliente', '', '', '', '',
      '', '', '', '', '', true, true
    )
    returning *
  `, [fullName, firstName, lastName, profile.email, profile.email, passwordHash]);
  return inserted.rows[0];
}

async function updateUserProfile(userId, body, onlyMissing = true) {
  const current = await query("select * from users where id = $1 limit 1", [userId]);
  assert(current.rowCount, "Usuario no encontrado.");
  const row = current.rows[0];
  const firstName = normalizeProfileValue(body.firstName);
  const lastName = normalizeProfileValue(body.lastName);
  const next = {
    first_name: mergeProfileValue(row.first_name, firstName, onlyMissing),
    last_name: mergeProfileValue(row.last_name, lastName, onlyMissing),
    email: mergeProfileValue(row.email, normalizeProfileValue(body.email).toLowerCase(), onlyMissing),
    phone: mergeProfileValue(row.phone, normalizeProfileValue(body.phone), onlyMissing),
    ci: mergeProfileValue(row.ci, normalizeProfileValue(body.ci), onlyMissing),
    rut: mergeProfileValue(row.rut, normalizeProfileValue(body.rut), onlyMissing),
    department: mergeProfileValue(row.department, normalizeProfileValue(body.department), onlyMissing),
    locality: mergeProfileValue(row.locality, normalizeProfileValue(body.locality), onlyMissing),
    address: mergeProfileValue(row.address, normalizeProfileValue(body.address), onlyMissing),
    company: mergeProfileValue(row.company, normalizeProfileValue(body.company), onlyMissing),
    trade_references: mergeProfileValue(row.trade_references, normalizeProfileValue(body.references), onlyMissing),
  };
  if (next.email) validateEmail(next.email);
  next.name = `${next.first_name || row.first_name || ""} ${next.last_name || row.last_name || ""}`.trim()
    || row.name
    || next.email
    || row.username;
  const updated = await query(`
    update users
    set name = $2,
        first_name = $3,
        last_name = $4,
        email = $5,
        phone = $6,
        ci = $7,
        rut = $8,
        department = $9,
        locality = $10,
        address = $11,
        company = $12,
        trade_references = $13,
        updated_at = now()
    where id = $1
    returning *
  `, [
    userId,
    next.name,
    next.first_name || "",
    next.last_name || "",
    next.email || "",
    next.phone || "",
    next.ci || "",
    next.rut || "",
    next.department || "",
    next.locality || "",
    next.address || "",
    next.company || "",
    next.trade_references || "",
  ]);
  return updated;
}

function normalizeProfileValue(value) {
  return String(value || "").trim();
}

function mergeProfileValue(currentValue, incomingValue, onlyMissing) {
  const current = normalizeProfileValue(currentValue);
  const incoming = normalizeProfileValue(incomingValue);
  if (!incoming) return current;
  if (onlyMissing && current) return current;
  return incoming;
}

async function fillMissingUserProfileForOrder(client, userId, body) {
  const current = await client.query("select * from users where id = $1 limit 1", [userId]);
  if (!current.rowCount) return;
  const row = current.rows[0];
  const firstName = normalizeProfileValue(body.firstName) || normalizeProfileValue(body.customer).split(" ")[0];
  const lastName = normalizeProfileValue(body.lastName) || normalizeProfileValue(body.customer).split(" ").slice(1).join(" ");
  const next = {
    first_name: mergeProfileValue(row.first_name, firstName, true),
    last_name: mergeProfileValue(row.last_name, lastName, true),
    email: mergeProfileValue(row.email, normalizeProfileValue(body.email).toLowerCase(), true),
    phone: mergeProfileValue(row.phone, body.phone, true),
    ci: mergeProfileValue(row.ci, body.ci, true),
    rut: mergeProfileValue(row.rut, body.rut, true),
    department: mergeProfileValue(row.department, body.department, true),
    locality: mergeProfileValue(row.locality, body.locality, true),
    address: mergeProfileValue(row.address, body.address, true),
    company: mergeProfileValue(row.company, body.company, true),
    trade_references: mergeProfileValue(row.trade_references, body.references, true),
  };
  next.name = `${next.first_name || row.first_name || ""} ${next.last_name || row.last_name || ""}`.trim()
    || row.name
    || next.email
    || row.username;
  await client.query(`
    update users
    set name = $2,
        first_name = $3,
        last_name = $4,
        email = $5,
        phone = $6,
        ci = $7,
        rut = $8,
        department = $9,
        locality = $10,
        address = $11,
        company = $12,
        trade_references = $13,
        updated_at = now()
    where id = $1
  `, [
    userId,
    next.name,
    next.first_name || "",
    next.last_name || "",
    next.email || "",
    next.phone || "",
    next.ci || "",
    next.rut || "",
    next.department || "",
    next.locality || "",
    next.address || "",
    next.company || "",
    next.trade_references || "",
  ]);
}

function mapUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    username: row.username || row.email || "",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company || "",
    ci: row.ci || "",
    rut: row.rut || "",
    department: row.department || "",
    locality: row.locality || "",
    address: row.address || "",
    website: row.website || "",
    references: row.trade_references || "",
    role: row.role,
    isWholesaler: Boolean(row.is_wholesaler),
    isApproved: Boolean(row.is_approved),
  };
}

function canAccessBeimReceipts(actor) {
  if (!actor) return false;
  return ["admin", "superadmin"].includes(actor.role);
}

function canManageBeimWorkflow(actor) {
  if (!actor) return false;
  return ["admin", "superadmin"].includes(actor.role);
}

function sanitizeTextArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function validateBeimReceiptPayload(body) {
  assert(String(body.clientName || "").trim().length >= 2, "El nombre del cliente es obligatorio.");
  assert(String(body.deviceModel || "").trim().length >= 1, "El modelo del equipo es obligatorio.");
}

function validateRepairStatus(status) {
  const value = String(status || "").trim();
  assert(REPAIR_STATUSES.includes(value), "El estado de reparación no es válido.");
  return value;
}

function validateQuoteStatus(status) {
  const value = String(status || "").trim();
  assert(QUOTE_STATUSES.includes(value), "El estado del presupuesto no es válido.");
  return value;
}

function validateQaStatus(status) {
  const value = String(status || "").trim();
  assert(QA_STATUSES.includes(value), "El estado de control de calidad no es válido.");
  return value;
}

async function searchBeimReceipts(search) {
  const value = String(search || "").trim();
  const params = [];
  let where = "";
  if (value) {
    params.push(`%${value.toLowerCase()}%`);
    const numericValue = Number.parseInt(value.replace(/\D+/g, ""), 10);
    if (Number.isFinite(numericValue)) {
      params.push(numericValue);
      where = `
        where lower(client_name) like $1
           or lower(client_id) like $1
           or lower(device_model) like $1
           or receipt_number = $2
      `;
    } else {
      where = `
        where lower(client_name) like $1
           or lower(client_id) like $1
           or lower(device_model) like $1
      `;
    }
  }
  const result = await query(`
    select *
    from beim_receipts
    ${where}
    order by receipt_number desc
    limit 50
  `, params);
  return result.rows.map(mapBeimReceiptRow);
}

function mapBeimReceiptRow(row) {
  return {
    id: row.id,
    number: Number(row.receipt_number),
    status: row.repair_status || "Ingresado",
    clientName: row.client_name || "",
    clientId: row.client_id || "",
    clientPhone: row.client_phone || "",
    deviceBrand: row.device_brand || "",
    deviceModel: row.device_model || "",
    deviceColor: row.device_color || "",
    imeiSerial: row.imei_serial || "",
    assignedTechnicianId: row.assigned_technician_id || "",
    diagnosticNotes: row.diagnostic_notes || "",
    serviceItems: Array.isArray(row.gestion_quote_items) ? row.gestion_quote_items : [],
    quoteStatus: row.quote_status || "Borrador",
    quoteTotal: Number(row.quote_total || 0),
    quoteSentAt: row.quote_sent_at || null,
    quoteApprovedAt: row.quote_approved_at || null,
    qaStatus: row.qa_status || "Pendiente",
    qaCompletedAt: row.qa_completed_at || null,
    warrantyStartsAt: row.warranty_starts_at || null,
    warrantyEndsAt: row.warranty_ends_at || null,
    invoiceNumber: row.invoice_number || "",
    paymentStatus: row.payment_status || "Pendiente",
    services: row.services || [],
    reportedIssue: row.reported_issue || "",
    visualItems: row.visual_items || [],
    entryDate: row.entry_date_text || "",
    deliveryTime: row.delivery_time || "",
    deliveryUnit: row.delivery_unit || "",
    warrantyOffered: row.warranty_offered || "",
    price: row.price || "",
    unlockCode: row.unlock_code || "",
    unlockPassword: row.unlock_password || "",
    unlockPattern: row.unlock_pattern || "",
    terms: row.terms || "",
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getGestionClients() {
  const savedResult = await query(`
    select id, name, document, phone, email, created_at
    from gestion_clients
    order by created_at desc, name asc
  `);
  const clients = savedResult.rows.map(mapGestionClientRow);
  const identityKey = (client) => {
    const document = String(client.document || "").trim().toLowerCase();
    if (document && document !== "-") return `document:${document}`;
    return `name:${String(client.name || "").trim().toLowerCase()}|phone:${String(client.phone || "").replace(/\D/g, "")}`;
  };
  const byIdentity = new Map(clients.map((client) => [identityKey(client), client]));

  const receiptResult = await query(`
    select distinct on (lower(client_id), lower(client_name))
      id, client_name, client_id, client_phone, created_at
    from beim_receipts
    where coalesce(client_name, '') <> ''
    order by lower(client_id), lower(client_name), created_at desc
  `);
  for (const row of receiptResult.rows) {
    const document = row.client_id || "-";
    const client = {
      id: `receipt-client-${row.id}`,
      name: row.client_name || "Cliente sin nombre",
      document,
      phone: row.client_phone || "-",
      email: "-",
    };
    const key = identityKey(client);
    if (byIdentity.has(key)) continue;
    clients.push(client);
    byIdentity.set(key, client);
  }

  return clients;
}

function mapGestionFinancialState(row) {
  if (!row) return { exists: false, capitalInitial: 0, expenses: [], menuItems: [], accountingState: {}, preferences: {}, updatedAt: null };
  return {
    exists: true,
    capitalInitial: Number(row.capital_initial || 0),
    expenses: Array.isArray(row.expenses) ? row.expenses : [],
    menuItems: Array.isArray(row.menu_items) ? row.menu_items : [],
    accountingState: row.accounting_state && typeof row.accounting_state === "object" ? row.accounting_state : {},
    preferences: row.preferences && typeof row.preferences === "object" ? row.preferences : {},
    updatedAt: row.updated_at || null
  };
}

async function getGestionFinancialState() {
  const result = await query("select * from gestion_financial_state where singleton_id=1 limit 1");
  return mapGestionFinancialState(result.rows[0]);
}

async function getGestionPaymentMovements() {
  const result = await query("select * from gestion_payment_movements order by created_at asc, id asc");
  return result.rows.map((row) => ({
    id: Number(row.id), receiptId: row.receipt_id, amount: Number(row.amount || 0), status: row.payment_status || "",
    method: row.method || "", businessDate: formatGestionBusinessDate(row.business_date), createdAt: row.created_at
  }));
}

function formatGestionBusinessDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return String(value).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || "";
}

function mapGestionClientRow(row) {
  return {
    id: row.id,
    name: row.name || "Cliente sin nombre",
    document: row.document || "-",
    phone: row.phone || "-",
    email: row.email || "-",
  };
}

async function createGestionClient(body) {
  const name = String(body.name || "").trim();
  assert(name.length >= 2, "El nombre del cliente es obligatorio.");
  const document = String(body.document || "").trim() || "-";
  const phone = String(body.phone || "").trim() || "-";
  const email = String(body.email || "").trim() || "-";
  const result = await query(`
    insert into gestion_clients (id, name, document, phone, email)
    values ($1, $2, $3, $4, $5)
    on conflict (id) do update set
      name = excluded.name,
      document = excluded.document,
      phone = excluded.phone,
      email = excluded.email,
      updated_at = now()
    returning *
  `, [String(body.id || `client-${crypto.randomUUID()}`), name, document, phone, email]);
  return mapGestionClientRow(result.rows[0]);
}

async function getGestionServices() {
  const result = await query(`
    select *
    from gestion_services
    order by active desc, lower(category_name) asc, lower(name) asc
  `);
  return result.rows.map(mapGestionServiceRow);
}

async function getGestionServiceCategories() {
  const result = await query(`
    select id, name
    from gestion_service_categories
    order by lower(name) asc
  `);
  return result.rows.map((row) => ({ id: row.id, name: row.name }));
}

async function createGestionServiceCategory(body) {
  const name = String(body.name || "").trim();
  assert(name, "Escribe el nombre de la categoria.");
  const existing = await query("select id, name from gestion_service_categories where lower(name) = lower($1) limit 1", [name]);
  if (existing.rowCount) return existing.rows[0];
  const result = await query(`
    insert into gestion_service_categories (id, name)
    values ($1, $2)
    returning id, name
  `, [`service-category-${crypto.randomUUID()}`, name]);
  return result.rows[0];
}

function mapGestionServiceRow(row) {
  return {
    id: row.id,
    category: row.category_name || "General",
    name: row.name || "Servicio",
    costPrice: Number(row.cost_price || 0),
    salePrice: Number(row.sale_price || 0),
    productKey: row.product_key || "",
    productName: row.product_name || "",
    brand: row.brand || "",
    model: row.model || "",
    active: row.active !== false,
  };
}

async function saveGestionService(body, forcedId = "") {
  const id = String(forcedId || body.id || `service-${crypto.randomUUID()}`).trim();
  const category = String(body.category || "").trim();
  const name = String(body.name || "").trim();
  const costPrice = Number(body.costPrice || 0);
  const salePrice = Number(body.salePrice || 0);
  const productKey = String(body.productKey || "").trim();
  const productName = String(body.productName || "").trim();
  const brand = String(body.brand || "").trim();
  const model = String(body.model || "").trim();
  const active = body.active !== false;

  assert(category, "La categoria del servicio es obligatoria.");
  assert(name, "El nombre del servicio es obligatorio.");
  assert(Number.isFinite(costPrice) && costPrice >= 0, "El costo interno no es valido.");
  assert(Number.isFinite(salePrice) && salePrice >= 0, "El precio de venta no es valido.");

  const result = await query(`
    insert into gestion_services (
      id, category_name, name, cost_price, sale_price, product_key, product_name, brand, model, active
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (id) do update set
      category_name = excluded.category_name,
      name = excluded.name,
      cost_price = excluded.cost_price,
      sale_price = excluded.sale_price,
      product_key = excluded.product_key,
      product_name = excluded.product_name,
      brand = excluded.brand,
      model = excluded.model,
      active = excluded.active,
      updated_at = now()
    returning *
  `, [id, category, name, costPrice, salePrice, productKey, productName, brand, model, active]);
  return mapGestionServiceRow(result.rows[0]);
}

async function upsertGestionClientFromReceipt(body) {
  const name = String(body.clientName || "").trim();
  if (name.length < 2) return;
  const document = String(body.clientId || "").trim() || "-";
  const phone = String(body.clientPhone || "").trim() || "-";
  const existing = document === "-"
    ? await query("select id from gestion_clients where lower(name) = lower($1) limit 1", [name])
    : await query("select id from gestion_clients where lower(document) = lower($1) or lower(name) = lower($2) limit 1", [document, name]);
  if (existing.rowCount) {
    await query(`
      update gestion_clients
      set name = $2,
          document = $3,
          phone = $4,
          updated_at = now()
      where id = $1
    `, [existing.rows[0].id, name, document, phone]);
    return;
  }
  await createGestionClient({ name, document, phone, email: "-" });
}

function mapReceiptToGestionOrder(receipt) {
  const price = Number(receipt.quoteTotal || 0) > 0
    ? Number(receipt.quoteTotal || 0)
    : parseCurrencyNumber(receipt.price || 0);
  const status = normalizeGestionRepairStatus(receipt.status);
  return {
    id: `boleta-${receipt.id}`,
    receiptId: receipt.id,
    orderType: receipt.payload?.orderType || "service",
    saleId: receipt.payload?.saleId || "",
    number: `OT-${String(receipt.number || 0).padStart(4, "0")}`,
    clientId: receipt.clientId || "",
    clientName: receipt.clientName || "Cliente sin nombre",
    clientDocument: receipt.clientId || "-",
    clientPhone: receipt.clientPhone || "-",
    device: [receipt.deviceBrand, receipt.deviceModel, receipt.deviceColor].filter(Boolean).join(" ") || "-",
    brand: receipt.deviceBrand || "-",
    model: receipt.deviceModel || "-",
    color: receipt.deviceColor || "-",
    problem: receipt.reportedIssue || "-",
    diagnosis: Array.isArray(receipt.visualItems) ? receipt.visualItems.join(", ") || "-" : "-",
    services: receipt.services || [],
    deliveryTime: [receipt.deliveryTime, receipt.deliveryUnit].filter(Boolean).join(" "),
    warrantyOffered: receipt.warrantyOffered || "-",
    unlockCode: receipt.unlockCode || "",
    unlockPassword: receipt.unlockPassword || "",
    unlockPattern: receipt.unlockPattern || "",
    terms: receipt.terms || "",
    status,
    repairStatus: status,
    paymentStatus: normalizeGestionPaymentStatus(receipt.paymentStatus),
    budget: price,
    cost: parseCurrencyNumber(receipt.payload?.cost || 0),
    paid: Number(receipt.payload?.gestionPaid || 0),
    paidAt: receipt.payload?.gestionPaidAt || "",
    serviceItems: receipt.serviceItems?.length ? receipt.serviceItems : (receipt.payload?.serviceItems || []),
    technicianNotes: receipt.diagnosticNotes || "",
    date: formatGestionDate(receipt.createdAt),
  };
}

function normalizeGestionServiceItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      description: String(item.description || item.name || item.service || "").trim(),
      price: Number(item.price || item.amount || item.total || 0),
      cost: Number(item.cost || item.costPrice || 0),
      approvalStatus: normalizeGestionServiceApprovalStatus(item.approvalStatus || item.status),
      source: item.source === "initial" ? "initial" : "added",
      productId: String(item.productId || ""),
      itemType: item.itemType === "product" || item.productId ? "product" : "service",
      consumesStock: Boolean(item.consumesStock || item.itemType === "product"),
      quantity: Math.max(1, Number(item.quantity || 1)),
      stockDeducted: Boolean(item.stockDeducted),
      stockDeductedAt: String(item.stockDeductedAt || "")
    }))
    .filter((item) => item.description || item.price > 0)
    .map((item) => ({
      description: item.description || "Servicio tecnico",
      price: Number.isFinite(item.price) && item.price > 0 ? item.price : 0,
      cost: Number.isFinite(item.cost) && item.cost > 0 ? item.cost : 0,
      approvalStatus: item.approvalStatus,
      source: item.source,
      productId: item.productId,
      itemType: item.itemType,
      consumesStock: item.consumesStock,
      quantity: item.quantity,
      stockDeducted: item.stockDeducted,
      stockDeductedAt: item.stockDeductedAt
    }));
}

async function commitGestionOrderItemStock(client, receiptId, items, forcePayment = false) {
  for (const item of items) {
    if (item.stockDeducted || item.approvalStatus === "No aprobado") continue;
    if (!forcePayment && item.approvalStatus !== "Aprobado") continue;

    let productId = String(item.productId || "");
    let expectsStock = Boolean(item.consumesStock || item.itemType === "product" || productId);
    if (!productId) {
      const serviceResult = await client.query(`
        select name, category_name, brand, model
        from gestion_services
        where lower(name) = lower($1)
        limit 1
      `, [item.description]);
      const service = serviceResult.rows[0];
      if (service?.brand && service?.model) {
        const linkedProduct = await client.query(`
          select p.id
          from products p
          left join categories c on c.id = p.category_id
          where lower(p.brand) = lower($1)
            and trim(replace(lower(p.model), ' promo', '')) = trim(replace(lower($2), ' promo', ''))
            and (
              lower(coalesce(c.name, '')) = lower($3)
              or lower(coalesce(c.name, '')) like '%' || lower($3) || '%'
              or lower($3) like '%' || lower(coalesce(c.name, '')) || '%'
              or (lower(coalesce(c.name, '')) like '%pantalla%' and lower($3) like '%pantalla%')
              or (lower(coalesce(c.name, '')) like '%bater%' and lower($3) like '%bater%')
              or (lower(coalesce(c.name, '')) like '%carga%' and lower($3) like '%carga%')
              or (lower(coalesce(c.name, '')) like '%tapa%' and lower($3) like '%tapa%')
              or (lower(coalesce(c.name, '')) like '%camara%' and lower($3) like '%camara%')
              or (lower(coalesce(c.name, '')) like '%funda%' and lower($3) like '%funda%')
              or (lower(coalesce(c.name, '')) like '%vidrio%' and lower($3) like '%vidrio%')
            )
          order by
            case when lower(coalesce(p.product_type, '')) in ('repuesto','servicio','taller','insumo','herramienta') then 0 else 1 end,
            case when p.stock > 0 then 0 else 1 end,
            p.stock desc,
            p.updated_at desc
          limit 1
        `, [service.brand, service.model, service.category_name]);
        productId = linkedProduct.rows[0]?.id || "";
        expectsStock = Boolean(productId);
      } else if (item.source === "sale" || item.itemType === "product") {
        expectsStock = true;
        const directProduct = await client.query(`
          select id from products
          where lower(name) = lower($1)
          order by case when stock > 0 then 0 else 1 end, stock desc, updated_at desc
          limit 1
        `, [item.description]);
        productId = directProduct.rows[0]?.id || "";
      }
    }

    if (!expectsStock) continue;
    assert(productId, `No pudimos vincular ${item.description} con un producto del stock.`);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const productResult = await client.query("select id, name, stock from products where id = $1 for update", [productId]);
    assert(productResult.rowCount, `No encontramos el producto ${item.description}.`);
    const product = productResult.rows[0];
    assert(Number(product.stock || 0) >= quantity, `No hay stock suficiente para ${product.name}. Disponible: ${Number(product.stock || 0)}.`);
    const stockResult = await client.query("update products set stock = stock - $2, updated_at = now() where id = $1 returning stock", [productId, quantity]);
    await insertGestionStockMovement(client, {
      productId,
      movementType: "service_order_sale",
      quantity: -quantity,
      balanceAfter: Number(stockResult.rows[0].stock || 0),
      referenceType: "service_order",
      referenceId: receiptId,
      detail: item.description || product.name
    });
    item.productId = productId;
    item.consumesStock = true;
    item.stockDeducted = true;
    item.stockDeductedAt = new Date().toISOString();
  }
}

async function reconcileGestionOrderItemStock(client, receiptId, previousItems, nextItems) {
  const available = nextItems.map((item, index) => ({ item, index, used: false }));
  for (const previous of previousItems) {
    if (!previous.stockDeducted || !previous.productId) continue;
    const match = available.find((candidate) => !candidate.used
      && String(candidate.item.productId || "") === String(previous.productId || "")
      && String(candidate.item.description || "").trim().toLowerCase() === String(previous.description || "").trim().toLowerCase()
      && Number(candidate.item.quantity || 1) === Number(previous.quantity || 1));
    if (match && match.item.approvalStatus !== "No aprobado") {
      match.used = true;
      match.item.stockDeducted = true;
      match.item.stockDeductedAt = previous.stockDeductedAt || match.item.stockDeductedAt || "";
      continue;
    }
    const quantity = Math.max(1, Number(previous.quantity || 1));
    const restored = await client.query("update products set stock = stock + $2, updated_at = now() where id = $1 returning stock", [previous.productId, quantity]);
    assert(restored.rowCount, `No encontramos el producto ${previous.description} para devolverlo al stock.`);
    await insertGestionStockMovement(client, {
      productId: previous.productId,
      movementType: "service_order_return",
      quantity,
      balanceAfter: Number(restored.rows[0].stock || 0),
      referenceType: "service_order",
      referenceId: receiptId,
      detail: `Servicio eliminado o rechazado: ${previous.description}`
    });
    if (match) {
      match.used = true;
      match.item.stockDeducted = false;
      match.item.stockDeductedAt = "";
    }
  }
}

function normalizeGestionServiceApprovalStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "aprobado" || value === "aprobada") return "Aprobado";
  if (value === "no aprobado" || value === "rechazado" || value === "rechazada") return "No aprobado";
  return "Pendiente";
}

function normalizeGestionRepairStatus(status) {
  const value = String(status || "").trim();
  const statusMap = {
    "Ingresado": "En diagnostico",
    "Pendiente": "En diagnostico",
    "En diagnóstico": "En diagnostico",
    "Esperando aprobación": "Esperando aprobacion",
    "En reparación": "En reparacion",
    "Control de calidad": "En reparacion",
    "Listo para entregar": "Listo para retirar",
  };
  return statusMap[value] || value || "En diagnostico";
}

function normalizeGestionPaymentStatus(status) {
  const value = String(status || "").trim();
  if (value === "Pagado") return "Pagado";
  if (value === "Seña" || value === "Sena" || value === "Parcial") return "Seña";
  return "Sin abonar";
}

function formatGestionDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapCategoryToGestionCategory(category) {
  return {
    id: category.id,
    name: category.name,
  };
}

async function createGestionCategory(body) {
  const name = String(body.name || "").trim();
  assert(name.length >= 2, "La subcategoria necesita un nombre.");
  const id = String(body.id || `cat-${crypto.randomUUID()}`);
  const existingResult = await query("select id from categories where lower(name) = lower($1) and category_scope = 'gestion' limit 1", [name]);
  assert(!existingResult.rows.length, "Esa subcategoria ya existe.");
  const sortOrder = await getNextCategorySortOrder("");
  const result = await query(`
    insert into categories (id, name, code, description, parent_id, sort_order, category_scope)
    values ($1, $2, $3, $4, null, $5, 'gestion')
    returning *
  `, [id, name, slugifyCode(name), "Subcategoria creada desde sistema de gestion", sortOrder]);
  return mapCategoryToGestionCategory(mapCategoryRow(result.rows[0]));
}

async function updateGestionCategory(categoryId, body) {
  const id = String(categoryId || "").trim();
  const name = String(body.name || "").trim();
  assert(id, "Falta la subcategoria.");
  assert(name.length >= 2, "La subcategoria necesita un nombre.");
  const existingResult = await query(
    "select id from categories where lower(name) = lower($1) and id <> $2 and category_scope = 'gestion' limit 1",
    [name, id]
  );
  assert(!existingResult.rows.length, "Esa subcategoria ya existe.");
  const result = await query(`
    update categories
    set name = $2, code = $3, updated_at = now()
    where id = $1
    returning *
  `, [id, name, slugifyCode(name)]);
  assert(result.rowCount, "No encontramos esa subcategoria.");
  return mapCategoryToGestionCategory(mapCategoryRow(result.rows[0]));
}

async function deleteGestionCategory(categoryId) {
  const id = String(categoryId || "").trim();
  assert(id, "Falta la subcategoria.");
  const categoryResult = await query("select * from categories where id = $1 limit 1", [id]);
  assert(categoryResult.rowCount, "No encontramos esa subcategoria.");
  const linkedProducts = await query("select id from products where category_id = $1 limit 1", [id]);
  assert(!linkedProducts.rowCount, "No se puede eliminar una subcategoria con productos cargados.");
  const linkedChildren = await query("select id from categories where parent_id = $1 limit 1", [id]);
  assert(!linkedChildren.rowCount, "No se puede eliminar una categoria que tiene subcategorias internas.");
  await query("delete from categories where id = $1", [id]);
}

function mapProductToGestionProduct(product) {
  const productType = product.productType || "accesorio";
  const inventoryScope = ["repuesto", "servicio", "taller", "insumo", "herramienta"].includes(String(productType).toLowerCase())
    ? "workshop"
    : "web";
  return {
    id: product.id,
    categoryId: product.category,
    brand: product.brand || "-",
    model: product.model || product.name || "-",
    color: product.color || "-",
    costPrice: Number(product.costPrice || 0),
    salePrice: Number(product.price || 0),
    price: Number(product.price || 0),
    name: product.name,
    stock: Number(product.stock || 0),
    minStock: Number(product.minStock || 0),
    supplierName: product.supplierName || "",
    warrantyDays: Number(product.warrantyDays || 0),
    productType,
    inventoryScope,
  };
}

async function createGestionProduct(body) {
  const brand = String(body.brand || "").trim();
  const model = String(body.model || "").trim();
  const color = String(body.color || "").trim() || "-";
  const categoryId = String(body.categoryId || body.category || "").trim();
  const salePrice = Number(body.salePrice || body.price || 0);
  const costPrice = Number(body.costPrice || 0);
  const stock = Number(body.stock || 0);
  const minStock = Number(body.minStock || 0);
  const supplierName = String(body.supplierName || "").trim();
  const warrantyDays = Number(body.warrantyDays || 0);
  assert(categoryId, "Selecciona una subcategoria.");
  assert(brand, "La marca es obligatoria.");
  assert(model, "El modelo es obligatorio.");
  assert(Number.isFinite(salePrice) && salePrice >= 0, "El precio de venta no es valido.");
  assert(Number.isFinite(costPrice) && costPrice >= 0, "El precio costo no es valido.");
  assert(Number.isFinite(stock) && stock >= 0, "El stock no es valido.");
  const id = String(body.id || `prod-${crypto.randomUUID()}`);
  const name = String(body.name || [brand, model, color !== "-" ? color : ""].filter(Boolean).join(" ")).trim();
  const result = await query(`
    insert into products (id, name, category_id, brand, model, color, cost_price, price, currency, stock, badge, description, product_type, min_stock, supplier_name, warranty_days)
    values ($1, $2, $3, $4, $5, $6, $7, $8, 'UYU', $9, 'Nuevo', $10, 'repuesto', $11, $12, $13)
    returning *
  `, [id, name, categoryId, brand, model, color, costPrice, salePrice, Math.trunc(stock), "Producto creado desde sistema de gestion", Math.trunc(minStock), supplierName, Math.trunc(warrantyDays)]);
  return mapProductToGestionProduct(mapProductRow(result.rows[0]));
}

function parseCurrencyNumber(value) {
  return Number(String(value || "0").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
}

function slugifyCode(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase() || `cat-${Date.now()}`;
}

async function getBeimReceiptWorkflow(receiptId) {
  const receiptResult = await query("select * from beim_receipts where id = $1 limit 1", [receiptId]);
  if (!receiptResult.rowCount) return null;
  const [partsResult, paymentsResult, checklistResult, purchasesResult] = await Promise.all([
    query(`
      select rp.*, p.name as product_name, p.brand, p.model, p.stock
      from beim_receipt_parts rp
      left join products p on p.id = rp.product_id
      where rp.receipt_id = $1
      order by rp.created_at asc
    `, [receiptId]),
    query(`
      select *
      from beim_receipt_payments
      where receipt_id = $1
      order by created_at asc
    `, [receiptId]),
    query(`
      select *
      from beim_receipt_checklists
      where receipt_id = $1
      order by created_at desc
    `, [receiptId]),
    query(`
      select *
      from beim_receipt_purchases
      where receipt_id = $1
      order by created_at asc
    `, [receiptId]),
  ]);
  return {
    receipt: mapBeimReceiptRow(receiptResult.rows[0]),
    parts: partsResult.rows.map(mapReceiptPartRow),
    payments: paymentsResult.rows.map(mapReceiptPaymentRow),
    checklists: checklistResult.rows.map(mapReceiptChecklistRow),
    purchases: purchasesResult.rows.map(mapReceiptPurchaseRow),
  };
}

async function updateBeimReceiptWorkflow(receiptId, body, actor) {
  const fields = [];
  const values = [];
  const addField = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };
  if ("imeiSerial" in body) addField("imei_serial", String(body.imeiSerial || "").trim());
  if ("assignedTechnicianId" in body) addField("assigned_technician_id", body.assignedTechnicianId || null);
  if ("diagnosticNotes" in body) addField("diagnostic_notes", String(body.diagnosticNotes || "").trim());
  if ("quoteStatus" in body) {
    const quoteStatus = validateQuoteStatus(body.quoteStatus);
    addField("quote_status", quoteStatus);
    if (quoteStatus === "Enviado") addField("quote_sent_at", new Date());
  }
  if ("quoteTotal" in body) {
    const quoteTotal = Number(body.quoteTotal);
    assert(Number.isFinite(quoteTotal) && quoteTotal >= 0, "El total del presupuesto no es válido.");
    addField("quote_total", quoteTotal);
  }
  if ("status" in body) addField("repair_status", validateRepairStatus(body.status));
  if (!fields.length) {
    const workflow = await getBeimReceiptWorkflow(receiptId);
    return workflow?.receipt || null;
  }
  values.push(receiptId);
  const result = await query(`
    update beim_receipts
    set ${fields.join(", ")},
        updated_at = now()
    where id = $${values.length}
    returning *
  `, values);
  if (!result.rowCount) return null;
  await writeAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "beim_receipt.workflow",
    entityType: "beim_receipt",
    entityId: String(result.rows[0].receipt_number),
    details: body,
  });
  return mapBeimReceiptRow(result.rows[0]);
}

async function addBeimReceiptPart(receiptId, body, actor) {
  const productId = String(body.productId || "").trim();
  const quantity = Number(body.quantity || 1);
  const unitPrice = Number(body.unitPrice || 0);
  const unitCost = Number(body.unitCost || 0);
  assert(productId, "Seleccioná un repuesto del inventario.");
  assert(Number.isFinite(quantity) && quantity > 0, "La cantidad del repuesto no es válida.");
  assert(Number.isFinite(unitPrice) && unitPrice >= 0, "El precio del repuesto no es válido.");
  assert(Number.isFinite(unitCost) && unitCost >= 0, "El costo del repuesto no es válido.");
  const result = await query(`
    insert into beim_receipt_parts (
      receipt_id, product_id, quantity, unit_cost, unit_price, warranty_days, supplier_name, notes
    )
    select $1, p.id, $3, $4, $5, $6, $7, $8
    from products p
    where p.id = $2
    returning *
  `, [
    receiptId,
    productId,
    quantity,
    unitCost,
    unitPrice,
    Number(body.warrantyDays || 30),
    body.supplierName || "",
    body.notes || "",
  ]);
  assert(result.rowCount, "No encontramos ese repuesto en el inventario.");
  await query(`
    update beim_receipts
    set quote_total = greatest(quote_total, parse_beim_money(price)) + $2,
        updated_at = now()
    where id = $1
  `, [receiptId, unitPrice * quantity]);
  await writeAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "beim_receipt.part.add",
    entityType: "beim_receipt",
    entityId: receiptId,
    details: { productId, quantity, unitPrice },
  });
  return mapReceiptPartRow(result.rows[0]);
}

async function addBeimReceiptPurchase(receiptId, body, actor) {
  const supplierName = String(body.supplierName || "").trim();
  const productName = String(body.productName || "").trim();
  const quantity = Number(body.quantity || 1);
  const unitCost = Number(body.unitCost || 0);
  const unitPrice = Number(body.unitPrice || 0);
  assert(supplierName.length >= 2, "Indicá el proveedor de la compra.");
  assert(productName.length >= 2, "Indicá el repuesto comprado.");
  assert(Number.isFinite(quantity) && quantity > 0, "La cantidad comprada no es válida.");
  assert(Number.isFinite(unitCost) && unitCost >= 0, "El costo de compra no es válido.");
  assert(Number.isFinite(unitPrice) && unitPrice >= 0, "El precio al cliente no es válido.");
  const result = await query(`
    insert into beim_receipt_purchases (
      receipt_id, supplier_name, supplier_invoice, product_name, quantity,
      unit_cost, unit_price, status, notes, created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning *
  `, [
    receiptId,
    supplierName,
    body.supplierInvoice || "",
    productName,
    quantity,
    unitCost,
    unitPrice,
    body.status || "Pedido",
    body.notes || "",
    actor.id,
  ]);
  await query(`
    update beim_receipts
    set quote_total = greatest(quote_total, parse_beim_money(price), $2),
        updated_at = now()
    where id = $1
  `, [receiptId, unitPrice * quantity]);
  await writeAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "beim_receipt.purchase.add",
    entityType: "beim_receipt",
    entityId: receiptId,
    details: { supplierName, productName, quantity, unitCost, unitPrice },
  });
  return mapReceiptPurchaseRow(result.rows[0]);
}

async function approveBeimQuote(receiptId, body, actor) {
  const approved = Boolean(body.approved);
  await withTransaction(async (client) => {
    const receiptResult = await client.query("select * from beim_receipts where id = $1 for update", [receiptId]);
    assert(receiptResult.rowCount, "Boleta no encontrada.");
    if (!approved) {
      await client.query(`
        update beim_receipts
        set quote_status = 'Rechazado',
            repair_status = 'Cancelado',
            updated_at = now()
        where id = $1
      `, [receiptId]);
    } else {
      const partsResult = await client.query(`
        select rp.*, p.stock
        from beim_receipt_parts rp
        join products p on p.id = rp.product_id
        where rp.receipt_id = $1 and rp.stock_decremented = false
        for update
      `, [receiptId]);
      for (const part of partsResult.rows) {
        assert(Number(part.stock || 0) >= Number(part.quantity || 0), `No hay stock suficiente para el repuesto ${part.product_id}.`);
        await client.query("update products set stock = stock - $2, updated_at = now() where id = $1", [part.product_id, Number(part.quantity || 0)]);
        await client.query("update beim_receipt_parts set stock_decremented = true where id = $1", [part.id]);
      }
      await client.query(`
        update beim_receipts
        set quote_status = 'Aprobado',
            quote_approved_at = now(),
            repair_status = 'En reparación',
            updated_at = now()
        where id = $1
      `, [receiptId]);
    }
    await client.query(`
      insert into audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, details)
      values ($1, $2, 'beim_receipt.quote.approve', 'beim_receipt', $3, $4::jsonb)
    `, [actor.id, actor.role, receiptId, JSON.stringify({ approved })]);
  });
  return getBeimReceiptWorkflow(receiptId);
}

async function saveBeimQaChecklist(receiptId, body, actor) {
  const status = validateQaStatus(body.status || "Pendiente");
  const checks = Array.isArray(body.checks) ? body.checks : [];
  const result = await query(`
    insert into beim_receipt_checklists (receipt_id, checklist_type, status, checks, notes, completed_by)
    values ($1, 'salida', $2, $3::jsonb, $4, $5)
    returning *
  `, [receiptId, status, JSON.stringify(checks), body.notes || "", actor.id]);
  if (status === "Aprobado") {
    await query(`
      update beim_receipts
      set qa_status = 'Aprobado',
          qa_completed_at = now(),
          repair_status = 'Listo para entregar',
          updated_at = now()
      where id = $1
    `, [receiptId]);
  } else {
    await query(`
      update beim_receipts
      set qa_status = $2,
          repair_status = 'Control de calidad',
          updated_at = now()
      where id = $1
    `, [receiptId, status]);
  }
  await writeAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "beim_receipt.qa",
    entityType: "beim_receipt",
    entityId: receiptId,
    details: { status },
  });
  return mapReceiptChecklistRow(result.rows[0]);
}

async function addBeimReceiptPayment(receiptId, body, actor) {
  const amount = Number(body.amount || 0);
  assert(Number.isFinite(amount) && amount > 0, "El monto del pago no es válido.");
  const method = String(body.method || "").trim() || "efectivo";
  const result = await query(`
    insert into beim_receipt_payments (receipt_id, amount, currency, method, reference, notes, created_by)
    values ($1, $2, $3, $4, $5, $6, $7)
    returning *
  `, [receiptId, amount, body.currency || "UYU", method, body.reference || "", body.notes || "", actor.id]);
  await refreshBeimReceiptPaymentStatus(receiptId);
  await writeAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "beim_receipt.payment",
    entityType: "beim_receipt",
    entityId: receiptId,
    details: { amount, method },
  });
  return mapReceiptPaymentRow(result.rows[0]);
}

async function refreshBeimReceiptPaymentStatus(receiptId) {
  await query(`
    update beim_receipts r
    set payment_status = case
          when coalesce(paid.total_paid, 0) <= 0 then 'Pendiente'
          when coalesce(paid.total_paid, 0) < greatest(r.quote_total, parse_beim_money(r.price)) then 'Parcial'
          else 'Pagado'
        end,
        warranty_starts_at = case
          when coalesce(paid.total_paid, 0) >= greatest(r.quote_total, parse_beim_money(r.price)) then coalesce(r.warranty_starts_at, now())
          else r.warranty_starts_at
        end,
        warranty_ends_at = case
          when coalesce(paid.total_paid, 0) >= greatest(r.quote_total, parse_beim_money(r.price)) then coalesce(r.warranty_ends_at, now() + interval '30 days')
          else r.warranty_ends_at
        end,
        repair_status = case
          when coalesce(paid.total_paid, 0) >= greatest(r.quote_total, parse_beim_money(r.price)) and r.repair_status = 'Listo para entregar' then 'Entregado'
          else r.repair_status
        end,
        updated_at = now()
    from (
      select receipt_id, sum(amount) as total_paid
      from beim_receipt_payments
      where receipt_id = $1
      group by receipt_id
    ) paid
    where r.id = $1 and paid.receipt_id = r.id
  `, [receiptId]);
}

function mapReceiptPartRow(row) {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    productId: row.product_id || "",
    productName: row.product_name || "",
    brand: row.brand || "",
    model: row.model || "",
    quantity: Number(row.quantity || 0),
    unitCost: Number(row.unit_cost || 0),
    unitPrice: Number(row.unit_price || 0),
    warrantyDays: Number(row.warranty_days || 0),
    supplierName: row.supplier_name || "",
    supplierInvoice: row.supplier_invoice || "",
    source: row.source || "stock",
    stockDecremented: Boolean(row.stock_decremented),
    notes: row.notes || "",
  };
}

function mapReceiptPaymentRow(row) {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    amount: Number(row.amount || 0),
    currency: row.currency || "UYU",
    method: row.method || "",
    reference: row.reference || "",
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function mapReceiptPurchaseRow(row) {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    supplierName: row.supplier_name || "",
    supplierInvoice: row.supplier_invoice || "",
    productName: row.product_name || "",
    quantity: Number(row.quantity || 0),
    unitCost: Number(row.unit_cost || 0),
    unitPrice: Number(row.unit_price || 0),
    status: row.status || "Pedido",
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function mapReceiptChecklistRow(row) {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    type: row.checklist_type || "",
    status: row.status || "Pendiente",
    checks: row.checks || [],
    notes: row.notes || "",
    completedBy: row.completed_by || "",
    createdAt: row.created_at,
  };
}

async function getStoreSettings() {
  const result = await query("select value from app_settings where key = 'store' limit 1");
  const settings = result.rows[0]?.value || {};
  return {
    whatsapp: settings.whatsapp || "59892514774",
    ordersWhatsapp: settings.ordersWhatsapp || settings.whatsapp || "59892514774",
    instagram: settings.instagram || "https://www.instagram.com/beim.uy/",
    companyName: settings.companyName || "BEIM",
    companyRut: settings.companyRut || "",
    companyAddress: settings.companyAddress || "",
    companyPhone: settings.companyPhone || settings.whatsapp || "59892514774",
    companyEmail: settings.companyEmail || "",
    heroText: settings.heroText || "",
    productBrands: Array.isArray(settings.productBrands) ? settings.productBrands : [],
    paymentMethods: normalizePaymentMethods(settings.paymentMethods),
  };
}

function normalizePaymentMethods(methods = []) {
  const fallback = [
    {
      id: "transferencia-bancaria",
      name: "Transferencia bancaria",
      detail: "Confirmación manual por comprobante",
      instructions: "Realizá la transferencia y luego enviá el comprobante a administración para confirmar el pago.",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "tarjetas",
      name: "Tarjetas",
      detail: "Crédito / débito",
      instructions: "Seleccioná este método para pagar con tarjeta. Administración confirmará el pago o enviará el link correspondiente.",
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "efectivo-retiro",
      name: "Efectivo / retiro",
      detail: "Pago al retirar o en entrega acordada",
      instructions: "Tu pedido queda reservado y coordinamos retiro o entrega para concretar el pago.",
      isActive: true,
      sortOrder: 3,
    },
    {
      id: "usdt",
      name: "USDT",
      detail: "Cripto con validación manual",
      instructions: "Enviá el pago por la red indicada y compartí el comprobante o hash para verificarlo manualmente.",
      isActive: true,
      sortOrder: 4,
    },
  ];
  const incoming = Array.isArray(methods) ? methods : [];
  const byId = new Map();
  [...fallback, ...incoming].forEach((method, index) => {
    const normalized = {
      id: String(method.id || `payment-method-${index + 1}`).trim(),
      name: String(method.name || `Método ${index + 1}`).trim(),
      detail: String(method.detail || "").trim(),
      instructions: String(method.instructions || "").trim(),
      isActive: method.isActive !== false,
      sortOrder: Number(method.sortOrder || index + 1),
    };
    byId.set(normalized.id, normalized);
  });
  return [...byId.values()].sort((left, right) => {
    const delta = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
    if (delta !== 0) return delta;
    return String(left.name || "").localeCompare(String(right.name || ""), "es");
  });
}

async function getOrders(singleOrderId = "", customerUserId = "") {
  const params = [];
  const filters = [];
  if (singleOrderId) {
    params.push(singleOrderId);
    filters.push(`o.id = $${params.length}`);
  }
  if (customerUserId) {
    params.push(customerUserId);
    filters.push(`o.user_id = $${params.length}`);
  }
  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  const result = await query(`
    select
      o.*,
      coalesce(
        json_agg(
            json_build_object(
              'id', oi.id,
              'idRef', oi.product_id,
              'code', oi.product_code,
              'name', oi.product_name,
              'qty', oi.quantity,
              'price', oi.unit_price,
            'currency', oi.currency
          )
          order by oi.id
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items
    from orders o
    left join order_items oi on oi.order_id = o.id
    ${where}
    group by o.id
    order by o.created_at desc
  `, params);
  return result.rows.map(mapOrderRow);
}

async function getCategories(scope = "web") {
  const result = await query(
    "select * from categories where category_scope in ($1, 'both') order by coalesce(parent_id, ''), sort_order asc, name asc",
    [scope]
  );
  return result.rows.map(mapCategoryRow);
}

async function getProducts() {
  const result = await query("select * from products order by created_at asc, name asc");
  return result.rows.map(mapProductRow);
}

async function getPromoSlides() {
  const result = await query("select * from promo_slides order by sort_order asc, created_at asc");
  return result.rows.map(mapPromoSlideRow);
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    parentId: row.parent_id || "",
    sortOrder: Number(row.sort_order || 0),
  };
}

async function getNextCategorySortOrder(parentId = "") {
  const result = await query(`
    select coalesce(max(sort_order), 0) as max_sort
    from categories
    where coalesce(parent_id, '') = $1
  `, [parentId]);
  return Number(result.rows[0]?.max_sort || 0) + 1;
}

async function normalizeCategorySiblingOrder(client, parentId = "") {
  const siblingsResult = await client.query(`
    select id
    from categories
    where coalesce(parent_id, '') = $1
    order by
      case when sort_order <= 0 then 2147483647 else sort_order end asc,
      name asc
  `, [parentId]);

  for (const [index, sibling] of siblingsResult.rows.entries()) {
    await client.query(
      "update categories set sort_order = $2, updated_at = now() where id = $1 and sort_order <> $2",
      [sibling.id, index + 1],
    );
  }
}

async function moveCategory(categoryId, direction) {
  return withTransaction(async (client) => {
    const currentResult = await client.query("select * from categories where id = $1 limit 1", [categoryId]);
    if (!currentResult.rowCount) return false;
    const current = currentResult.rows[0];
    await normalizeCategorySiblingOrder(client, current.parent_id || "");
    const siblingsResult = await client.query(`
      select id, sort_order
      from categories
      where coalesce(parent_id, '') = $1
      order by sort_order asc, name asc
    `, [current.parent_id || ""]);
    const siblings = siblingsResult.rows;
    const index = siblings.findIndex((item) => item.id === categoryId);
    if (index < 0) return false;
    const currentSibling = siblings[index];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return true;
    const target = siblings[targetIndex];
    await client.query("update categories set sort_order = $2, updated_at = now() where id = $1", [current.id, target.sort_order]);
    await client.query("update categories set sort_order = $2, updated_at = now() where id = $1", [target.id, currentSibling.sort_order]);
    return true;
  });
}

function mapProductRow(row) {
  return {
    id: row.id,
    productCode: Number(row.product_code || 0),
    name: row.name,
    category: row.category_id,
    brand: row.brand || "",
    model: row.model || "",
    color: row.color || "",
    costPrice: Number(row.cost_price || 0),
    price: Number(row.price || 0),
    currency: row.currency || "UYU",
    stock: Number(row.stock || 0),
    badge: row.badge || "Nuevo",
    image: materializeInlineImage(row.image || "", "product", row.id),
    description: row.description || "",
    productType: row.product_type || "accesorio",
    compatibleModels: row.compatible_models || [],
    supplierName: row.supplier_name || "",
    supplierLot: row.supplier_lot || "",
    minStock: Number(row.min_stock || 0),
    warrantyDays: Number(row.warranty_days || 0),
  };
}

function toPublicCatalogProduct(product) {
  const {
    costPrice,
    supplierName,
    supplierLot,
    minStock,
    ...publicProduct
  } = product;
  return publicProduct;
}

function mapPromoSlideRow(row) {
  return {
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    text: row.text,
    image: materializeInlineImage(row.image || "", "promo", row.id),
    primaryLabel: row.primary_label || "",
    primaryHref: row.primary_href || "",
    secondaryLabel: row.secondary_label || "",
    secondaryHref: row.secondary_href || "",
    imageX: Number(row.image_x || 50),
    imageY: Number(row.image_y || 50),
    imageScale: Number(row.image_scale || 1),
    imageFramePreset: row.image_frame_preset || "default",
    imageFrameWidth: row.image_frame_width === null || row.image_frame_width === undefined ? "" : Number(row.image_frame_width),
    imageFrameHeight: row.image_frame_height === null || row.image_frame_height === undefined ? "" : Number(row.image_frame_height),
    sortOrder: Number(row.sort_order || 0),
  };
}

function materializeInlineImage(value = "", kind = "image", id = "", options = {}) {
  const source = String(value || "");
  if (!source.startsWith("data:image/")) return source;

  const match = source.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    if (options.strict) throw new Error("La imagen no tiene un formato válido.");
    return source;
  }

  const extension = normalizeImageExtension(match[1]);
  const base64 = String(match[2] || "").replace(/\s+/g, "");
  if (!isStrictBase64(base64)) {
    if (options.strict) throw new Error("La imagen llegó con datos inválidos. Volvé a cargarla.");
    return source;
  }
  const buffer = Buffer.from(base64, "base64");
  if (!isValidImageBuffer(buffer, extension)) {
    if (options.strict) throw new Error("La imagen llego corrupta. Vuelve a cargarla desde el archivo original.");
    return source;
  }
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const safeId = String(id || "item").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const fileName = `${kind}-${safeId}-${hash}.${extension}`;
  const absolutePath = path.join(uploadAssetDir, fileName);

  try {
    fs.mkdirSync(uploadAssetDir, { recursive: true });
    if (!fs.existsSync(absolutePath)) {
      fs.writeFileSync(absolutePath, buffer);
    }
    return `assets/uploads/${fileName}`;
  } catch (error) {
    console.error("No se pudo materializar imagen inline:", error.message);
    return source;
  }
}

function saveUploadedImage(body = {}, kind = "image") {
  const mimeType = String(body.mimeType || "").toLowerCase();
  const base64 = String(body.data || "").replace(/\s+/g, "");
  assert(base64, "Falta la imagen para cargar.");
  assert(base64.length <= 12 * 1024 * 1024, "La imagen es demasiado grande.");
  assert(isStrictBase64(base64), "La imagen llegó con datos inválidos. Volvé a cargarla.");
  const buffer = Buffer.from(base64, "base64");
  return saveUploadedImageBuffer({
    buffer,
    fileName: body.fileName || kind,
    mimeType,
  }, kind);
}

function saveUploadedImageBuffer(file = {}, kind = "image") {
  const mimeType = String(file.mimeType || "").toLowerCase();
  const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.alloc(0);
  const extension = normalizeImageMimeExtension(mimeType) || normalizeImageFileExtension(file.fileName || "");
  assert(extension, "Formato de imagen no permitido.");
  assert(buffer.length > 0, "La imagen no tiene contenido válido.");
  assert(buffer.length <= 8 * 1024 * 1024, "La imagen supera el tamano permitido.");
  assert(isValidImageBuffer(buffer, extension), "La imagen llego corrupta. Vuelve a cargarla desde el archivo original.");

  const rawName = String(file.fileName || kind || "image").replace(/\.[^.]+$/, "");
  const safeName = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || kind;
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const fileName = `${kind}-${safeName}-${hash}.${extension}`;
  const absolutePath = path.join(uploadAssetDir, fileName);

  fs.mkdirSync(uploadAssetDir, { recursive: true });
  if (!fs.existsSync(absolutePath)) {
    fs.writeFileSync(absolutePath, buffer);
  }
  return { path: `assets/uploads/${fileName}` };
}

function parseMultipartFormData(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  assert(boundaryMatch, "No se pudo leer el limite del formulario.");
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const fields = {};
  let file = null;
  let position = buffer.indexOf(boundary);

  while (position >= 0) {
    let partStart = position + boundary.length;
    if (buffer[partStart] === 45 && buffer[partStart + 1] === 45) break;
    if (buffer[partStart] === 13 && buffer[partStart + 1] === 10) partStart += 2;
    const nextBoundary = buffer.indexOf(boundary, partStart);
    if (nextBoundary < 0) break;

    let part = buffer.subarray(partStart, nextBoundary);
    if (part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10) {
      part = part.subarray(0, part.length - 2);
    }

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd >= 0) {
      const rawHeaders = part.subarray(0, headerEnd).toString("latin1");
      const content = part.subarray(headerEnd + 4);
      const disposition = rawHeaders.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] || "";
      const name = disposition.match(/name="([^"]+)"/i)?.[1] || "";
      const fileName = disposition.match(/filename="([^"]*)"/i)?.[1] || "";
      const mimeType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || fields.mimeType || "";

      if (fileName) {
        file = { fieldName: name, fileName, mimeType, buffer: content };
      } else if (name) {
        fields[name] = content.toString("utf8");
      }
    }

    position = nextBoundary;
  }

  return { ...fields, file: file ? { ...file, mimeType: file.mimeType || fields.mimeType || "" } : null };
}

function isStrictBase64(value = "") {
  if (!value || value.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const canonical = Buffer.from(value, "base64").toString("base64");
  return canonical === value;
}

function isValidImageBuffer(buffer, extension) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return false;
  if (extension === "jpg") {
    return buffer.length > 4
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff
      && buffer[buffer.length - 2] === 0xff
      && buffer[buffer.length - 1] === 0xd9;
  }
  if (extension === "png") {
    const signature = "89504e470d0a1a0a";
    const iend = "0000000049454e44ae426082";
    return buffer.length > 20
      && buffer.subarray(0, 8).toString("hex") === signature
      && buffer.subarray(buffer.length - 12).toString("hex") === iend;
  }
  if (extension === "webp") {
    return buffer.length > 12
      && buffer.subarray(0, 4).toString("ascii") === "RIFF"
      && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (extension === "gif") {
    const header = buffer.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }
  if (extension === "avif") {
    return buffer.length > 16
      && buffer.subarray(4, 8).toString("ascii") === "ftyp"
      && buffer.subarray(8, 32).toString("ascii").includes("avif");
  }
  if (extension === "svg") {
    const text = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
    return text.startsWith("<svg") || text.includes("<svg");
  }
  return false;
}

function normalizeImageMimeExtension(mimeType = "") {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg" || mimeType === "image/pjpeg") return "jpg";
  if (mimeType === "image/png" || mimeType === "image/x-png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/avif") return "avif";
  if (mimeType === "image/svg+xml") return "svg";
  return "";
}

function normalizeImageFileExtension(fileName = "") {
  const extension = String(fileName).split(".").pop()?.toLowerCase() || "";
  if (extension === "jpg" || extension === "jpeg" || extension === "jfif") return "jpg";
  if (["png", "webp", "gif", "avif", "svg"].includes(extension)) return extension;
  return "";
}

function normalizeImageExtension(type = "") {
  const normalized = String(type).toLowerCase();
  if (normalized === "jpeg" || normalized === "jpg" || normalized === "pjpeg" || normalized === "jfif") return "jpg";
  if (["png", "x-png", "webp", "gif", "avif", "svg+xml"].includes(normalized)) {
    if (normalized === "x-png") return "png";
    return normalized === "svg+xml" ? "svg" : normalized;
  }
  return "png";
}

function mapOrderRow(row) {
  return {
    id: row.id,
    userId: row.user_id || "",
    invoiceSequence: Number(row.invoice_number || 0),
    invoiceNumber: formatInvoiceNumber(row.invoice_number),
    customer: row.customer,
    email: row.email || "",
    phone: row.phone || "",
    ci: row.ci || "",
    rut: row.rut || "",
    paymentMethodId: row.payment_method_id || "",
    paymentMethodName: row.payment_method_name || "",
    paymentInstructions: row.payment_instructions || "",
    paymentStatus: row.payment_status || "Pendiente de pago",
    paymentReceiptPath: row.payment_receipt_path || "",
    paymentReceiptName: row.payment_receipt_name || "",
    paymentReviewedAt: row.payment_reviewed_at ? new Date(row.payment_reviewed_at).toLocaleString() : "",
    stockCommitted: row.stock_committed === true,
    documentType: row.document_type || "",
    documentValue: row.document_value || "",
    address: row.address || "",
    shipping: row.shipping || "",
    comments: row.comments || "",
    total: Number(row.total || 0),
    currency: row.currency || "UYU",
    status: row.status || "Pendiente",
    createdAt: new Date(row.created_at).toLocaleString(),
    createdAtMs: new Date(row.created_at).getTime(),
    items: Array.isArray(row.items) ? row.items.map((item) => ({
      id: item.idRef,
      productCode: Number(item.code || 0),
      name: item.name,
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
      currency: item.currency || "UYU",
    })) : [],
  };
}

async function createOrderRecord(body, actor) {
  return withTransaction(async (client) => {
    const items = Array.isArray(body.items) ? body.items : [];
    const storeSettings = await getStoreSettings();
    const paymentMethod = (storeSettings.paymentMethods || []).find((method) => method.id === body.paymentMethodId && method.isActive);
    if (!items.length) {
      throw new Error("No hay productos para generar el pedido.");
    }
    if (!paymentMethod) {
      throw new Error("El método de pago seleccionado no está disponible.");
    }

    const checkedProducts = [];
    for (const item of items) {
      const productResult = await client.query("select * from products where id = $1 limit 1", [item.id]);
      const product = productResult.rows[0];
      if (!product) {
        throw new Error(`No encontramos el producto ${item.id}.`);
      }
      if (Number(product.stock || 0) < Number(item.qty || 0)) {
        throw new Error(`No hay stock suficiente para ${product.name}.`);
      }
      checkedProducts.push(product);
    }

    if (actor?.role === "cliente") {
      await fillMissingUserProfileForOrder(client, actor.id, body);
    }

    const orderId = body.id || `ORD-${Date.now()}`;
    const paymentReceipt = savePaymentReceiptFile(body.paymentReceipt, orderId);
    const initialPaymentStatus = paymentReceipt.path ? "Comprobante recibido" : "Pendiente de pago";
    const orderResult = await client.query(`
      insert into orders (
        id, user_id, invoice_number, customer, email, phone, ci, rut, payment_method_id, payment_method_name, payment_instructions,
        payment_status, payment_receipt_path, payment_receipt_name, stock_committed, document_type, document_value,
        address, shipping, comments, total, currency, status, updated_at
      )
      values ($1,$2,nextval('invoice_number_seq'),$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,$14,$15,$16,$17,$18,$19,$20,'Pendiente',now())
      returning *
    `, [
      orderId,
      actor?.role === "cliente" ? actor.id : null,
      body.customer,
      body.email || "",
      body.phone || "",
      body.ci || "",
      body.rut || "",
      paymentMethod.id,
      paymentMethod.name,
      paymentMethod.instructions || paymentMethod.detail || "",
      initialPaymentStatus,
      paymentReceipt.path,
      paymentReceipt.name,
      body.documentType || "",
      body.documentValue || "",
      body.address || "",
      body.shipping || "",
      body.comments || "",
      Number(body.total || 0),
      body.currency || "UYU",
    ]);

    for (const item of items) {
      await client.query(`
        insert into order_items (order_id, product_id, product_code, product_name, quantity, unit_price, currency)
        values ($1,$2,$3,$4,$5,$6,$7)
      `, [
        orderId,
        item.id,
        Number(checkedProducts.find((product) => product.id === item.id)?.product_code || 0),
        item.name,
        Number(item.qty || 0),
        Number(item.price || 0),
        item.currency || "UYU",
      ]);
    }

    const orders = await client.query(`
      select
        o.*,
        coalesce(
          json_agg(
            json_build_object(
              'id', oi.id,
              'idRef', oi.product_id,
              'code', oi.product_code,
              'name', oi.product_name,
              'qty', oi.quantity,
              'price', oi.unit_price,
              'currency', oi.currency
            )
            order by oi.id
          ) filter (where oi.id is not null),
          '[]'::json
        ) as items
      from orders o
      left join order_items oi on oi.order_id = o.id
      where o.id = $1
      group by o.id
    `, [orderId]);

    const updatedProducts = await client.query("select * from products where id = any($1::text[])", [items.map((item) => item.id)]);
    await client.query(`
      insert into audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, details)
      values ($1, $2, 'order.create', 'order', $3, $4::jsonb)
    `, [
      actor?.id || null,
      actor?.role || "guest",
      orderId,
      JSON.stringify({
        total: Number(body.total || 0),
        currency: body.currency || "UYU",
        items: items.map((item) => ({ id: item.id, qty: item.qty })),
      }),
    ]);
    return {
      order: mapOrderRow(orders.rows[0]),
      products: updatedProducts.rows.map(mapProductRow),
    };
  });
}

async function createStripeCheckoutSession(order, request) {
  assert(stripeSecretKey, "Stripe no está configurado. Agregá STRIPE_SECRET_KEY en el archivo .env del servidor.");
  assert(stripeSecretKey.startsWith("sk_test_"), "Stripe debe estar configurado en modo prueba con una clave sk_test_.");
  assert(order.paymentMethodId === "tarjetas", "Esta orden no fue creada con el método Tarjetas.");
  assert(["UYU", "USD"].includes(String(order.currency || "").toUpperCase()), "Stripe solo está habilitado para pagos con tarjeta en UYU o USD.");

  const origin = getRequestOrigin(request);
  const currency = String(order.currency || "UYU").toLowerCase();
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/beim/index.html?stripe=success&order_id=${encodeURIComponent(order.id)}`);
  params.set("cancel_url", `${origin}/beim/index.html?stripe=cancel&order_id=${encodeURIComponent(order.id)}`);
  params.set("client_reference_id", order.id);
  params.set("customer_email", order.email || "");
  params.set("customer_creation", "always");
  params.set("payment_method_types[0]", "card");
  params.set("payment_intent_data[setup_future_usage]", "off_session");
  params.set("saved_payment_method_options[payment_method_save]", "enabled");
  params.set("saved_payment_method_options[payment_method_remove]", "enabled");
  params.set("metadata[order_id]", order.id);
  params.set("metadata[invoice_number]", order.invoiceNumber || "");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", currency);
  params.set("line_items[0][price_data][unit_amount]", String(toStripeMinorUnits(order.total, currency)));
  params.set("line_items[0][price_data][product_data][name]", `Pedido BEIM ${order.invoiceNumber || order.id}`);
  params.set("line_items[0][price_data][product_data][description]", `Orden ${order.id}`);

  return stripeRequest("/v1/checkout/sessions", params);
}

function stripeRequest(pathname, params) {
  return new Promise((resolve, reject) => {
    const body = params.toString();
    const request = https.request({
      method: "POST",
      hostname: "api.stripe.com",
      path: pathname,
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        const payload = JSON.parse(data || "{}");
        if (response.statusCode >= 400) {
          reject(new Error(payload?.error?.message || "Stripe rechazo la solicitud."));
          return;
        }
        resolve(payload);
      });
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function toStripeMinorUnits(amount, currency) {
  const zeroDecimalCurrencies = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  return zeroDecimalCurrencies.has(currency)
    ? Math.round(Number(amount || 0))
    : Math.round(Number(amount || 0) * 100);
}

function getRequestOrigin(request) {
  const protocol = request.headers["x-forwarded-proto"] || "http";
  const hostHeader = request.headers.host || `${host}:${port}`;
  return `${protocol}://${hostHeader}`;
}

async function writeAuditLog({ actorUserId = null, actorRole = "", action, entityType, entityId = "", details = {} }) {
  try {
    await query(`
      insert into audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, details)
      values ($1, $2, $3, $4, $5, $6::jsonb)
    `, [actorUserId, actorRole, action, entityType, entityId || null, JSON.stringify(details || {})]);
  } catch (error) {
    console.error("No se pudo guardar audit log:", error.message);
  }
}

function savePaymentReceiptFile(receipt, orderId) {
  if (!receipt || !receipt.data) return { path: "", name: "" };
  const mimeType = String(receipt.mimeType || "").toLowerCase();
  const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
  const extension = extensions[mimeType];
  assert(extension, "El comprobante debe ser JPG, PNG, WEBP o PDF.");
  const base64 = String(receipt.data || "").replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  assert(base64 && isStrictBase64(base64), "El comprobante contiene datos inválidos.");
  const buffer = Buffer.from(base64, "base64");
  assert(buffer.length <= 5 * 1024 * 1024, "El comprobante no puede superar los 5 MB.");
  const directory = path.join(uploadAssetDir, "payments");
  fs.mkdirSync(directory, { recursive: true });
  const safeOrder = String(orderId || "order").replace(/[^a-zA-Z0-9_-]/g, "-");
  const fileName = `${safeOrder}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  fs.writeFileSync(path.join(directory, fileName), buffer);
  return { path: `assets/uploads/payments/${fileName}`, name: String(receipt.fileName || `comprobante.${extension}`).slice(0, 180) };
}

async function updateOrderPaymentStatus(orderId, paymentStatus, actor) {
  return withTransaction(async (client) => {
    const result = await client.query("select * from orders where id = $1 for update", [orderId]);
    const current = result.rows[0];
    assert(current, "Pedido no encontrado.");
    if (current.stock_committed && paymentStatus !== "Pagado") {
      throw new Error("El pago ya fue confirmado y el stock fue descontado. No puede revertirse desde esta pantalla.");
    }
    if (paymentStatus === "Pagado" && !current.stock_committed) {
      const items = await client.query("select * from order_items where order_id = $1 order by id", [orderId]);
      for (const item of items.rows) {
        const product = await client.query("select * from products where id = $1 for update", [item.product_id]);
        assert(product.rows[0], `No encontramos el producto ${item.product_name}.`);
        assert(Number(product.rows[0].stock || 0) >= Number(item.quantity || 0), `No hay stock suficiente para confirmar el pago de ${item.product_name}.`);
        await client.query("update products set stock = stock - $2, updated_at = now() where id = $1", [item.product_id, Number(item.quantity || 0)]);
      }
    }
    await client.query(`
      update orders
      set payment_status = $2,
          stock_committed = case when $2 = 'Pagado' then true else stock_committed end,
          payment_reviewed_at = case when $2 in ('Pagado','Rechazado') then now() else payment_reviewed_at end,
          updated_at = now()
      where id = $1
    `, [orderId, paymentStatus]);
    await client.query(`insert into audit_logs (actor_user_id,actor_role,action,entity_type,entity_id,details) values ($1,$2,'order.payment_status','order',$3,$4::jsonb)`, [actor.id, actor.role, orderId, JSON.stringify({ paymentStatus })]);
    const orders = await getOrdersWithClient(client, orderId);
    return orders[0];
  });
}

async function getOrdersWithClient(client, orderId) {
  const result = await client.query(`
    select o.*, coalesce(json_agg(json_build_object('id',oi.id,'idRef',oi.product_id,'code',oi.product_code,'name',oi.product_name,'qty',oi.quantity,'price',oi.unit_price,'currency',oi.currency) order by oi.id) filter (where oi.id is not null),'[]'::json) as items
    from orders o left join order_items oi on oi.order_id=o.id where o.id=$1 group by o.id
  `, [orderId]);
  return result.rows.map(mapOrderRow);
}

async function insertGestionStockMovement(client, movement) {
  const run = client?.query ? client.query.bind(client) : query;
  await run(`insert into gestion_stock_movements (product_id, movement_type, quantity, balance_after, reference_type, reference_id, detail) values ($1,$2,$3,$4,$5,$6,$7)`, [movement.productId, movement.movementType, Number(movement.quantity || 0), Number(movement.balanceAfter || 0), movement.referenceType || "", movement.referenceId || "", movement.detail || ""]);
}

function mapGestionStockMovement(row) {
  return { id: Number(row.id), productId: row.product_id || "", productName: row.product_name || "Producto", movementType: row.movement_type || "adjustment", quantity: Number(row.quantity || 0), balanceAfter: Number(row.balance_after || 0), referenceType: row.reference_type || "", referenceId: row.reference_id || "", detail: row.detail || "", createdAt: row.created_at };
}

function mapGestionCashSession(row) {
  return { id: row.id, businessDate: String(row.business_date || "").slice(0, 10), openingAmount: Number(row.opening_amount || 0), expectedAmount: Number(row.expected_amount || 0), countedAmount: row.counted_amount === null ? null : Number(row.counted_amount), difference: Number(row.difference || 0), status: row.status || "open", notes: row.notes || "", openedAt: row.opened_at, closedAt: row.closed_at };
}

function mapGestionUser(row) {
  return { id: row.id, username: row.username, name: row.name || row.username, role: row.role || "vendedor", webUserId: row.web_user_id || null, active: row.active !== false, lastLoginAt: row.last_login_at || null, createdAt: row.created_at };
}

function isGestionAdmin(actor) { return ["administrador", "administrador_principal"].includes(actor?.role); }

async function assertCompatibleWebRole(gestionRole, webUserId) {
  const result = await query("select role from users where id=$1 limit 1", [webUserId]);
  assert(result.rowCount, "La cuenta web seleccionada no existe.");
  const expected = gestionRole === "administrador_principal" ? "superadmin" : gestionRole === "administrador" ? "admin" : "cliente";
  assert(result.rows[0].role === expected, `Ese rol debe vincularse con una cuenta web de tipo ${expected}.`);
}

async function getGestionRolePermissions() {
  const defaults = { administrador_principal: ["*"], administrador: ["dashboard","orders","newOrder","clients","products","sales","expenses","services","cash","reports","menuCategory","openWebsite"], vendedor: ["dashboard","orders","newOrder","clients","products","sales","openWebsite"], tecnico: ["dashboard","orders","newOrder","clients","products","services","openWebsite"], caja: ["dashboard","orders","clients","sales","cash","menuCategory","openWebsite"] };
  const result = await query("select role,permissions from gestion_role_permissions");
  result.rows.forEach((row) => {
    if (row.role !== "administrador_principal") {
      defaults[row.role] = Array.isArray(row.permissions) ? row.permissions.filter((permission) => permission !== "*") : [];
    }
  });
  defaults.administrador_principal = ["*"];
  return defaults;
}

async function getGestionActor(id) {
  if (!id) return null;
  const result = await query("select * from gestion_users where id=$1 and active=true limit 1", [id]);
  return result.rows[0] ? mapGestionUser(result.rows[0]) : null;
}

async function requireGestionRoleIfConfigured(actorId, roles) {
  const count = await query("select count(*)::integer as count from gestion_users");
  if (Number(count.rows[0]?.count || 0) === 0) return null;
  const actor = await getGestionActor(actorId);
  assert(actor && (roles.includes(actor.role) || actor.role === "administrador_principal"), "Esta operación requiere un permiso asignado por el administrador principal.");
  return actor;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateEmail(email) {
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Ingresá un email válido.");
}

function validatePassword(password) {
  assert(typeof password === "string" && password.length >= 4, "La contraseña debe tener al menos 4 caracteres.");
}

function validateStoreSettings(body) {
  assert(String(body.whatsapp || "").trim().length >= 6, "El WhatsApp no es válido.");
  assert(String(body.ordersWhatsapp || body.whatsapp || "").trim().length >= 6, "El WhatsApp de órdenes no es válido.");
  assert(String(body.instagram || "").trim().length >= 5, "El Instagram no es válido.");
  assert(String(body.companyName || "").trim().length >= 2, "El nombre de empresa no es válido.");
  const paymentMethods = normalizePaymentMethods(body.paymentMethods);
  assert(paymentMethods.length > 0, "Debés dejar al menos un método de pago configurado.");
  paymentMethods.forEach((method) => {
    assert(String(method.id || "").trim(), "Cada método de pago necesita identificador.");
    assert(String(method.name || "").trim(), "Cada método de pago necesita nombre.");
    assert(String(method.instructions || "").trim(), "Cada método de pago necesita instrucciones.");
  });
}

function formatInvoiceNumber(value) {
  return String(Number(value || 0)).padStart(4, "0");
}

function validateCategoryPayload(body) {
  assert(String(body.id || "").trim(), "La categoría necesita un identificador.");
  assert(String(body.name || "").trim(), "La categoría necesita un nombre.");
  assert(String(body.code || "").trim(), "La categoría necesita una sigla.");
}

function validateProductPayload(body) {
  assert(String(body.id || "").trim(), "El producto necesita un identificador.");
  assert(String(body.name || "").trim(), "El producto necesita un nombre.");
  assert(String(body.category || "").trim(), "El producto necesita una categoría.");
  assert(String(body.brand || "").trim(), "El producto necesita una marca.");
  assert(Number(body.costPrice) >= 0, "El precio de costo no es válido.");
  assert(Number(body.price) >= 0, "El precio no es válido.");
  assert(Number(body.stock) >= 0, "El stock no es válido.");
  assert(["UYU", "USD", "USDT"].includes(String(body.currency || "")), "La moneda del producto no es válida.");
}

function validatePromoPayload(body) {
  assert(String(body.id || "").trim(), "La hoja necesita un identificador.");
  assert(String(body.eyebrow || "").trim(), "La hoja necesita etiqueta.");
  assert(String(body.title || "").trim(), "La hoja necesita título.");
  assert(String(body.text || "").trim(), "La hoja necesita texto.");
  assert(String(body.image || "").trim(), "La hoja necesita imagen.");
  if (body.imageFrameWidth !== "" && body.imageFrameWidth !== null && body.imageFrameWidth !== undefined) {
    const width = Number(body.imageFrameWidth);
    assert(Number.isFinite(width) && width >= 240 && width <= 760, "El ancho del cuadro debe estar entre 240 y 760.");
  }
  if (body.imageFrameHeight !== "" && body.imageFrameHeight !== null && body.imageFrameHeight !== undefined) {
    const height = Number(body.imageFrameHeight);
    assert(Number.isFinite(height) && height >= 180 && height <= 620, "El alto del cuadro debe estar entre 180 y 620.");
  }
}

function validateOrderPayload(body, actor) {
  const isAdministrativeOrder = ["admin", "superadmin"].includes(actor?.role || "");
  assert(String(body.customer || "").trim(), "El pedido necesita cliente.");
  if (!isAdministrativeOrder) {
    assert(String(body.email || "").trim(), "El pedido necesita email.");
    assert(String(body.phone || "").trim(), "El pedido necesita teléfono.");
    assert(String(body.address || "").trim(), "El pedido necesita dirección.");
    assert(String(body.ci || body.rut || "").trim(), "El pedido necesita CI o RUT.");
  }
  assert(Array.isArray(body.items) && body.items.length > 0, "El pedido necesita productos.");
  assert(["UYU", "USD", "USDT"].includes(String(body.currency || "")), "La moneda del pedido no es válida.");
  assert(String(body.paymentMethodId || "").trim(), "Seleccioná un método de pago.");
}

function validateOrderStatus(status) {
  assert(["Pendiente", "Pagado", "Enviado", "Entregado", "Cancelado"].includes(String(status || "")), "El estado del pedido no es válido.");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedValue = "") {
  if (!storedValue) return false;
  if (!storedValue.startsWith("scrypt$")) {
    return storedValue === password;
  }
  const [, salt, expected] = storedValue.split("$");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(expected, "hex"));
}

async function ensureRuntimeSchema() {
  if (getStorageMode() !== "postgres") return;
  await query("alter table orders add column if not exists payment_status text");
  await query("alter table orders add column if not exists payment_receipt_path text");
  await query("alter table orders add column if not exists payment_receipt_name text");
  await query("alter table orders add column if not exists payment_reviewed_at timestamptz");
  await query("alter table orders add column if not exists stock_committed boolean");
  await query("update orders set payment_status=case when status='Pagado' then 'Pagado' else 'Pendiente de pago' end where payment_status is null");
  await query("update orders set stock_committed=true where stock_committed is null");
  await query("alter table orders alter column payment_status set default 'Pendiente de pago'");
  await query("alter table orders alter column payment_status set not null");
  await query("alter table orders alter column stock_committed set default false");
  await query("alter table orders alter column stock_committed set not null");
  await query("alter table categories add column if not exists category_scope text not null default 'web'");
  await query(`
    update products
    set product_type = 'repuesto'
    where category_id in (select id from categories where category_scope = 'gestion')
      and product_type not in ('repuesto', 'servicio', 'taller', 'insumo', 'herramienta')
  `);
  await query("alter table products add column if not exists product_type text not null default 'accesorio'");
  await query("alter table products add column if not exists compatible_models text[] not null default '{}'");
  await query("alter table products add column if not exists supplier_name text not null default ''");
  await query("alter table products add column if not exists supplier_lot text not null default ''");
  await query("alter table products add column if not exists min_stock integer not null default 0");
  await query("alter table products add column if not exists color text not null default ''");
  await query("alter table products add column if not exists cost_price numeric(12,2) not null default 0");
  await query("alter table products add column if not exists warranty_days integer not null default 30");
  await query(`
    create table if not exists gestion_stock_movements (
      id bigserial primary key,
      product_id text references products(id) on delete set null,
      movement_type text not null,
      quantity integer not null,
      balance_after integer not null,
      reference_type text not null default '',
      reference_id text not null default '',
      detail text not null default '',
      created_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_gestion_stock_movements_product on gestion_stock_movements(product_id, created_at desc)");
  await query(`
    create table if not exists gestion_cash_sessions (
      id uuid primary key default gen_random_uuid(),
      business_date date not null unique,
      opening_amount numeric(12,2) not null default 0,
      expected_amount numeric(12,2) not null default 0,
      counted_amount numeric(12,2),
      difference numeric(12,2) not null default 0,
      status text not null default 'open',
      notes text not null default '',
      opened_at timestamptz not null default now(),
      closed_at timestamptz,
      updated_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_gestion_cash_sessions_date on gestion_cash_sessions(business_date desc)");
  await query(`
    create table if not exists gestion_financial_state (
      singleton_id smallint primary key check (singleton_id = 1),
      capital_initial numeric(14,2) not null default 0,
      expenses jsonb not null default '[]'::jsonb,
      menu_items jsonb not null default '[]'::jsonb,
      accounting_state jsonb not null default '{}'::jsonb,
      preferences jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
  `);
  await query("alter table gestion_financial_state add column if not exists accounting_state jsonb not null default '{}'::jsonb");
  await query("alter table gestion_financial_state add column if not exists preferences jsonb not null default '{}'::jsonb");
  await query(`
    create table if not exists gestion_payment_movements (
      id bigserial primary key,
      receipt_id uuid not null references beim_receipts(id) on delete cascade,
      amount numeric(14,2) not null,
      payment_status text not null default '', method text not null default '',
      business_date date not null, created_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_gestion_payment_movements_receipt_date on gestion_payment_movements(receipt_id, business_date, created_at)");
  await query(`
    insert into gestion_payment_movements (receipt_id, amount, payment_status, method, business_date, created_at)
    select r.id, (r.payload->>'gestionPaid')::numeric, r.payment_status, 'Efectivo',
      case when coalesce(r.payload->>'gestionPaidAt','') ~ '^\\d{4}-\\d{2}-\\d{2}' then left(r.payload->>'gestionPaidAt',10)::date
           when coalesce(r.entry_date_text,'') ~ '^\\d{4}-\\d{2}-\\d{2}' then left(r.entry_date_text,10)::date
           else r.created_at::date end,
      case when coalesce(r.payload->>'gestionPaidAt','') <> '' then (r.payload->>'gestionPaidAt')::timestamptz else r.created_at end
    from beim_receipts r
    where coalesce(r.payload->>'gestionPaid','') ~ '^[0-9]+([.][0-9]+)?$'
      and (r.payload->>'gestionPaid')::numeric > 0
      and not exists (select 1 from gestion_payment_movements m where m.receipt_id=r.id)
  `);
  await query(`
    create table if not exists gestion_users (
      id uuid primary key default gen_random_uuid(), username text not null unique, name text not null default '',
      password_hash text not null, role text not null default 'vendedor', active boolean not null default true,
      last_login_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    )
  `);
  await query("alter table gestion_users add column if not exists web_user_id uuid references users(id) on delete set null");
  await query("insert into gestion_users(username,name,password_hash,role,active) select 'administradorprincipal','Administrador principal',$1,'administrador_principal',true where not exists(select 1 from gestion_users where role='administrador_principal') on conflict(username) do update set name=excluded.name,password_hash=excluded.password_hash,role=excluded.role,active=true,updated_at=now()", [hashPassword("Admin,123")]);
  await query("update gestion_users set role='administrador_principal' where id=(select id from gestion_users where role='administrador' order by created_at asc limit 1) and not exists(select 1 from gestion_users where role='administrador_principal')");
  await query("update gestion_users set username='administradorprincipal', name='Administrador principal', password_hash=$1, active=true, updated_at=now() where role='administrador_principal'", [hashPassword("Admin,123")]);
  await query("update gestion_users set web_user_id=(select id from users where role='superadmin' and is_approved=true order by case when lower(username)='administradorprincipal' then 0 else 1 end, created_at limit 1), updated_at=now() where role='administrador_principal' and web_user_id is null");
  await query("update gestion_users set web_user_id=(select id from users where role='admin' and is_approved=true order by case when lower(username) in ('administrador','admin') then 0 else 1 end, created_at limit 1), updated_at=now() where role='administrador' and web_user_id is null");
  await query(`create table if not exists gestion_role_permissions (role text primary key, permissions jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now())`);
  await query(`create table if not exists gestion_web_access_tokens (token_hash text primary key, web_user_id uuid not null references users(id) on delete cascade, gestion_user_id uuid not null references gestion_users(id) on delete cascade, expires_at timestamptz not null, created_at timestamptz not null default now())`);
  await query("delete from gestion_web_access_tokens where expires_at<=now()");
  await query(`
    create table if not exists gestion_clients (
      id text primary key,
      name text not null default '',
      document text not null default '',
      phone text not null default '',
      email text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_gestion_clients_document on gestion_clients(lower(document))");
  await query(`
    create table if not exists gestion_service_categories (
      id text primary key,
      name text not null unique,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists gestion_services (
      id text primary key,
      category_name text not null default 'General',
      name text not null default '',
      cost_price numeric(12,2) not null default 0,
      sale_price numeric(12,2) not null default 0,
      duration_text text not null default '',
      warranty_text text not null default '',
      notes text not null default '',
      product_key text not null default '',
      product_name text not null default '',
      brand text not null default '',
      model text not null default '',
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query("alter table gestion_services add column if not exists product_key text not null default ''");
  await query("alter table gestion_services add column if not exists product_name text not null default ''");
  await query("alter table gestion_services add column if not exists brand text not null default ''");
  await query("alter table gestion_services add column if not exists model text not null default ''");
  await query("create index if not exists idx_gestion_services_category on gestion_services(lower(category_name))");
  await query("create index if not exists idx_gestion_services_active on gestion_services(active)");
  await query(`
    create or replace function parse_beim_money(value text)
    returns numeric
    language sql
    immutable
    as $$
      select coalesce(nullif(replace(regexp_replace(coalesce(value, ''), '[^0-9,.-]', '', 'g'), ',', '.'), '')::numeric, 0)
    $$
  `);
  await query("create sequence if not exists beim_receipt_number_seq minvalue 1000 start with 1000 increment by 1");
  await query(`
    create table if not exists beim_receipts (
      id uuid primary key default gen_random_uuid(),
      receipt_number integer unique not null default nextval('beim_receipt_number_seq'),
      user_id uuid references users(id) on delete set null,
      repair_status text not null default 'Ingresado',
      client_name text not null default '',
      client_id text not null default '',
      client_phone text not null default '',
      device_brand text not null default '',
      device_model text not null default '',
      device_color text not null default '',
      services text[] not null default '{}',
      reported_issue text not null default '',
      visual_items text[] not null default '{}',
      entry_date_text text not null default '',
      delivery_time text not null default '',
      delivery_unit text not null default '',
      warranty_offered text not null default '',
      price text not null default '',
      unlock_code text not null default '',
      unlock_password text not null default '',
      unlock_pattern text not null default '',
      terms text not null default '',
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query("alter table beim_receipts add column if not exists price text not null default ''");
  await query("alter table beim_receipts add column if not exists repair_status text not null default 'Ingresado'");
  await query("alter table beim_receipts add column if not exists imei_serial text not null default ''");
  await query("alter table beim_receipts add column if not exists assigned_technician_id uuid references users(id) on delete set null");
  await query("alter table beim_receipts add column if not exists diagnostic_notes text not null default ''");
  await query("alter table beim_receipts add column if not exists quote_status text not null default 'Borrador'");
  await query("alter table beim_receipts add column if not exists quote_total numeric(12,2) not null default 0");
  await query("alter table beim_receipts add column if not exists gestion_quote_items jsonb not null default '[]'::jsonb");
  await query("alter table beim_receipts add column if not exists quote_sent_at timestamptz");
  await query("alter table beim_receipts add column if not exists quote_approved_at timestamptz");
  await query("alter table beim_receipts add column if not exists qa_status text not null default 'Pendiente'");
  await query("alter table beim_receipts add column if not exists qa_completed_at timestamptz");
  await query("alter table beim_receipts add column if not exists warranty_starts_at timestamptz");
  await query("alter table beim_receipts add column if not exists warranty_ends_at timestamptz");
  await query("alter table beim_receipts add column if not exists invoice_number text not null default ''");
  await query("alter table beim_receipts add column if not exists payment_status text not null default 'Pendiente'");
  await query("select setval('beim_receipt_number_seq', greatest(coalesce((select max(receipt_number) from beim_receipts), 1000), 1000), (select max(receipt_number) is not null from beim_receipts))");
  await query("create index if not exists idx_beim_receipts_number on beim_receipts(receipt_number)");
  await query("create index if not exists idx_beim_receipts_status on beim_receipts(repair_status)");
  await query("create index if not exists idx_beim_receipts_client_name on beim_receipts(lower(client_name))");
  await query("create index if not exists idx_beim_receipts_client_id on beim_receipts(lower(client_id))");
  await query("create index if not exists idx_beim_receipts_device_model on beim_receipts(lower(device_model))");
  await query("create index if not exists idx_beim_receipts_imei_serial on beim_receipts(lower(imei_serial))");
  await query("create index if not exists idx_beim_receipts_technician on beim_receipts(assigned_technician_id)");
  await query("create index if not exists idx_beim_receipts_quote_status on beim_receipts(quote_status)");
  await query(`
    create table if not exists beim_receipt_parts (
      id uuid primary key default gen_random_uuid(),
      receipt_id uuid not null references beim_receipts(id) on delete cascade,
      product_id text references products(id) on delete set null,
      quantity integer not null check (quantity > 0),
      unit_cost numeric(12,2) not null default 0,
      unit_price numeric(12,2) not null default 0,
      warranty_days integer not null default 30,
      supplier_name text not null default '',
      stock_decremented boolean not null default false,
      notes text not null default '',
      created_at timestamptz not null default now()
    )
  `);
  await query("alter table beim_receipt_parts add column if not exists source text not null default 'stock'");
  await query("alter table beim_receipt_parts add column if not exists supplier_invoice text not null default ''");
  await query(`
    create table if not exists beim_receipt_payments (
      id uuid primary key default gen_random_uuid(),
      receipt_id uuid not null references beim_receipts(id) on delete cascade,
      amount numeric(12,2) not null check (amount > 0),
      currency text not null default 'UYU',
      method text not null,
      reference text not null default '',
      notes text not null default '',
      created_by uuid references users(id) on delete set null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists beim_receipt_purchases (
      id uuid primary key default gen_random_uuid(),
      receipt_id uuid not null references beim_receipts(id) on delete cascade,
      supplier_name text not null default '',
      supplier_invoice text not null default '',
      product_name text not null default '',
      quantity integer not null check (quantity > 0),
      unit_cost numeric(12,2) not null default 0,
      unit_price numeric(12,2) not null default 0,
      status text not null default 'Pedido',
      notes text not null default '',
      created_by uuid references users(id) on delete set null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists beim_receipt_checklists (
      id uuid primary key default gen_random_uuid(),
      receipt_id uuid not null references beim_receipts(id) on delete cascade,
      checklist_type text not null,
      status text not null default 'Pendiente',
      checks jsonb not null default '[]'::jsonb,
      notes text not null default '',
      completed_by uuid references users(id) on delete set null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists beim_purchases (
      id uuid primary key default gen_random_uuid(),
      purchase_area text not null default 'client',
      product_name text not null default '',
      quantity integer not null check (quantity > 0),
      unit_cost numeric(12,2) not null default 0,
      unit_price numeric(12,2) not null default 0,
      supplier_name text not null default '',
      association_type text not null default 'none',
      association_ref text not null default '',
      client_name text not null default '',
      notes text not null default '',
      created_by uuid references users(id) on delete set null,
      created_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_products_type on products(product_type)");
  await query("create index if not exists idx_products_min_stock on products(min_stock)");
  await query("create index if not exists idx_beim_receipt_parts_receipt on beim_receipt_parts(receipt_id)");
  await query("create index if not exists idx_beim_receipt_payments_receipt on beim_receipt_payments(receipt_id)");
  await query("create index if not exists idx_beim_receipt_payments_created_by on beim_receipt_payments(created_by)");
  await query("create index if not exists idx_beim_receipt_payments_created_at on beim_receipt_payments(created_at desc)");
  await query("create index if not exists idx_beim_receipt_purchases_receipt on beim_receipt_purchases(receipt_id)");
  await query("create index if not exists idx_beim_receipt_purchases_supplier on beim_receipt_purchases(lower(supplier_name))");
  await query("create index if not exists idx_beim_purchases_area on beim_purchases(purchase_area)");
  await query("create index if not exists idx_beim_purchases_supplier on beim_purchases(lower(supplier_name))");
  await query("create index if not exists idx_beim_purchases_created_at on beim_purchases(created_at desc)");
  await query("create index if not exists idx_beim_receipt_checklists_receipt on beim_receipt_checklists(receipt_id)");
  await query(`
    create table if not exists beim_fixed_expenses (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete set null,
      expense_month text not null,
      category_name text not null,
      amount numeric(12,2) not null default 0,
      notes text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_beim_fixed_expenses_month on beim_fixed_expenses(expense_month)");
}

async function startServer() {
  await ensureRuntimeSchema();
  server.listen(port, host, () => {
    console.log(`BEIM web: http://${host}:${port}/beim/`);
    console.log(`BEIM boleta: http://${host}:${port}/beim/boleta/`);
    console.log(`BEIM health: http://${host}:${port}/api/health`);
  });
}

startServer().catch((error) => {
  console.error("No se pudo iniciar BEIM web.", error);
  process.exit(1);
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    await closeDatabase();
    process.exit(0);
  });
});



