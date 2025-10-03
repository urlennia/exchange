const { ethers } = require("ethers");
require("dotenv").config();

const URDC_ABI = ["function transfer(address to, uint256 amount) public returns (bool)"];
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
const urdcContract = new ethers.Contract(process.env.URDC_ADDRESS, URDC_ABI, wallet);

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

