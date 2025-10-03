// server.js

console.log("TREASURY_PRIVATE_KEY length:", process.env.TREASURY_PRIVATE_KEY?.length);
console.log("TREASURY_PRIVATE_KEY raw:", process.env.TREASURY_PRIVATE_KEY);

const express = require("express");
const bodyParser = require("body-parser");
const { ethers } = require("ethers"); 
const { WebSocketServer } = require("ws");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const { Wallet } = require("ethers");

// Get the key from environment
let privateKey = process.env.TREASURY_PRIVATE_KEY;

// Trim whitespace / remove accidental quotes
privateKey = privateKey.trim().replace(/^"|"$/g, '');

// Add 0x if missing
if (!privateKey.startsWith("0x")) {
  privateKey = "0x" + privateKey;
}

// Create the wallet
const wallet = new Wallet(privateKey);
console.log("Wallet address:", wallet.address);

module.exports = {
  wallet,
  notifyPaymentConfirmed
};



// ---------- Routes ----------
app.use("/api/payments", require("./routes/payments"));
app.use("/api/pending-orders", require("./routes/pendingOrders"));
app.use("/api/orders", require("./routes/orders"));

// ---------- Blockchain Listener ----------
const { listenForUSDCPayments } = require("./services/blockchain");

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  listenForUSDCPayments(); // Start blockchain listener
});

// ---------- WebSocket Setup ----------
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
      if (subscribers[wallet] === ws) {
        delete subscribers[wallet];
        console.log(`❌ Unsubscribed: ${wallet}`);
      }
    }
  });
});

// ---------- Helper to notify frontend ----------
function notifyPaymentConfirmed(wallet, urdcAmount) {
  const ws = subscribers[wallet.toLowerCase()];
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        type: "paymentConfirmed",
        wallet,
        urdcAmount,
      })
    );
    console.log(`✅ Sent paymentConfirmed to ${wallet}`);
  }
}



