import { ethers } from "ethers";
import { getLocalStorageItem } from "./localStorage";
import { sparkWallet } from "./spark";

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export let ethersWalletInstance = null;

/**
 * Creates an ethers.js wallet from a mnemonic (same seed as Spark wallet)
 * This allows signing Ethereum transactions for LendaSwap operations
 *
 * @param {string} mnemonic - Optional mnemonic phrase. If not provided, will try to retrieve from Spark wallet
 * @returns {Promise<ethers.HDNodeWallet>} Ethers wallet instance
 */
export async function createEthersWallet(mnemonic = null) {
  if (ethersWalletInstance) return ethersWalletInstance;

  try {
    let walletMnemonic = mnemonic;

    // If no mnemonic provided, try to get it from Spark wallet
    if (!walletMnemonic && sparkWallet) {
      // Note: You may need to expose getMnemonic() from the Spark SDK
      // or store the mnemonic when initializing Spark wallet
      const storedMnemonic = getLocalStorageItem("wallet_mnemonic");
      if (storedMnemonic) {
        walletMnemonic = storedMnemonic;
      } else {
        throw new Error(
          "No mnemonic available. Please initialize wallet with mnemonic.",
        );
      }
    }

    if (!walletMnemonic) {
      throw new Error("Mnemonic is required to create ethers wallet");
    }

    // Create HD wallet from mnemonic
    // Using standard Ethereum derivation path m/44'/60'/0'/0/0
    ethersWalletInstance = ethers.Wallet.fromPhrase(walletMnemonic);

    console.log("Ethers wallet created successfully");
    console.log("Address:", ethersWalletInstance.address);

    return ethersWalletInstance;
  } catch (err) {
    console.error("Error creating ethers wallet:", err);
    throw err;
  }
}

export function getTokenContractName(networkName) {
  const contractAddress = {
    polygon_usdc: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    polygon_usdt: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  };
  console.log(contractAddress, networkName, contractAddress[networkName]);
  return contractAddress[networkName];
}

/**
 * Convert a human-readable token amount into base units for ethers
 *
 * @param {string | number} humanAmount - e.g. "0.902075"
 * @param {number} decimals - token decimals (e.g. 6 for USDC)
 * @returns {bigint} amount in base units (ethers / contract ready)
 */
