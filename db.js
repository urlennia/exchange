const fs = require('fs');
const { DB_PATH } = process.env;

function readDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------- Helper: Add new order ----------
function addOrder(order) {
  const db = readDB();
  db[order.orderId] = order;
  writeDB(db);
  return order;
}

// ---------- Helper: Update existing order ----------
function updateOrder(orderId, updates) {
  const db = readDB();
  if (!db[orderId]) throw new Error(`Order ${orderId} not found`);
  db[orderId] = { ...db[orderId], ...updates };
  writeDB(db);
  return db[orderId];
}

// ---------- Helper: Get order ----------
function getOrder(orderId) {
  const db = readDB();
  return db[orderId] || null;
}

module.exports = { readDB, writeDB, addOrder, updateOrder, getOrder };
