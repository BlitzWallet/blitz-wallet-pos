/**
 * LendaSwap Utility Functions
 * Helper functions for swap monitoring, conversions, and common operations
 */

import { lendaSwapClient } from "./lendaswap";

/**
 * Convert satoshis to Bitcoin
 * @param {number} sats - Amount in satoshis
 * @returns {string} Amount in BTC
 */
export function satsToBtc(sats) {
  return (sats / 100_000_000).toFixed(8);
}

/**
 * Convert Bitcoin to satoshis
 * @param {number} btc - Amount in BTC
 * @returns {number} Amount in satoshis
 */
export function btcToSats(btc) {
  return Math.floor(btc * 100_000_000);
}

/**
 * Convert stablecoin amount (6 decimals for USDC/USDT) to human readable
 * @param {bigint|string|number} amount - Amount in base units
 * @param {number} decimals - Token decimals (default 6 for USDC/USDT)
 * @returns {string} Human readable amount
 */
export function formatStablecoinAmount(amount, decimals = 6) {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  return `${integerPart}.${fractionalPart.toString().padStart(decimals, "0")}`;
}

/**
 * Parse human readable stablecoin amount to base units
 * @param {string|number} amount - Human readable amount
 * @param {number} decimals - Token decimals (default 6)
 * @returns {bigint} Amount in base units
 */
export function parseStablecoinAmount(amount, decimals = 6) {
  const amountStr = amount.toString();
  const [integer, fraction = ""] = amountStr.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integer + paddedFraction);
}

/**
 * Get token information by ID
 * @param {string} tokenId - Token ID (e.g., 'usdc_pol')
 * @returns {object} Token information
 */
export function getTokenInfo(tokenId) {
  const tokens = {
    btc_lightning: { name: "Bitcoin Lightning", symbol: "BTC", decimals: 8 },
    btc_arkade: { name: "Bitcoin Arkade", symbol: "BTC", decimals: 8 },
    btc_onchain: { name: "Bitcoin On-chain", symbol: "BTC", decimals: 8 },
    usdc_pol: {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      chain: "Polygon",
    },
    usdt0_pol: {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      chain: "Polygon",
    },
    usdc_eth: {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      chain: "Ethereum",
    },
    usdt_eth: {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      chain: "Ethereum",
    },
    xaut_eth: {
      name: "Tether Gold",
      symbol: "XAUt",
      decimals: 6,
      chain: "Ethereum",
    },
  };

  return tokens[tokenId] || { name: "Unknown", symbol: "?", decimals: 0 };
}

/**
 * Calculate fee percentage from quote
 * @param {object} quote - Quote object from getLendaSwapQuote
 * @param {number} sourceAmount - Original source amount
 * @returns {number} Fee percentage
 */
export function calculateFeePercentage(quote, sourceAmount) {
  if (!quote || !quote.protocolFee || !sourceAmount) return 0;
  return (Number(quote.protocolFee) / sourceAmount) * 100;
}

/**
 * Estimate time for swap completion based on type
 * @param {string} swapType - Type of swap ('lightning-to-evm', 'arkade-to-evm', etc.)
 * @returns {string} Estimated time
 */
export function estimateSwapTime(swapType) {
  const times = {
    "lightning-to-evm": "5-10 minutes",
    "arkade-to-evm": "10-20 minutes",
    "evm-to-lightning": "5-10 minutes",
    "evm-to-arkade": "10-20 minutes",
  };
  return times[swapType] || "10-15 minutes";
}

/**
 * Monitor swap status with polling
 * @param {string} swapId - Swap ID to monitor
 * @param {function} onUpdate - Callback when status changes
 * @param {number} intervalMs - Polling interval in milliseconds
 * @returns {function} Cleanup function to stop monitoring
 */
export function monitorSwapStatus(swapId, onUpdate, intervalMs = 5000) {
  let isActive = true;
  let lastStatus = null;

  const checkStatus = async () => {
    if (!isActive) return;

    try {
      // Sync latest state from server before reading local storage
      // recoverSwaps() fetches swap statuses via the wallet's xpub
      try {
        await lendaSwapClient.recoverSwaps();
      } catch (syncErr) {
        // Non-fatal — fall back to local data
        console.warn("Failed to sync swap status from server:", syncErr);
      }

      const swap = await lendaSwapClient.getSwap(swapId);
      console.log(swap, "swap status");

      if (swap.status !== lastStatus) {
        lastStatus = swap.status;
        onUpdate(swap);
      }

      if (isActive && !isSwapComplete(swap.status)) {
        setTimeout(checkStatus, intervalMs);
      }
    } catch (err) {
      console.error("Error checking swap status:", err);
      if (isActive) {
        setTimeout(checkStatus, intervalMs);
      }
    }
  };

  checkStatus();

  // Return cleanup function
  return () => {
    isActive = false;
  };
}

/**
 * Check if swap is in a complete/terminal state
 * @param {number|string} status - Swap status (numeric SwapStatus enum or string)
 * @returns {boolean} True if swap is complete
 */
export function isSwapComplete(status) {
  // Numeric SwapStatus enum values that are terminal
  const terminalNumericStatuses = [
    3, // ClientRefunded
    6, // ClientRedeemed (success)
    7, // ServerRedeemed
    8, // ClientFundedServerRefunded
    9, // ClientRefundedServerFunded
    10, // ClientRefundedServerRefunded
    11, // Expired
    14, // ClientRedeemedAndClientRefunded
  ];

  if (typeof status === "number") {
    return terminalNumericStatuses.includes(status);
  }

  // Fallback for string statuses
  const completeStringStatuses = [
    "completed",
    "claimed",
    "settled",
    "failed",
    "expired",
    "refunded",
  ];
  return completeStringStatuses.includes(status?.toLowerCase?.());
}

