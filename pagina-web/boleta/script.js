const TERMS_STORAGE_KEY = "beim_boleta_garantia_v2";
const SERVICES_STORAGE_KEY = "beim_boleta_servicios_v1";
const MODELS_STORAGE_KEY = "beim_boleta_modelos_v1";
const BRANDS_STORAGE_KEY = "beim_boleta_marcas_v1";
const DELETED_BRANDS_STORAGE_KEY = "beim_boleta_marcas_borradas_v1";
const DELETED_MODELS_STORAGE_KEY = "beim_boleta_modelos_borrados_v1";
const DELETED_SERVICES_STORAGE_KEY = "beim_boleta_servicios_borrados_v1";
const VISUAL_STORAGE_KEY = "beim_boleta_inspeccion_visual_v1";
const RECEIPTS_STORAGE_KEY = "beim_boleta_indice_boletas_v1";
const BOLETA_API_BASE = `${window.location.origin}/api/beim/receipts`;
const BOLETA_PARAMS = new URLSearchParams(window.location.search);
const BOLETA_ACTOR_ID = BOLETA_PARAMS.get("userId") || "";
const BOLETA_INITIAL_QUERY = BOLETA_PARAMS.get("q") || "";

const DEFAULT_BRANDS = [
  "Samsung",
  "Apple",
  "Xiaomi",
  "Motorola",
  "Huawei",
  "Honor",
  "Oppo",
  "Realme",
  "Vivo",
  "Nokia",
  "LG",
  "Sony",
  "Tecno",
  "Infinix",
  "ZTE",
  "OnePlus",
];

const DEFAULT_MODELS = [
  ["Samsung", "A01"], ["Samsung", "A02"], ["Samsung", "A03"], ["Samsung", "A04"], ["Samsung", "A05"],
  ["Samsung", "A10"], ["Samsung", "A11"], ["Samsung", "A12"], ["Samsung", "A13"], ["Samsung", "A14"], ["Samsung", "A15"],
  ["Samsung", "A20"], ["Samsung", "A21s"], ["Samsung", "A22"], ["Samsung", "A23"], ["Samsung", "A24"],
  ["Samsung", "A30"], ["Samsung", "A31"], ["Samsung", "A32"], ["Samsung", "A33"], ["Samsung", "A34"],
  ["Samsung", "A50"], ["Samsung", "A51"], ["Samsung", "A52"], ["Samsung", "A53"], ["Samsung", "A54"],
  ["Samsung", "S20"], ["Samsung", "S21"], ["Samsung", "S22"], ["Samsung", "S23"], ["Samsung", "S24"],
  ["Apple", "iPhone 6"], ["Apple", "iPhone 6s"], ["Apple", "iPhone 7"], ["Apple", "iPhone 8"], ["Apple", "iPhone X"],
  ["Apple", "iPhone XR"], ["Apple", "iPhone XS"], ["Apple", "iPhone 11"], ["Apple", "iPhone 12"], ["Apple", "iPhone 13"],
  ["Apple", "iPhone 14"], ["Apple", "iPhone 15"], ["Apple", "iPhone 16"], ["Apple", "iPad"],
  ["Xiaomi", "Redmi 9"], ["Xiaomi", "Redmi 9A"], ["Xiaomi", "Redmi 10"], ["Xiaomi", "Redmi 10C"], ["Xiaomi", "Redmi 12"],
  ["Xiaomi", "Redmi 13C"], ["Xiaomi", "Redmi Note 8"], ["Xiaomi", "Redmi Note 9"], ["Xiaomi", "Redmi Note 10"],
  ["Xiaomi", "Redmi Note 11"], ["Xiaomi", "Redmi Note 12"], ["Xiaomi", "Redmi Note 13"], ["Xiaomi", "Poco X3"],
  ["Xiaomi", "Poco X4"], ["Xiaomi", "Poco X5"],
  ["Motorola", "Moto E6"], ["Motorola", "Moto E7"], ["Motorola", "Moto E13"], ["Motorola", "Moto E20"],
  ["Motorola", "Moto E22"], ["Motorola", "Moto G8"], ["Motorola", "Moto G9"], ["Motorola", "Moto G10"],
  ["Motorola", "Moto G20"], ["Motorola", "Moto G22"], ["Motorola", "Moto G30"], ["Motorola", "Moto G32"],
  ["Motorola", "Moto G50"], ["Motorola", "Moto G60"], ["Motorola", "Moto G71"],
  ["Huawei", "P20"], ["Huawei", "P30"], ["Huawei", "P40"], ["Huawei", "Y5"], ["Huawei", "Y6"], ["Huawei", "Y7"], ["Huawei", "Y9"],
  ["Honor", "X7"], ["Honor", "X8"], ["Honor", "X9"],
  ["Oppo", "A15"], ["Oppo", "A16"], ["Oppo", "A54"],
  ["Realme", "C11"], ["Realme", "C21"], ["Realme", "C35"],
  ["Vivo", "Y11"], ["Vivo", "Y20"], ["Vivo", "Y21"],
  ["Tecno", "Spark 8"], ["Tecno", "Spark 10"],
  ["Infinix", "Hot 10"], ["Infinix", "Hot 11"],
  ["Nokia", "C20"], ["LG", "K10"], ["LG", "K40"], ["Sony", "Xperia"], ["ZTE", "Blade A5"], ["OnePlus", "Nord"],
];

