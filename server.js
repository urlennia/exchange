require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { WebSocketServer } = require("ws");
const { getWalletFromEnv } = require("./utils/wallet");

// ---------- App Setup ----------
const app = express();
app.use(bodyParser.json());

// Use helper for TREASURY wallet
const treasuryWallet = getWalletFromEnv("TREASURY_PRIVATE_KEY");

// ---------- Routes ----------
app.use("/api/payments", require("./routes/payments"));
app.use("/api/pending-orders", require("./routes/pendingOrders"));
app.use("/api/orders", require("./routes/orders"));

// ---------- Blockchain Listener ----------
const { listenForUSDCPayments } = require("./services/blockchain");

// ---------- Server ----------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  listenForUSDCPayments();
});

// ---------- WebSocket ----------
const wss = new WebSocketServer({ server });
const subscribers = {}; // walletAddress -> ws

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "subscribe" && data.wallet) {
        subscribers[data.wallet.toLowerCase()] = ws;
        console.log(`📡 Subscribed: ${data.wallet}`);
      }
    } catch (err) {
      console.error("WS error:", err);
    }
  });

  ws.on("close", () => {
    for (const wallet in subscribers) {
      if (subscribers[wallet] === ws) delete subscribers[wallet];
    }
  });
});

// ---------- Helper ----------
function notifyPaymentConfirmed(walletAddress, urdcAmount) {
  const ws = subscribers[walletAddress.toLowerCase()];
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "paymentConfirmed", wallet: walletAddress, urdcAmount }));
    console.log(`✅ Sent paymentConfirmed to ${walletAddress}`);
  }
}

// ---------- Exports ----------
module.exports = { treasuryWallet, notifyPaymentConfirmed };
