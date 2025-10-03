// services/blockchain.js
const { ethers } = require("ethers");
const pool = require("../db");
const { notifyPaymentConfirmed } = require("./notifications");

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Load treasury wallet for sending URDC
const { getWalletFromEnv } = require("../utils/wallet");
const wallet = getWalletFromEnv("TREASURY_PRIVATE_KEY", provider);

const USDC_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const URDC_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const usdcContract = new ethers.Contract(process.env.USDC_ADDRESS, USDC_ABI, provider);
const urdcContract = new ethers.Contract(process.env.URDC_ADDRESS, URDC_ABI, wallet);

const USDC_DECIMALS = Number(process.env.USDC_DECIMALS || 6);
const URDC_DECIMALS = Number(process.env.URDC_DECIMALS || 18);
const TREASURY = process.env.STATIC_RECEIVE_ADDRESS || wallet.address;

async function listenForUSDCPayments() {
  console.log("👂 Listening for USDC transfers...");

  usdcContract.on("Transfer", async (from, to, value) => {
    try {
      if (to.toLowerCase() !== TREASURY.toLowerCase()) return;

      const amount = parseFloat(ethers.formatUnits(value, USDC_DECIMALS));
      console.log(`💰 Received ${amount} USDC from ${from}`);

      // Fetch pending order
      const [rows] = await pool.query(
        "SELECT * FROM orders WHERE sender_wallet = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 1",
        [from.toLowerCase()]
      );

      if (!rows.length) return;
      const order = rows[0];

      // Compute URDC amount
      const rate = order.urdc_rate || 1.05;
      const urdcAmount = amount * rate;

      // Send URDC
      const urdcUnits = ethers.parseUnits(urdcAmount.toFixed(12), URDC_DECIMALS);
      const tx = await urdcContract.transfer(order.sender_wallet, urdcUnits);
      console.log(`🚀 Sending ${urdcAmount} URDC to ${order.sender_wallet}, tx: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);
      if (receipt.status !== 1) {
        console.error("URDC transfer failed for order", order.id);
        await pool.query("UPDATE orders SET status = ?, error = ? WHERE id = ?", [
          "failed",
          "URDC transfer failed",
          order.id,
        ]);
        return;
      }

      // Update DB
      await pool.query(
        "UPDATE orders SET status = ?, confirmed_usdc = ?, urdc_amount = ?, urdc_tx_hash = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?",
        ["completed", amount, urdcAmount, tx.hash, order.id]
      );

      // Notify frontend
      notifyPaymentConfirmed(order.sender_wallet, urdcAmount);
      console.log(`✅ Order ${order.id} completed`);
    } catch (err) {
      console.error("Listener error:", err);
    }
  });
}

module.exports = { listenForUSDCPayments };
