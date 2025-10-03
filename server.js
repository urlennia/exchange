require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Wallet } = require("ethers");
const { WebSocketServer } = require("ws");

// ---------- App Setup ----------
const app = express();
app.use(bodyParser.json());

// ---------- Environment Variables ----------
let privateKey = process.env.TREASURY_PRIVATE_KEY;
if (!privateKey) throw new Error("TREASURY_PRIVATE_KEY not set in environment!");

const { getWalletFromEnv } = require("./utils/wallet");
const wallet = getWalletFromEnv("TREASURY_PRIVATE_KEY");


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
const { addSubscriber, removeSubscriber } = require("./services/notifications");

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "subscribe" && data.wallet) {
        addSubscriber(data.wallet, ws);
      }
    } catch (err) {
      console.error("WS error:", err);
    }
  });

  ws.on("close", () => {
    removeSubscriber(ws);
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
module.exports = { wallet, notifyPaymentConfirmed };
