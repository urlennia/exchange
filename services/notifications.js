// services/notifications.js
const subscribers = {}; // walletAddress -> ws

function addSubscriber(walletAddress, ws) {
  subscribers[walletAddress.toLowerCase()] = ws;
  console.log(`📡 Subscribed: ${walletAddress}`);
}

function removeSubscriber(ws) {
  for (const wallet in subscribers) {
    if (subscribers[wallet] === ws) {
      delete subscribers[wallet];
      console.log(`❌ Unsubscribed: ${wallet}`);
    }
  }
}

function notifyPaymentConfirmed(walletAddress, urdcAmount) {
  const ws = subscribers[walletAddress.toLowerCase()];
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "paymentConfirmed", wallet: walletAddress, urdcAmount }));
    console.log(`✅ Sent paymentConfirmed to ${walletAddress}`);
  } else {
    console.warn(`⚠️ No active WebSocket subscriber for ${walletAddress}`);
  }
}

// --- NEW: notify payment failure ---
function notifyPaymentFailed(walletAddress, reason = "Unknown error") {
  const ws = subscribers[walletAddress.toLowerCase()];
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "failedPayment", wallet: walletAddress, reason }));
    console.log(`❌ Sent failedPayment to ${walletAddress}: ${reason}`);
  } else {
    console.warn(`⚠️ No active WebSocket subscriber for ${walletAddress}`);
  }
}

module.exports = { addSubscriber, removeSubscriber, notifyPaymentConfirmed, notifyPaymentFailed };