const DEFAULT_TERMS = `El equipo ingresa para diagnÃ³stico o reparaciÃ³n segÃºn la falla reportada por el cliente.
La garantÃ­a cubre Ãºnicamente el trabajo realizado y las piezas instaladas por BEIM.
La garantÃ­a no cubre golpes, humedad, manipulaciÃ³n de terceros, uso indebido, nuevas fallas o daÃ±os no relacionados con la reparaciÃ³n.
El cliente declara haber revisado la inspecciÃ³n visual indicada en esta boleta.
Todo equipo debe retirarse con esta boleta o documento de identidad del titular.
Pasados 180 dÃ­as desde la notificaciÃ³n de entrega, presupuesto o imposibilidad de reparaciÃ³n, si el cliente no retira el equipo ni responde a los avisos de contacto, el equipo serÃ¡ considerado abandonado. BEIM podrÃ¡ disponer del equipo para cubrir gastos de diagnÃ³stico, reparaciÃ³n, almacenamiento, administraciÃ³n o reciclaje, sin derecho a reclamo posterior.`;

const DEFAULT_SERVICES = [
  "Cambio de pantalla",
  "Cambio de pin de carga",
  "Cambio de cÃ¡mara",
  "Cambio de tapa",
  "ReparaciÃ³n en placa",
  "Cambio de lens de cÃ¡mara",
  "Cambio de parlante",
  "Cambio de micrÃ³fono",
  "Cambio de auricular",
  "Cambio de baterÃ­a",
  "DiagnÃ³stico",
  "Mantenimiento",
];

const DEFAULT_VISUAL_OPTIONS = [
  "Pantalla partida o daÃ±ada",
  "Equipo no enciende",
  "Equipo no carga",
  "Marco doblado",
  "Tapa partida",
  "Lens de cÃ¡mara partido",
  "Lens de cÃ¡mara rayado",
  "Pin de carga sucio",
  "BaterÃ­a inflada",
  "Pantalla despegada",
  "CÃ¡mara frontal expuesta",
  "CÃ¡mara trasera expuesta",
  "MicrÃ³fono no funciona",
  "Auricular no funciona",
  "Parlante no funciona",
  "CÃ¡mara frontal no funciona",
  "CÃ¡mara trasera no funciona",
  "Sin seÃ±al",
  "Sin bandeja SIM",
  "Sin tapa",
  "Sin pantalla",
];

const form = document.querySelector("#ticket-form");
const printBtn = document.querySelector("#print-btn");
const saveBtn = document.querySelector("#save-btn");
const clearBtn = document.querySelector("#clear-btn");
const editTermsBtn = document.querySelector("#edit-terms-btn");
const addModelBtn = document.querySelector("#add-model-btn");
const addServiceBtn = document.querySelector("#add-service-btn");
const addVisualBtn = document.querySelector("#add-visual-btn");
const searchBox = document.querySelector("#search-box");
const searchBtn = document.querySelector("#search-btn");
const receiptResults = document.querySelector("#receipt-results");
const drawPatternBtn = document.querySelector("#draw-pattern-btn");
const brandOptions = document.querySelector("#brand-options");
const modelOptions = document.querySelector("#model-options");
const modelPicker = document.querySelector("#model-picker");
const serviceChecks = document.querySelector("#service-checks");
const serviceSummary = document.querySelector("#service-summary");
const visualChecks = document.querySelector("#visual-checks");
const visualPreview = document.querySelector("#visual-preview");
const patternDialog = document.querySelector("#pattern-dialog");
const patternPad = document.querySelector("#pattern-pad");
const patternSequence = document.querySelector("#pattern-sequence");
const clearPatternBtn = document.querySelector("#clear-pattern-btn");
const savePatternBtn = document.querySelector("#save-pattern-btn");
const patternPreview = document.querySelector("#pattern-preview");
const termsDialog = document.querySelector("#terms-dialog");
const termsEditor = document.querySelector("#terms-editor");
const termsPreview = document.querySelector("#terms-preview");
const saveTermsBtn = document.querySelector("#save-terms-btn");
const resetTermsBtn = document.querySelector("#reset-terms-btn");
const receiptNumber = document.querySelector("#receipt-number");
const modelColorPreview = document.querySelector("#model-color-preview");

const previewFields = Array.from(document.querySelectorAll("[data-preview]"));
let savedReceipt = null;
let latestReceiptResults = [];

