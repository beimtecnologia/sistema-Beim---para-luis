const fs = require("fs");
const vm = require("vm");
const store = new Map();
const elements = { reportDateFrom: { value: "2026-07-01" }, reportDateTo: { value: "2026-07-31" }, cashBusinessDate: { value: "2026-07-10" } };
const sandbox = {
  console, Intl, Date, Math, JSON, Number, String, Array, Set, Map, RegExp,
  Blob: function Blob() {}, URL: { createObjectURL: () => "", revokeObjectURL() {} },
  localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)) },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, getElementById: (id) => elements[id] || null, querySelector: () => null, querySelectorAll: () => [] },
  window: { addEventListener() {} }, alert() {}, confirm: () => true, prompt: () => null,
  fetch: async () => ({ ok: false, json: async () => ({}) }), setInterval() {}, setTimeout() {},
};
vm.createContext(sandbox);
const fixture = `
state = {
  clients: [], orders: [], products: [], productCategories: [], webProductCategories: [], services: [], serviceCategories: [],
  sales: [{ id: "s1", date: "2026-07-10", total: 100, items: [{ productId: "p1", productDescription: "Glass Samsung A14", quantity: 2, total: 100 }], returns: [{ items: [{ productId: "p1", quantity: 1, amount: 20 }] }], returnedAmount: 20 }],
  expenses: [{ id: "e1", date: "2026-07-10", amount: 30 }]
};
globalThis.reportResult = buildReportData();
globalThis.cashResult = cashExpectedForSession({ businessDate: "2026-07-10", openingAmount: 10 });`;
vm.runInContext(fs.readFileSync(__dirname + "/app.js", "utf8") + fixture, sandbox);
const report = sandbox.reportResult;
if (report.income !== 80 || report.expenses !== 30 || report.profit !== 50) throw new Error(`Totales incorrectos: ${JSON.stringify(report)}`);
if (report.products[0].quantity !== 1 || report.products[0].amount !== 80) throw new Error(`Producto incorrecto: ${JSON.stringify(report.products[0])}`);
if (sandbox.cashResult !== 60) throw new Error(`Caja incorrecta: ${sandbox.cashResult}`);
console.log(JSON.stringify({ income: report.income, expenses: report.expenses, profit: report.profit, cashExpected: sandbox.cashResult, product: report.products[0] }));
