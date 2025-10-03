require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { WebSocketServer } = require("ws");
const { getWalletFromEnv } = require("./utils/wallet");
const { addSubscriber, removeSubscriber } = require("./services/notifications");

// ---------- App Setup ----------
const app = express();
app.use(bodyParser.json());

// ---------- Wallet ----------
const treasuryWallet = getWalletFromEnv("TREASURY_PRIVATE_KEY");
console.log("TREASURY_PRIVATE_KEY wallet address:", treasuryWallet.address);

const payoutWallet = getWalletFromEnv("WALLET_PRIVATE_KEY");
console.log("WALLET_PRIVATE_KEY wallet address:", payoutWallet.address);

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

  ws.on("close", () => removeSubscriber(ws));
});