const REPAIR_STATUSES = [
  "Ingresado",
  "En diagnÃ³stico",
  "Presupuestado",
  "Esperando repuesto",
  "En reparaciÃ³n",
  "Listo para retirar",
  "Entregado",
  "Cancelado",
];

function formatCurrentDateTime() {
  return new Intl.DateTimeFormat("es-UY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createReceiptNumber() {
  return "NÂ° 1000";
}

function getTerms() {
  return localStorage.getItem(TERMS_STORAGE_KEY) || DEFAULT_TERMS;
}

function setTerms(value) {
  const nextValue = String(value || "").trim() || DEFAULT_TERMS;
  localStorage.setItem(TERMS_STORAGE_KEY, nextValue);
  termsPreview.textContent = printableTerms();
}

function printableTerms() {
  const base = getTerms();
  const warranty = getFieldValue("warrantyOffered") || "30 dÃ­as";
  const line = `Tiempo de garantÃ­a ofrecida: ${warranty}.`;
  return base.toLowerCase().includes("tiempo de garantÃ­a ofrecida")
    ? base.replace(/tiempo de garantÃ­a ofrecida:.*$/im, line)
    : `${line}\n${base}`;
}

function getServices() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SERVICES_STORAGE_KEY) || "[]");
    const deleted = getDeletedServices();
    const merged = [...DEFAULT_SERVICES, ...parsed]
      .map((service) => String(service || "").trim())
      .filter((service) => service && !deleted.some((item) => item.toLowerCase() === service.toLowerCase()));
    return [...new Set(merged)].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  } catch {
    return [...DEFAULT_SERVICES].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }
}

function getDeletedServices() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_SERVICES_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setServices(services) {
  const sorted = [...new Set(services)]
    .map((service) => String(service || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(sorted));
  renderServices();
}

function selectedServices() {
  return Array.from(serviceChecks.querySelectorAll("input[type='checkbox']:checked"))
    .map((item) => item.value.trim())
    .filter(Boolean);
}

function selectedServicesText() {
  const selected = selectedServices();
  return selected.length ? selected.join(", ") : "-";
}

function getVisualOptions() {
  try {
    const custom = JSON.parse(localStorage.getItem(VISUAL_STORAGE_KEY) || "[]")
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return [...new Set([...DEFAULT_VISUAL_OPTIONS, ...custom])];
  } catch {
    return [...DEFAULT_VISUAL_OPTIONS];
  }
}

function setVisualOptions(options) {
  const custom = options
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => !DEFAULT_VISUAL_OPTIONS.some((base) => base.toLowerCase() === item.toLowerCase()));
  localStorage.setItem(VISUAL_STORAGE_KEY, JSON.stringify([...new Set(custom)]));
}

function selectedVisualItems() {
  return Array.from(visualChecks.querySelectorAll("input[type='checkbox']:checked"))
    .map((item) => item.value.trim())
    .filter(Boolean);
}

function selectedVisualText() {
  const selected = selectedVisualItems();
  return selected.length ? selected.map((item) => `- ${item}`).join("\n") : "-";
}

function renderVisualOptions() {
  const selected = new Set(selectedVisualItems().map((item) => item.toLowerCase()));
  visualChecks.innerHTML = "";
  getVisualOptions().forEach((option) => {
    const label = document.createElement("label");
    label.className = "visual-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option;
    checkbox.checked = selected.has(option.toLowerCase());
    checkbox.addEventListener("change", updatePreview);
    const text = document.createElement("span");
    text.textContent = option;
    label.append(checkbox, text);
    visualChecks.append(label);
  });
}

function addVisualOption() {
  const option = String(prompt("Escribe la condiciÃ³n visual:") || "").trim();
  if (!option) return;
  const options = getVisualOptions();
  if (!options.some((item) => item.toLowerCase() === option.toLowerCase())) {
    setVisualOptions([...options, option]);
  }
  renderVisualOptions();
  const checkbox = Array.from(visualChecks.querySelectorAll("input[type='checkbox']"))
    .find((item) => item.value.toLowerCase() === option.toLowerCase());
  if (checkbox) checkbox.checked = true;
  updatePreview();
}

function renderServices() {
  const selected = new Set(selectedServices().map((service) => service.toLowerCase()));
  serviceChecks.innerHTML = "";
  getServices().forEach((service) => {
    const label = document.createElement("label");
    label.className = "check-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = service;
    checkbox.checked = selected.has(service.toLowerCase());
    checkbox.addEventListener("change", updatePreview);
    label.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      openServiceContextMenu(service);
    });

    const text = document.createElement("span");
    text.textContent = service;

    label.append(checkbox, text);
    serviceChecks.append(label);
  });
  updateServiceSummary();
}

function renderBrands() {
  brandOptions.innerHTML = "";
  getBrands().forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    brandOptions.append(option);
  });
}

