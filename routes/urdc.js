const express = require("express");
const { ethers } = require("ethers");
const { getWalletFromEnv } = require("../utils/wallet");

const router = express.Router();

// --- URDC Config ---
const URDC_ADDRESS = "0x8a5183837ff197ee16B034367a9f2A081DFf4f79";
const URDC_DECIMALS = 18;
const ERC20_ABI = ["function transfer(address to, uint256 value) public returns (bool)"];

// --- Wallet ---
const treasuryWallet = getWalletFromEnv("TREASURY_PRIVATE_KEY");
const urdcContract = new ethers.Contract(URDC_ADDRESS, ERC20_ABI, treasuryWallet);

// --- Send URDC to buyer ---
router.post("/send-urdc", async (req, res) => {
  try {
    const { buyerWallet, urdcAmount, orderId } = req.body;

    if (!buyerWallet || !urdcAmount) {
      return res.json({ success: false, error: "Missing buyerWallet or urdcAmount" });
    }

    const amountInUnits = ethers.parseUnits(String(urdcAmount), URDC_DECIMALS);
    const tx = await urdcContract.transfer(buyerWallet, amountInUnits);
    await tx.wait();

    console.log(`✅ Sent ${urdcAmount} URDC to ${buyerWallet} for order ${orderId}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("❌ URDC send error:", err);
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
