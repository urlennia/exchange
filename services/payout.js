const { ethers } = require("ethers");
const { getWalletFromEnv } = require("../utils/wallet");

const URDC_ABI = ["function transfer(address to, uint256 amount) public returns (bool)"];
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Always use helper
const payoutWallet = getWalletFromEnv("WALLET_PRIVATE_KEY", provider);

// Contract
const urdcContract = new ethers.Contract(process.env.URDC_ADDRESS, URDC_ABI, payoutWallet);

async function sendURDC(to, amount) {
  try {
    const value = ethers.parseUnits(amount.toString(), 18);
    const tx = await urdcContract.transfer(to, value);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    console.error("URDC payout failed:", err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendURDC };
