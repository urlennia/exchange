const WebSocket = require('ws');
let wss;

function initWSS(server) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'subscribe' && data.wallet) {
          ws.wallet = data.wallet.toLowerCase();
        }
      } catch {}
    });
  });
}

// Broadcast payment confirmation
function broadcastPaymentConfirmed(orderId, urdcAmount = 100) {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'paymentConfirmed', wallet: client.wallet, urdcAmount }));
    }
  });
}

module.exports = { initWSS, broadcastPaymentConfirmed };
