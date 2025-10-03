// /routes/orders.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

// ---------- Create a new pending order ----------
router.post("/", async (req, res) => {
  const { buyerEmail, wallet, usdcAmount, urdcAmount, rate } = req.body;

  if (!buyerEmail || !wallet || !usdcAmount || !urdcAmount || !rate) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const orderId = uuidv4(); // unique order ID

    await pool.query(
      `INSERT INTO orders 
        (order_id, expected_usdc, buyer_email, sender_wallet, status, urdc_amount, urdc_rate, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
      [orderId, usdcAmount, buyerEmail, wallet.toLowerCase(), urdcAmount, rate]
    );

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("DB error creating order:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ---------- Mark failed order ----------
router.post('/:orderId/fail', async (req, res) => {
  const { orderId } = req.params;
  try {
    const [result] = await pool.query(
      "UPDATE orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'pending'",
      [orderId]
    );
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// ---------- Fetch all orders ----------
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("DB error fetching orders:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ---------- Fetch a single order by order_id ----------
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM orders WHERE order_id = ?", [orderId]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order: rows[0] });
  } catch (err) {
    console.error("DB error fetching order:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

module.exports = router;


