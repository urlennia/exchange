const express = require('express');
const router = express.Router();
const pool = require('../db');

// Save pending order (from frontend)
router.post('/', async (req, res) => {
  const { buyerEmail, wallet, usdcAmount, urdcAmount, rate } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO pending_orders 
        (buyer_email, wallet, usdc_amount, urdc_amount, rate) 
       VALUES (?, ?, ?, ?, ?)`,
      [buyerEmail, wallet, usdcAmount, urdcAmount, rate]
    );

    res.json({ success: true, pendingOrderId: result.insertId });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
