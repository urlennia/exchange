// utils/wallet.js
const { ethers } = require("ethers");

/**
 * Returns a Wallet instance safely from an environment variable.
 * Cleans whitespace, quotes, and ensures 0x prefix.
 *
 * @param {string} envVar - Name of the environment variable containing the private key
 * @param {ethers.Provider} [provider] - Optional provider for the wallet
 * @returns {ethers.Wallet}
 */
function getWalletFromEnv(envVar, provider) {
  let privateKey = process.env[envVar];
  if (!privateKey) throw new Error(`${envVar} not set in environment!`);

  // Clean the key
  privateKey = privateKey.trim().replace(/^"|"$/g, '').replace(/\s+/g, '');
  if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;

  const wallet = provider ? new ethers.Wallet(privateKey, provider) : new ethers.Wallet(privateKey);
  console.log(`${envVar} wallet address:`, wallet.address);
  return wallet;
}

module.exports = { getWalletFromEnv };