export function toEthersAmount(humanAmount, decimals) {
  if (typeof decimals !== "number" || decimals < 0) {
    throw new Error("Invalid decimals value");
  }

  // Reject JS floats explicitly — they cause precision loss
  if (typeof humanAmount === "number") {
    throw new Error(
      "Human amount must be a string to avoid floating-point precision errors",
    );
  }

  if (typeof humanAmount !== "string") {
    throw new Error("Human amount must be a string");
  }

  // Trim and basic validation
  const value = humanAmount.trim();
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid numeric amount: "${humanAmount}"`);
  }

  // Enforce decimal precision
  const [, fraction = ""] = value.split(".");
  if (fraction.length > decimals) {
    throw new Error(
      `Too many decimal places: got ${fraction.length}, max is ${decimals}`,
    );
  }

  return ethers.parseUnits(value, decimals);
}

/**
 * Connect the ethers wallet to a provider (e.g., Polygon, Ethereum)
 * @param {string} networkName - Network name ('polygon', 'ethereum', 'sepolia')
 * @returns {Promise<ethers.Wallet>} Connected wallet
 */
export async function connectEthersWalletToProvider(networkName = "polygon") {
  if (!ethersWalletInstance) {
    throw new Error("Wallet not initialized. Call createEthersWallet() first");
  }

  const ankrApiKey = import.meta.env.VITE_ANKR_API_KEY;
  if (!ankrApiKey) {
    throw new Error("api is not set");
  }

  const providers = {
    polygon: `https://rpc.ankr.com/polygon/${ankrApiKey}`,
    ethereum: `https://rpc.ankr.com/eth/${ankrApiKey}`,
  };

  const rpcUrl = providers[networkName.toLowerCase()];
  if (!rpcUrl) {
    throw new Error(`Unsupported network: ${networkName}`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Connect the local wallet to the provider - this wallet is already a signer
  const connectedWallet = ethersWalletInstance.connect(provider);

  console.log(`Wallet connected to ${networkName}`);
  return { connectedWallet, signer: connectedWallet };
}

/**
 * Get the current ethers wallet address
 * @returns {string|null} Wallet address or null if not initialized
 */
export function getEthersWalletAddress() {
  return ethersWalletInstance?.address || null;
}

/**
 * Sign a message with the ethers wallet
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Signature
 */
export async function signMessage(message) {
  if (!ethersWalletInstance) {
    throw new Error("Wallet not initialized");
  }
  return await ethersWalletInstance.signMessage(message);
}

/**
 * Send ERC20 tokens to the HTLC contract address for a LendaSwap swap
 * @param {string} networkName - Network name ('polygon' or 'ethereum')
 * @param {string} tokenAddress - ERC20 token contract address
 * @param {string} htlcAddress - HTLC contract address to send tokens to
 * @param {string} amount - Human-readable amount (e.g. "0.859663")
 * @param {number} decimals - Token decimals (6 for USDC/USDT)
 * @returns {Promise<object>} Transaction receipt
 */
export async function sendERC20ToHtlc(
  networkName,
  tokenAddress,
  htlcAddress,
  amount,
  decimals = 6,
) {
  const { connectedWallet } = await connectEthersWalletToProvider(networkName);

  const tokenContract = new ethers.Contract(
    tokenAddress,
    ERC20_ABI,
    connectedWallet,
  );

  const amountInBaseUnits = toEthersAmount(String(amount), decimals);
  console.log(
    `Sending ${amount} tokens (${amountInBaseUnits} base units) to HTLC at ${htlcAddress}`,
  );

  const tx = await tokenContract.transfer(htlcAddress, amountInBaseUnits);
  console.log("ERC20 transfer tx sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("ERC20 transfer confirmed:", receipt.hash);

  return receipt;
}

/**
 * Estimate the gas cost of an ERC20 transfer in USD.
 * Uses the network's native token price from a simple heuristic:
 * - Polygon: ~$0.50 MATIC, gas ~30 gwei, ~65k gas limit for ERC20 transfer
 * - Ethereum: ~$2500 ETH, gas ~20 gwei, ~65k gas limit for ERC20 transfer
 * For accuracy, fetches live gas price from the provider.
 * @param {string} networkName - 'polygon' or 'ethereum'
 * @returns {Promise<{gasCostUsd: number, gasCostNative: string}>}
 */
export async function estimateGasCostUsd(networkName) {
  const { connectedWallet } = await connectEthersWalletToProvider(networkName);
  const provider = connectedWallet.provider;

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("30", "gwei");

  // ERC20 transfer typically uses ~65,000 gas
  const estimatedGas = 65000n;
  const gasCostWei = gasPrice * estimatedGas;
  const gasCostNative = ethers.formatEther(gasCostWei);

  // Approximate native token prices (conservative estimates)
  const nativeTokenPriceUsd = {
    polygon: 0.5,
    ethereum: 2500,
  };

  const priceUsd = nativeTokenPriceUsd[networkName.toLowerCase()] || 1;
  const gasCostUsd = parseFloat(gasCostNative) * priceUsd;

  console.log(
    `Gas estimate for ${networkName}: ${gasCostNative} native (~$${gasCostUsd.toFixed(
      4,
    )})`,
  );

  return { gasCostUsd, gasCostNative };
}

/**
 * Get the native token balance (MATIC/ETH) for the wallet
 * @param {string} networkName - 'polygon' or 'ethereum'
 * @returns {Promise<string>} Native balance formatted
 */
export async function getNativeBalance(networkName) {
  const { connectedWallet } = await connectEthersWalletToProvider(networkName);
  const balance = await connectedWallet.provider.getBalance(
    connectedWallet.address,
  );
  return ethers.formatEther(balance);
}

/**
 * Sign a transaction with the ethers wallet
 * @param {object} transaction - Transaction object
 * @returns {Promise<string>} Signed transaction
 */
export async function signTransaction(transaction) {
  if (!ethersWalletInstance) {
    throw new Error("Wallet not initialized");
  }
  return await ethersWalletInstance.signTransaction(transaction);
}

/**
 * Get wallet balance on a specific network
 * @param {string} networkName - Network name
 * @returns {Promise<string>} Balance in ETH/MATIC
 */
export async function getWalletBalance(networkName = "polygon", token) {
  const { connectedWallet } = await connectEthersWalletToProvider(networkName);
  console.log(connectedWallet.address);
  const contractAddress = getTokenContractName(
    `${networkName?.toLowerCase()}_${token?.toLowerCase()}`,
  );
  const usdtErc20Contract = new ethers.Contract(
    contractAddress,
    ERC20_ABI,
    connectedWallet.provider,
  );

  // magic of JS, we can now call any function defined in the ABI, and ethers.js knows what arguments to send
  const balance = await usdtErc20Contract.balanceOf(connectedWallet.address);
  const decimals = await usdtErc20Contract.decimals();
  const formattedBalance = ethers.formatUnits(balance, decimals);

  console.log(
    `balance of ${connectedWallet.address} for contract ${contractAddress} is ${formattedBalance}`,
  );

  return formattedBalance;
}

/**
 * Reset/clear the wallet instance
 */
export function clearEthersWallet() {
  ethersWalletInstance = null;
}

export default {
  createEthersWallet,
  connectEthersWalletToProvider,
  getEthersWalletAddress,
  signMessage,
  signTransaction,
  getWalletBalance,
  sendERC20ToHtlc,
  estimateGasCostUsd,
  getNativeBalance,
  clearEthersWallet,
};
