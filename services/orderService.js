const { readDB, writeDB } = require('../db');

function createOrder(order) {
  const db = readDB();
  db[order.orderId] = order;
  writeDB(db);
  return order;
}

function markOrderFailed(orderId) {
  const db = readDB();
  if (db[orderId]) {
    db[orderId].status = 'failed';
    writeDB(db);
    return db[orderId];
  }
  return null;
}

function getOrder(orderId) {
  const db = readDB();
  return db[orderId] || null;
}

module.exports = { createOrder, markOrderFailed, getOrder };