function getBrands() {
  let custom = [];
  let deleted = [];
  try {
    custom = JSON.parse(localStorage.getItem(BRANDS_STORAGE_KEY) || "[]");
    deleted = JSON.parse(localStorage.getItem(DELETED_BRANDS_STORAGE_KEY) || "[]");
  } catch {
    custom = [];
    deleted = [];
  }

  return [...new Set([...DEFAULT_BRANDS, ...custom].map((item) => String(item || "").trim()).filter(Boolean))]
    .filter((brand) => !deleted.some((item) => item.toLowerCase() === brand.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function getModelsForCurrentBrand() {
  const brand = getFieldValue("deviceBrand").toLowerCase();
  const customModels = getCustomModels();
  const deletedModels = getDeletedModels();
  return [...new Set([...DEFAULT_MODELS, ...customModels]
    .filter(([modelBrand]) => !brand || modelBrand.toLowerCase() === brand)
    .filter(([modelBrand, model]) => !deletedModels.some((item) =>
      item.brand.toLowerCase() === modelBrand.toLowerCase() &&
      item.model.toLowerCase() === model.toLowerCase()
    ))
    .map(([, model]) => model)
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })))]
}

function renderModels() {
  const models = getModelsForCurrentBrand();

  modelOptions.innerHTML = "";
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    modelOptions.append(option);
  });
  renderModelPicker(models);
}

function getDeletedModels() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_MODELS_STORAGE_KEY) || "[]")
      .map((item) => ({ brand: String(item.brand || "").trim(), model: String(item.model || "").trim() }))
      .filter((item) => item.brand && item.model);
  } catch {
    return [];
  }
}

function getCustomModels() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MODELS_STORAGE_KEY) || "[]");
    return parsed
      .map((item) => [String(item.brand || "").trim(), String(item.model || "").trim()])
      .filter(([brand, model]) => brand && model);
  } catch {
    return [];
  }
}

function setCustomModels(models) {
  const sorted = [...models].sort((a, b) => {
    const brandCompare = a[0].localeCompare(b[0], "es", { sensitivity: "base" });
    return brandCompare || a[1].localeCompare(b[1], "es", { sensitivity: "base" });
  });
  localStorage.setItem(
    MODELS_STORAGE_KEY,
    JSON.stringify(sorted.map(([brand, model]) => ({ brand, model })))
  );
}

function addCurrentModel() {
  const brand = getFieldValue("deviceBrand");
  const model = getFieldValue("deviceModel");

  if (!model) {
    alert("Escribe el modelo que quieres aÃ±adir.");
    return;
  }

  if (!brand) {
    alert("Selecciona o escribe primero la marca del equipo.");
    return;
  }

  const customModels = getCustomModels();
  const exists = [...DEFAULT_MODELS, ...customModels].some(
    ([itemBrand, itemModel]) =>
      itemBrand.toLowerCase() === brand.toLowerCase() &&
      itemModel.toLowerCase() === model.toLowerCase()
  );

  if (!exists) {
    setCustomModels([...customModels, [brand, model]]);
  }

  renderModels();
  form.elements.deviceModel.value = model;
  updatePreview();
}

function editCurrentBrand() {
  const oldBrand = getFieldValue("deviceBrand");
  if (!oldBrand) return;
  const newBrand = String(prompt("Editar marca:", oldBrand) || "").trim();
  if (!newBrand || newBrand.toLowerCase() === oldBrand.toLowerCase()) return;

  const brands = getBrands().filter((brand) => brand.toLowerCase() !== oldBrand.toLowerCase());
  localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify([...brands, newBrand]));

  const customModels = getCustomModels().map(([brand, model]) => [
    brand.toLowerCase() === oldBrand.toLowerCase() ? newBrand : brand,
    model,
  ]);
  setCustomModels(customModels);

  form.elements.deviceBrand.value = newBrand;
  renderBrands();
  renderModels();
  updatePreview();
}

function deleteCurrentBrand() {
  const brand = getFieldValue("deviceBrand");
  if (!brand || !confirm(`Â¿Eliminar la marca "${brand}"?`)) return;
  const deleted = JSON.parse(localStorage.getItem(DELETED_BRANDS_STORAGE_KEY) || "[]");
  localStorage.setItem(DELETED_BRANDS_STORAGE_KEY, JSON.stringify([...new Set([...deleted, brand])]));
  form.elements.deviceBrand.value = "";
  renderBrands();
  renderModels();
  updatePreview();
}

