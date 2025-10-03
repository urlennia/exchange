// routes/payments.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { sendURDC } = require("../services/payout");

// Confirmed USDC payment → send URDC + save order
router.post("/confirm", async (req, res) => {
  const { buyerEmail, usdcAmount, urdcAmount, rate, wallet } = req.body;

  try {
    // 1. Send URDC payout
    const payout = await sendURDC(wallet, urdcAmount);
    if (!payout.success) {
      return res.status(500).json({ success: false, error: payout.error });
    }

    // 2. Record transaction in DB
    const [result] = await pool.query(
      `INSERT INTO orders (buyer_email, usdc_amount, urdc_amount, rate, wallet) 
       VALUES (?, ?, ?, ?, ?)`,
      [buyerEmail, usdcAmount, urdcAmount, rate, wallet]
    );

    res.json({
      success: true,
      orderId: result.insertId,
      txHash: payout.txHash
    });
  } catch (err) {
    console.error("Payment finalize error:", err);
    res.status(500).json({ success: false, error: "Payment processing failed" });
  }
});

module.exports = router;
