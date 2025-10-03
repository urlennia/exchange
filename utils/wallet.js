const { ethers } = require("ethers");

// Shared provider for the whole app
const provider = new ethers.JsonRpcProvider(
  process.env.ALCHEMY_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
);

/**
 * Returns a Wallet instance safely from an environment variable.
 * Cleans whitespace, quotes, and ensures 0x prefix.
 *
 * @param {string} envVar - Name of the environment variable containing the private key
 * @returns {ethers.Wallet}
 */
function getWalletFromEnv(envVar) {
  let privateKey = process.env[envVar];
  if (!privateKey) throw new Error(`${envVar} not set in environment!`);

  // Clean the key
  privateKey = privateKey.trim().replace(/^"|"$/g, '').replace(/\s+/g, '');
  if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`${envVar} wallet address:`, wallet.address);
  return wallet;
}

module.exports = { getWalletFromEnv, provider };