function editCurrentModel() {
  const brand = getFieldValue("deviceBrand");
  const oldModel = getFieldValue("deviceModel");
  if (!brand || !oldModel) return;
  const newModel = String(prompt("Editar modelo:", oldModel) || "").trim();
  if (!newModel || newModel.toLowerCase() === oldModel.toLowerCase()) return;

  const customModels = getCustomModels().filter(
    ([itemBrand, itemModel]) =>
      itemBrand.toLowerCase() !== brand.toLowerCase() ||
      itemModel.toLowerCase() !== oldModel.toLowerCase()
  );
  setCustomModels([...customModels, [brand, newModel]]);

  const deleted = getDeletedModels();
  localStorage.setItem(DELETED_MODELS_STORAGE_KEY, JSON.stringify([...deleted, { brand, model: oldModel }]));
  form.elements.deviceModel.value = newModel;
  renderModels();
  updatePreview();
}

function deleteCurrentModel() {
  const brand = getFieldValue("deviceBrand");
  const model = getFieldValue("deviceModel");
  if (!brand || !model || !confirm(`Â¿Eliminar el modelo "${model}"?`)) return;
  const deleted = getDeletedModels();
  localStorage.setItem(DELETED_MODELS_STORAGE_KEY, JSON.stringify([...deleted, { brand, model }]));
  form.elements.deviceModel.value = "";
  renderModels();
  updatePreview();
}

function editModelValue(model) {
  const brand = getFieldValue("deviceBrand");
  if (!brand || !model) return;
  form.elements.deviceModel.value = model;
  editCurrentModel();
  showModelPicker();
}

function deleteModelValue(model) {
  const brand = getFieldValue("deviceBrand");
  if (!brand || !model) return;
  form.elements.deviceModel.value = model;
  deleteCurrentModel();
  showModelPicker();
}

function openModelContextMenu(model) {
  const action = String(prompt(`Modelo: ${model}\nEscribe "editar" o "eliminar":`) || "").trim().toLowerCase();
  if (action === "editar") editModelValue(model);
  if (action === "eliminar") deleteModelValue(model);
}

function renderModelPicker(models = getModelsForCurrentBrand()) {
  modelPicker.innerHTML = "";
  models.forEach((model) => {
    const row = document.createElement("div");
    row.className = "model-option";

    const select = document.createElement("button");
    select.type = "button";
    select.className = "model-select";
    select.textContent = model;
    select.addEventListener("click", () => {
      form.elements.deviceModel.value = model;
      modelPicker.hidden = true;
      updatePreview();
    });

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "model-action";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => editModelValue(model));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "model-action";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => deleteModelValue(model));

    row.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      openModelContextMenu(model);
    });
    row.append(select, edit, remove);
    modelPicker.append(row);
  });
}

function showModelPicker() {
  renderModels();
  modelPicker.hidden = modelPicker.children.length === 0;
}

function openServiceContextMenu(service) {
  const action = String(prompt(`Servicio: ${service}\nEscribe "editar" o "eliminar":`) || "").trim().toLowerCase();
  if (action === "editar") {
    const next = String(prompt("Editar servicio:", service) || "").trim();
    if (!next || next.toLowerCase() === service.toLowerCase()) return;
    const services = getServices().filter((item) => item.toLowerCase() !== service.toLowerCase());
    setServices([...services, next]);
    const deleted = getDeletedServices();
    localStorage.setItem(DELETED_SERVICES_STORAGE_KEY, JSON.stringify([...new Set([...deleted, service])]));
    renderServices();
    const checkbox = Array.from(serviceChecks.querySelectorAll("input[type='checkbox']"))
      .find((item) => item.value.toLowerCase() === next.toLowerCase());
    if (checkbox) checkbox.checked = true;
    updatePreview();
  } else if (action === "eliminar") {
    if (!confirm(`Â¿Eliminar el servicio "${service}"?`)) return;
    const deleted = getDeletedServices();
    localStorage.setItem(DELETED_SERVICES_STORAGE_KEY, JSON.stringify([...new Set([...deleted, service])]));
    renderServices();
    updatePreview();
  }
}

function addCurrentService() {
  const service = String(prompt("Escribe el servicio que quieres aÃ±adir:") || "").trim();
  if (!service) {
    return;
  }

  const services = getServices();
  if (!services.some((item) => item.toLowerCase() === service.toLowerCase())) {
    setServices([...services, service]);
  }

  renderServices();
  const checkbox = Array.from(serviceChecks.querySelectorAll("input[type='checkbox']"))
    .find((item) => item.value.toLowerCase() === service.toLowerCase());
  if (checkbox) checkbox.checked = true;
  updatePreview();
}

function updateServiceSummary() {
  const text = selectedServicesText();
  serviceSummary.textContent = text === "-" ? "Seleccionar servicios" : text;
}

function getFieldValue(name) {
  const field = form.elements[name];
  return field ? String(field.value || "").trim() : "";
}

function modelWithColor() {
  const model = getFieldValue("deviceModel");
  const color = getFieldValue("deviceColor");
  if (!model && !color) return "-";
  if (!model) return color;
  if (!color) return model;
  return `${model} ${color.toLowerCase()}`;
}

