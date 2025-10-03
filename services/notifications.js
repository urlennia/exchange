// /services/notifications.js
let subscribers = {}; // wallet -> ws

function addSubscriber(wallet, ws) {
  subscribers[wallet.toLowerCase()] = ws;
  console.log(`📡 Subscribed: ${wallet}`);
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
  }
}

module.exports = { addSubscriber, removeSubscriber, notifyPaymentConfirmed };