/**
 * Get user-friendly status message
 * @param {string} status - Swap status
 * @returns {string} User-friendly message
 */
export function getStatusMessage(status) {
  // Numeric SwapStatus enum messages
  const numericMessages = {
    0: "Waiting for payment",
    1: "Payment detected",
    2: "Payment confirmed",
    3: "Refunded",
    4: "Processing swap",
    5: "Claiming funds",
    6: "Swap completed",
    7: "Swap completed",
    8: "Refunded",
    9: "Refunded",
    10: "Refunded",
    11: "Expired",
    12: "Invalid payment",
    13: "Payment too late",
    14: "Completed & refunded",
  };

  if (typeof status === "number") {
    return numericMessages[status] || `Unknown status (${status})`;
  }

  // Fallback for string statuses
  const stringMessages = {
    created: "Swap created, waiting for payment",
    pending: "Payment received, processing swap",
    processing: "Swap in progress",
    claiming: "Claiming funds",
    completed: "Swap completed successfully",
    claimed: "Funds claimed successfully",
    settled: "Transaction settled",
    failed: "Swap failed",
    expired: "Swap expired",
    refunded: "Funds refunded",
  };
  return stringMessages[status?.toLowerCase?.()] || "Unknown status";
}

/**
 * Validate Ethereum/Polygon address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function isValidEvmAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Lightning invoice
 * @param {string} invoice - Lightning invoice to validate
 * @returns {boolean} True if valid
 */
export function isValidLightningInvoice(invoice) {
  return /^ln(bc|tb|bcrt)[0-9a-z]+$/i.test(invoice);
}

/**
 * Calculate minimum swap amount for a token
 * @param {string} tokenId - Token ID
 * @returns {number} Minimum amount in sats or base units
 */
export function getMinimumSwapAmount(tokenId) {
  // These are approximate minimums - actual minimums should be fetched from API
  const minimums = {
    btc_lightning: 1000, // 1000 sats
    btc_arkade: 10000, // 10000 sats
    btc_onchain: 50000, // 50000 sats
    usdc_pol: 1000000, // 1 USDC (6 decimals)
    usdt0_pol: 1000000, // 1 USDT
    usdc_eth: 5000000, // 5 USDC (higher due to gas)
    usdt_eth: 5000000, // 5 USDT
  };
  return minimums[tokenId] || 10000;
}

/**
 * Format swap for display
 * @param {object} swap - Swap object
 * @returns {object} Formatted swap data
 */
export function formatSwapForDisplay(swap) {
  if (!swap) return null;

  return {
    id: swap.id || swap.swapId,
    type: determineSwapType(swap),
    status: getStatusMessage(swap.status),
    fromAmount: formatAmount(swap.sourceAmount, swap.sourceToken),
    toAmount: formatAmount(swap.targetAmount, swap.targetToken),
    fromToken: getTokenInfo(swap.sourceToken),
    toToken: getTokenInfo(swap.targetToken),
    createdAt: swap.createdAt
      ? new Date(swap.createdAt).toLocaleString()
      : "N/A",
    estimatedTime: estimateSwapTime(determineSwapType(swap)),
  };
}

/**
 * Determine swap type from swap object
 * @param {object} swap - Swap object
 * @returns {string} Swap type
 */
function determineSwapType(swap) {
  const from = swap.sourceToken || "";
  const to = swap.targetToken || "";

  if (from.includes("btc") && (to.includes("usdc") || to.includes("usdt"))) {
    if (from.includes("lightning")) return "lightning-to-evm";
    if (from.includes("arkade")) return "arkade-to-evm";
    return "btc-to-evm";
  }

  if ((from.includes("usdc") || from.includes("usdt")) && to.includes("btc")) {
    if (to.includes("lightning")) return "evm-to-lightning";
    if (to.includes("arkade")) return "evm-to-arkade";
    return "evm-to-btc";
  }

  return "unknown";
}

/**
 * Format amount based on token
 * @param {any} amount - Amount to format
 * @param {string} tokenId - Token ID
 * @returns {string} Formatted amount
 */
function formatAmount(amount, tokenId) {
  if (!amount) return "0";

  const tokenInfo = getTokenInfo(tokenId);

  if (tokenId?.includes("btc")) {
    return `${satsToBtc(Number(amount))} ${tokenInfo.symbol}`;
  }

  return `${formatStablecoinAmount(amount, tokenInfo.decimals)} ${
    tokenInfo.symbol
  }`;
}

/**
 * Get block explorer URL for a transaction
 * @param {string} txHash - Transaction hash
 * @param {string} network - Network name
 * @returns {string} Block explorer URL
 */
export function getExplorerUrl(txHash, network) {
  const explorers = {
    polygon: `https://polygonscan.com/tx/${txHash}`,
    ethereum: `https://etherscan.io/tx/${txHash}`,
    bitcoin: `https://mempool.space/tx/${txHash}`,
  };
  return explorers[network.toLowerCase()] || "#";
}

export default {
  satsToBtc,
  btcToSats,
  formatStablecoinAmount,
  parseStablecoinAmount,
  getTokenInfo,
  calculateFeePercentage,
  estimateSwapTime,
  monitorSwapStatus,
  isSwapComplete,
  getStatusMessage,
  isValidEvmAddress,
  isValidLightningInvoice,
  getMinimumSwapAmount,
  formatSwapForDisplay,
  getExplorerUrl,
};