function deliveryText() {
  const number = getFieldValue("deliveryTime");
  const unit = getFieldValue("deliveryUnit");
  if (!number) return "-";
  if (unit === "h") return number === "1" ? "1 hora" : `${number} horas`;
  if (unit === "d") return number === "1" ? "1 dÃ­a" : `${number} dÃ­as`;
  return number;
}

function parsePattern(value) {
  return String(value || "")
    .split(/[-,;\s]+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((item, index, arr) => item >= 1 && item <= 9 && arr.indexOf(item) === index);
}

function patternSvg(value) {
  const points = parsePattern(value);
  if (!points.length) return "<span class=\"muted-small\">Sin patrÃ³n</span>";
  const coords = {
    1: [18, 18], 2: [47, 18], 3: [76, 18],
    4: [18, 47], 5: [47, 47], 6: [76, 47],
    7: [18, 76], 8: [47, 76], 9: [76, 76],
  };
  const lines = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return `<line x1="${coords[point][0]}" y1="${coords[point][1]}" x2="${coords[next][0]}" y2="${coords[next][1]}" />`;
  }).join("");
  const dots = Object.entries(coords).map(([key, [x, y]]) => {
    const selected = points.includes(Number(key));
    return `<g><circle cx="${x}" cy="${y}" r="7" class="${selected ? "selected" : ""}"></circle><text x="${x}" y="${y + 3}">${key}</text></g>`;
  }).join("");
  return `<svg class="pattern-drawing" viewBox="0 0 94 94" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="92" height="92" rx="8"></rect>${lines}${dots}</svg><small>${value}</small>`;
}

function fillDefaultDate() {
  form.elements.entryDate.value = formatCurrentDateTime();
  receiptNumber.textContent = createReceiptNumber();
}

function updatePreview() {
  previewFields.forEach((node) => {
    const key = node.dataset.preview;
    node.textContent = key === "serviceToDo" ? selectedServicesText() : getFieldValue(key) || "-";
  });
  const deliveryNode = document.querySelector('[data-preview="deliveryTime"]');
  if (deliveryNode) deliveryNode.textContent = deliveryText();
  const visualItems = selectedVisualItems();
  visualPreview.innerHTML = visualItems.length
    ? visualItems.map((item) => `<div>- ${item}</div>`).join("")
    : "<div>-</div>";
  modelColorPreview.textContent = modelWithColor();
  patternPreview.innerHTML = patternSvg(getFieldValue("unlockPattern"));
  termsPreview.textContent = printableTerms();
  updateServiceSummary();
}

function clearForm() {
  savedReceipt = null;
  form.reset();
  fillDefaultDate();
  loadNextReceiptNumber();
  updatePreview();
}

function openTermsEditor() {
  termsEditor.value = getTerms();
  if (typeof termsDialog.showModal === "function") {
    termsDialog.showModal();
  } else {
    termsDialog.setAttribute("open", "");
  }
}

function closeTermsEditor() {
  if (typeof termsDialog.close === "function") {
    termsDialog.close();
  } else {
    termsDialog.removeAttribute("open");
  }
}

async function printReceipt() {
  const receipt = savedReceipt || await saveReceipt();
  if (!receipt) return;
  savedReceipt = receipt;
  receiptNumber.textContent = formatReceiptNumber(receipt.number);
  updatePreview();
  preparePrintCopies();
  window.print();
  window.setTimeout(() => {
    cleanupPrintCopies();
    clearForm();
  }, 250);
}

async function saveReceiptOnly() {
  const receipt = await saveReceipt();
  if (!receipt) return;
  savedReceipt = receipt;
  receiptNumber.textContent = formatReceiptNumber(receipt.number);
  updatePreview();
  alert(`Boleta ${formatReceiptNumber(receipt.number)} guardada correctamente.`);
}

function preparePrintCopies() {
  cleanupPrintCopies();
  const receipt = document.querySelector("#receipt");
  const previewPanel = document.querySelector(".preview-panel");
  if (!receipt || !previewPanel) return;
  const copy = receipt.cloneNode(true);
  copy.id = "receipt-copy-2";
  copy.classList.add("print-copy");
  previewPanel.append(copy);
}

function cleanupPrintCopies() {
  document.querySelectorAll(".print-copy").forEach((node) => node.remove());
}

function saveReceiptIndex() {
  const receipts = getReceipts();
  receipts.push({
    number: receiptNumber.textContent,
    date: getFieldValue("entryDate"),
    model: getFieldValue("deviceModel"),
    brand: getFieldValue("deviceBrand"),
  });
  localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts.slice(-300)));
}

function getReceipts() {
  try {
    return JSON.parse(localStorage.getItem(RECEIPTS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function searchReceipts() {
  const query = String(searchBox.value || "").trim().toLowerCase();
  if (!query) {
    alert("Escribe un nÃºmero de orden, modelo o fecha para buscar.");
    return;
  }
  const results = getReceipts().filter((item) =>
    [item.number, item.date, item.model, item.brand].some((value) =>
      String(value || "").toLowerCase().includes(query)
    )
  );
  alert(results.length
    ? results.map((item) => `${item.number} | ${item.date} | ${item.brand || ""} ${item.model || ""}`).join("\n")
    : "No encontrÃ© boletas con esa bÃºsqueda.");
}

let patternDraft = [];

function formatReceiptNumber(number) {
  return `NÂ° ${String(number || 1000).padStart(4, "0")}`;
}

function boletaApiUrl(path = "", params = {}) {
  const url = new URL(`${BOLETA_API_BASE}${path}`, window.location.origin);
  if (BOLETA_ACTOR_ID) url.searchParams.set("actorId", BOLETA_ACTOR_ID);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) url.searchParams.set(key, value);
  });
  return url.toString();
}

async function boletaApiRequest(path = "", options = {}) {
  const response = await fetch(boletaApiUrl(path, options.params), {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "No se pudo completar la solicitud.");
  }
  return payload;
}

async function loadNextReceiptNumber() {
  if (!BOLETA_ACTOR_ID) return;
  try {
    const payload = await boletaApiRequest("/next-number");
    receiptNumber.textContent = formatReceiptNumber(payload.nextNumber);
  } catch (error) {
    console.warn("No se pudo obtener el proximo numero de boleta.", error);
  }
}

function collectReceiptPayload() {
  return {
    clientName: getFieldValue("clientName"),
    clientId: getFieldValue("clientId"),
    clientPhone: getFieldValue("clientPhone"),
    entryDate: getFieldValue("entryDate"),
    deviceBrand: getFieldValue("deviceBrand"),
    deviceModel: getFieldValue("deviceModel"),
    deviceColor: getFieldValue("deviceColor"),
    services: selectedServices(),
    reportedIssue: getFieldValue("reportedIssue"),
    visualItems: selectedVisualItems(),
    deliveryTime: getFieldValue("deliveryTime"),
    deliveryUnit: getFieldValue("deliveryUnit"),
    warrantyOffered: getFieldValue("warrantyOffered"),
    price: getFieldValue("price"),
    unlockCode: getFieldValue("unlockCode"),
    unlockPassword: getFieldValue("unlockPassword"),
    unlockPattern: getFieldValue("unlockPattern"),
    terms: printableTerms(),
  };
}

async function saveReceipt() {
  if (!BOLETA_ACTOR_ID) {
    alert("No se encontro la sesion del usuario. Abre la boleta desde la categoria Beim de la web.");
    return null;
  }
  try {
    const payload = await boletaApiRequest("", {
      method: "POST",
      body: collectReceiptPayload(),
    });
    return payload.receipt;
  } catch (error) {
    alert(error.message);
    return null;
  }
}

async function searchReceiptsInDatabase() {
  const query = String(searchBox.value || "").trim().toLowerCase();
  if (!query) {
    alert("Escribe un numero de boleta, modelo, cedula o nombre del cliente para buscar.");
    return;
  }
  try {
    const payload = await boletaApiRequest("", { params: { query } });
    renderReceiptResults(payload.receipts || []);
    return payload.receipts || [];
  } catch (error) {
    alert(error.message);
    return [];
  }
}

function renderReceiptResults(results) {
  if (!receiptResults) return;
  latestReceiptResults = Array.isArray(results) ? results : [];
  receiptResults.hidden = false;
  receiptResults.innerHTML = latestReceiptResults.length ? `
    <div class="results-head">
      <strong>Boletas encontradas</strong>
      <span>${latestReceiptResults.length} resultado${latestReceiptResults.length === 1 ? "" : "s"}</span>
    </div>
    <div class="results-list">
      ${latestReceiptResults.map((item, index) => `
        <button class="result-card" type="button" data-load-receipt="${index}">
          <strong>${formatReceiptNumber(item.number)}</strong>
          <span>${escapeHtml(item.clientName || "-")} | CI: ${escapeHtml(item.clientId || "-")}</span>
          <span>${escapeHtml([item.deviceBrand, item.deviceModel, item.deviceColor].filter(Boolean).join(" ") || "-")}</span>
          <small>${escapeHtml(item.entryDate || item.createdAt || "")}</small>
        </button>
      `).join("")}
    </div>
  ` : `<p class="empty-results">No encontre boletas con esa busqueda.</p>`;
  receiptResults.querySelectorAll("[data-load-receipt]").forEach((button) => {
    button.addEventListener("click", () => loadReceiptIntoForm(latestReceiptResults[Number(button.dataset.loadReceipt)]));
  });
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

function loadReceiptIntoForm(receipt) {
  if (!receipt) return;
  savedReceipt = receipt;
  ensureLoadedOptions(receipt);
  receiptNumber.textContent = formatReceiptNumber(receipt.number);
  setFieldValue("clientName", receipt.clientName);
  setFieldValue("clientId", receipt.clientId);
  setFieldValue("clientPhone", receipt.clientPhone);
  setFieldValue("entryDate", receipt.entryDate);
  setFieldValue("deviceBrand", receipt.deviceBrand);
  renderModels();
  setFieldValue("deviceModel", receipt.deviceModel);
  setFieldValue("deviceColor", receipt.deviceColor);
  setFieldValue("reportedIssue", receipt.reportedIssue);
  setFieldValue("deliveryTime", receipt.deliveryTime);
  setFieldValue("deliveryUnit", receipt.deliveryUnit);
  setFieldValue("warrantyOffered", receipt.warrantyOffered);
  setFieldValue("price", receipt.price);
  setFieldValue("unlockCode", receipt.unlockCode);
  setFieldValue("unlockPassword", receipt.unlockPassword);
  setFieldValue("unlockPattern", receipt.unlockPattern);
  setCheckedValues(serviceChecks, receipt.services);
  setCheckedValues(visualChecks, receipt.visualItems);
  updatePreview();
  document.querySelector(".preview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPatternPad() {
  patternPad.innerHTML = "";
  for (let point = 1; point <= 9; point += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = point;
    button.className = patternDraft.includes(point) ? "selected" : "";
    button.addEventListener("click", () => {
      if (!patternDraft.includes(point)) patternDraft.push(point);
      patternSequence.textContent = patternDraft.length ? patternDraft.join("-") : "Toca los puntos del patrÃ³n";
      renderPatternPad();
    });
    patternPad.append(button);
  }
}

function openPatternDialog() {
  patternDraft = parsePattern(getFieldValue("unlockPattern"));
  patternSequence.textContent = patternDraft.length ? patternDraft.join("-") : "Toca los puntos del patrÃ³n";
  renderPatternPad();
  if (typeof patternDialog.showModal === "function") patternDialog.showModal();
  else patternDialog.setAttribute("open", "");
}

form.addEventListener("input", () => {
  invalidateSavedReceipt();
  updatePreview();
});
form.addEventListener("change", () => {
  invalidateSavedReceipt();
  updatePreview();
});
form.elements.deviceBrand.addEventListener("input", renderModels);
form.elements.deviceBrand.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const action = String(prompt("Marca: escribe \"editar\" o \"eliminar\":") || "").trim().toLowerCase();
  if (action === "editar") editCurrentBrand();
  if (action === "eliminar") deleteCurrentBrand();
});
form.elements.deviceModel.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const action = String(prompt("Modelo: escribe \"editar\" o \"eliminar\":") || "").trim().toLowerCase();
  if (action === "editar") editCurrentModel();
  if (action === "eliminar") deleteCurrentModel();
});
form.elements.deviceModel.addEventListener("focus", showModelPicker);
form.elements.deviceModel.addEventListener("click", showModelPicker);
form.elements.deviceModel.addEventListener("input", () => {
  renderModels();
  showModelPicker();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".model-field")) modelPicker.hidden = true;
});
printBtn.addEventListener("click", printReceipt);
saveBtn?.addEventListener("click", saveReceiptOnly);
clearBtn.addEventListener("click", clearForm);
editTermsBtn.addEventListener("click", openTermsEditor);
addModelBtn.addEventListener("click", addCurrentModel);
addServiceBtn.addEventListener("click", addCurrentService);
addVisualBtn.addEventListener("click", addVisualOption);
searchBtn.addEventListener("click", searchReceiptsInDatabase);
searchBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchReceiptsInDatabase();
  }
});
drawPatternBtn.addEventListener("click", openPatternDialog);
clearPatternBtn.addEventListener("click", () => {
  patternDraft = [];
  patternSequence.textContent = "Toca los puntos del patrÃ³n";
  renderPatternPad();
});
savePatternBtn.addEventListener("click", () => {
  form.elements.unlockPattern.value = patternDraft.join("-");
  if (typeof patternDialog.close === "function") patternDialog.close();
  else patternDialog.removeAttribute("open");
  updatePreview();
});

saveTermsBtn.addEventListener("click", () => {
  setTerms(termsEditor.value);
  closeTermsEditor();
});

resetTermsBtn.addEventListener("click", () => {
  termsEditor.value = DEFAULT_TERMS;
  setTerms(DEFAULT_TERMS);
});

async function init() {
  renderBrands();
  renderModels();
  renderServices();
  renderVisualOptions();
  fillDefaultDate();
  await loadNextReceiptNumber();
  setTerms(getTerms());
  updatePreview();
  if (BOLETA_INITIAL_QUERY) {
    searchBox.value = BOLETA_INITIAL_QUERY;
    const results = await searchReceiptsInDatabase();
    const exactReceipt = results.find((receipt) => String(receipt.number || "") === String(BOLETA_INITIAL_QUERY).trim()) || results[0];
    if (exactReceipt) loadReceiptIntoForm(exactReceipt);
  }
}

init();


