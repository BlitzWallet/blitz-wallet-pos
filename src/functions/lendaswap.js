import { Client } from "@lendasat/lendaswap-sdk";
import { createEthersWallet, getEthersWalletAddress } from "./ethersWallet";

export let lendaSwapClient = null;

/**
 * Initialize the LendaSwap client
 * @param {string} mnemonic - Optional mnemonic for wallet initialization
 * @returns {Promise<Client>} Initialized LendaSwap client
 */
export async function initializeLendaSwapClient() {
  if (lendaSwapClient) return lendaSwapClient;

  try {
    // Create LendaSwap client using builder pattern
    lendaSwapClient = await Client.builder()
      .url("https://apilendaswap.lendasat.com")
      .withIdbStorage() // Uses IndexedDB for browser storage
      .network("bitcoin") // Bitcoin mainnet
      .arkadeUrl("https://arkade.computer")
      .esploraUrl("https://mempool.space/api")
      .build();

    // Initialize wallet - generates or loads mnemonic
    await lendaSwapClient.init();
    const wallet_mnemonic = await lendaSwapClient?.getMnemonic();

    console.log("LendaSwap client initialized successfully");

    return { lendaSwapClient, mnemoinc: wallet_mnemonic };
  } catch (err) {
    console.error("Error initializing LendaSwap client:", err);
    throw err;
  }
}

/**
 * Get available asset pairs from LendaSwap
 * @returns {Promise<Array>} List of available trading pairs
 */
export async function getLendaSwapAssetPairs() {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    const pairs = await lendaSwapClient.getAssetPairs();
    console.log("Available pairs:", pairs);
    return pairs;
  } catch (err) {
    console.error("Error getting asset pairs:", err);
    throw err;
  }
}

/**
 * Get a quote for swapping between assets
 * @param {string} fromAsset - Source asset (e.g., 'btc_lightning', 'btc_arkade')
 * @param {string} toAsset - Target asset (e.g., 'usdc_pol', 'usdt_eth')
 * @param {bigint} amount - Amount in source asset base units
 * @returns {Promise<object>} Quote with exchange rate and fees
 */
export async function getLendaSwapQuote(fromAsset, toAsset, amount) {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    const quote = await lendaSwapClient.getQuote(
      fromAsset,
      toAsset,
      BigInt(amount),
    );
    console.log("Quote received:", quote);
    return {
      exchangeRate: quote.exchange_rate,
      minAmount: quote.min_amount,
      protocolFee: quote.protocol_fee,
      quote,
    };
  } catch (err) {
    console.error("Error getting quote:", err);
    throw err;
  }
}

/**
 * Create a Lightning to EVM (Polygon/Ethereum) swap
 * @param {string} targetAddress - Ethereum/Polygon address to receive stablecoins
 * @param {number} sourceAmountSats - Amount in satoshis
 * @param {string} targetToken - Target token (e.g., 'usdc_pol', 'usdt_eth')
 * @param {string} targetNetwork - Target network ('polygon' or 'ethereum')
 * @returns {Promise<object>} Swap details including Lightning invoice
 */
export async function createLightningToStablecoinSwap(
  targetAddress,
  sourceAmountSats,
  targetToken = "usdc_pol",
  targetNetwork = "polygon",
) {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    const swap = await lendaSwapClient.createLightningToEvmSwap(
      {
        target_address: targetAddress,
        source_amount: BigInt(sourceAmountSats),
        target_token: targetToken,
      },
      targetNetwork,
    );

    console.log("Lightning to stablecoin swap created:", swap.id);
    console.log("Lightning invoice:", swap.lnInvoice);
    console.log("You will receive:", swap.assetAmount, targetToken);

    return {
      swapId: swap.id,
      lightningInvoice: swap.lnInvoice,
      assetAmount: swap.assetAmount,
      targetAddress,
      targetToken,
      swap,
    };
  } catch (err) {
    console.error("Error creating Lightning to stablecoin swap:", err);
    throw err;
  }
}

/**
 * Create an EVM (stablecoin) to Lightning swap
 * @param {string} bolt11Invoice - Lightning invoice to pay
 * @param {string} userAddress - User's Ethereum/Polygon address
 * @param {string} sourceToken - Source token (e.g., 'usdc_eth', 'usdt_pol')
 * @param {string} sourceNetwork - Source network ('polygon' or 'ethereum')
 * @returns {Promise<object>} Swap details including contract address to send funds to
 */
export async function createStablecoinToLightningSwap({
  bolt11Invoice,
  userAddress,
  sourceToken = "usdc_eth",
  sourceNetwork = "ethereum",
}) {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    console.log({
      bolt11_invoice: bolt11Invoice,
      user_address: userAddress,
      source_token: sourceToken?.toLowerCase(),
      sourceNetwork,
    });
    const swap = await lendaSwapClient.createEvmToLightningSwap(
      {
        bolt11_invoice: bolt11Invoice,
        user_address: userAddress,
        source_token: sourceToken?.toLowerCase(),
      },
      sourceNetwork,
    );

    console.log("stablecoin swap", swap);
    console.log("Stablecoin to Lightning swap created:", swap.id);
    console.log("Contract address:", swap.contractAddress);
    console.log("HTLC address:", swap.htlc_address_evm);
    console.log("Source token address:", swap.source_token_address);
    console.log("Amount to send:", swap.source_amount);

    return {
      swapId: swap.id,
      htlc_address_evm: swap.htlc_address_evm,
      source_token_address: swap.source_token_address,
      sourceAmount: swap.source_amount,
      satsReceive: swap.sats_receive,
      hash_lock: swap.hash_lock,
      refund_locktime: swap.refund_locktime,
      swap,
    };
  } catch (err) {
    console.error("Error creating stablecoin to Lightning swap:", err);
    throw err;
  }
}

/**
 * Claim a swap via Gelato (gasless claim)
 * @param {string} swapId - Swap ID to claim
 * @returns {Promise<boolean>} Success status
 */
export async function claimSwapViaGelato(swapId) {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    await lendaSwapClient.claimGelato(swapId);
    console.log("Swap claimed via Gelato relay!");
    return true;
  } catch (err) {
    console.error("Error claiming swap via Gelato:", err);
    throw err;
  }
}

/**
 * Get swap status and details
 * @param {string} swapId - Swap ID
 * @returns {Promise<object>} Swap details
 */
export async function getSwapDetails(swapId) {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    const swap = await lendaSwapClient.getSwap(swapId);
    return swap;
  } catch (err) {
    console.error("Error getting swap details:", err);
    throw err;
  }
}

/**
 * List all swaps for the current wallet
 * @returns {Promise<Array>} List of swaps
 */
export async function listAllSwaps() {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    const swaps = await lendaSwapClient.listAllSwaps();
    return swaps;
  } catch (err) {
    console.error("Error listing swaps:", err);
    throw err;
  }
}

/**
 * Recover pending swaps on initialization.
 * Checks all stored swaps and attempts to claim any that are in a claimable state,
 * or logs swaps that are still waiting for customer funding.
 *
 * SwapStatus reference:
 *   0 = Pending (created, waiting for customer to fund)
 *   1 = ClientFundingSeen (funding tx seen in mempool)
 *   2 = ClientFunded (funding confirmed on-chain)
 *   3 = ClientRefunded (customer got refund — terminal)
 *   4 = ServerFunded (server funded their side — claimable)
 *   5 = ClientRedeeming (claim in progress)
 *   6 = ClientRedeemed (claimed — terminal success)
 *   7 = ServerRedeemed (server claimed — terminal)
 *   8+ = Various terminal/error states
 *  11 = Expired
 *
 * @returns {Promise<{claimed: string[], pending: string[], failed: string[]}>}
 */
export async function recoverPendingSwaps() {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  const results = { claimed: [], pending: [], failed: [], skipped: [] };

  try {
    // First, sync swap state from the server using xpub recovery
    // This updates local IndexedDB with the latest server-side statuses
    console.log("[Recovery] Syncing swaps from server via recoverSwaps()...");
    try {
      const recoveredSwaps = await lendaSwapClient.recoverSwaps();
      console.log(`[Recovery] Server returned ${recoveredSwaps.length} swaps`);
    } catch (syncErr) {
      console.warn(
        "[Recovery] recoverSwaps() failed, using local data:",
        syncErr,
      );
    }

    // Now list all swaps — should have updated statuses from server
    const swaps = await lendaSwapClient.listAllSwaps();
    console.log(`[Recovery] Found ${swaps.length} stored swaps`);

    for (const { response: swap } of swaps) {
      const id = swap.id;
      const status = swap.status;

      console.log(`[Recovery] Swap ${id}: status=${status}`);

      // Terminal states — nothing to do
      if (
        status === 3 || // ClientRefunded
        status === 6 || // ClientRedeemed
        status === 7 || // ServerRedeemed
        status === 8 || // ClientFundedServerRefunded
        status === 9 || // ClientRefundedServerFunded
        status === 10 || // ClientRefundedServerRefunded
        status === 11 || // Expired
        status === 14 // ClientRedeemedAndClientRefunded
      ) {
        results.skipped.push(id);
        continue;
      }

      // Claimable states — server has funded, we can claim
      if (
        status === 4 || // ServerFunded
        status === 5 // ClientRedeeming (retry claim)
      ) {
        try {
          console.log(`[Recovery] Attempting to claim swap ${id} via Gelato`);
          await lendaSwapClient.claimGelato(id);
          console.log(`[Recovery] Successfully claimed swap ${id}`);
          results.claimed.push(id);
        } catch (err) {
          console.error(`[Recovery] Failed to claim swap ${id}:`, err);
          results.failed.push(id);
        }
        continue;
      }

      // Funded but server hasn't funded yet — monitor it
      if (
        status === 1 || // ClientFundingSeen
        status === 2 // ClientFunded
      ) {
        console.log(
          `[Recovery] Swap ${id} is funded, waiting for server. Will monitor.`,
        );
        results.pending.push(id);
        continue;
      }

      // Pending (0) — swap created but not funded
      // Could be an abandoned swap; check if it's expired by time
      if (status === 0) {
        console.log(
          `[Recovery] Swap ${id} is pending (unfunded). Skipping — customer never sent funds.`,
        );
        results.skipped.push(id);
        continue;
      }

      // Invalid funding states
      if (
        status === 12 || // ClientInvalidFunded
        status === 13 // ClientFundedTooLate
      ) {
        console.warn(
          `[Recovery] Swap ${id} has invalid funding (status=${status}). May need manual refund.`,
        );
        results.failed.push(id);
        continue;
      }

      // Unknown status
      console.warn(`[Recovery] Swap ${id} has unknown status: ${status}`);
      results.skipped.push(id);
    }

    console.log("[Recovery] Results:", results);
    return results;
  } catch (err) {
    console.error("[Recovery] Error recovering swaps:", err);
    throw err;
  }
}

/**
 * Get available tokens for swapping
 * @returns {Promise<Array>} List of available tokens
 */
export async function getAvailableTokens() {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    const tokens = await lendaSwapClient.getTokens();
    return tokens;
  } catch (err) {
    console.error("Error getting tokens:", err);
    throw err;
  }
}

/**
 * Clear/reset the LendaSwap client
 */
export function clearLendaSwapClient() {
  lendaSwapClient = null;
}

export const fiatToStablecoinUnits = (fiatAmount) => {
  return Math.round(fiatAmount * 100);
};

/**
 * Calculate the total stablecoin amount the customer needs to send,
 * including swap protocol fees and gas costs.
 *
 * @param {number} baseAmountSats - The order amount in satoshis
 * @param {string} sourceToken - LendaSwap token ID (e.g., 'usdc_pol', 'usdt_eth')
 * @param {number} gasCostUsd - Estimated gas cost in USD
 * @returns {Promise<{totalStablecoinAmount: number, breakdown: object}>}
 */
export async function calculateTotalWithFees(
  baseAmountSats,
  sourceToken,
  gasCostUsd,
) {
  if (!lendaSwapClient) {
    throw new Error("LendaSwap client not initialized");
  }

  try {
    // Get a quote from the source token to btc_lightning
    const quote = await lendaSwapClient.getQuote(
      sourceToken,
      "btc_lightning",
      BigInt(baseAmountSats),
    );

    const exchangeRate = parseFloat(quote.exchangeRate);
    const protocolFee = Number(quote.protocolFee);
    const networkFee = Number(quote.networkFee);

    // The source_amount returned by createEvmToLightningSwap already includes
    // the protocol fee. But we need to add the gas cost on top so the customer
    // covers that too. Gas cost is in USD which maps ~1:1 to stablecoin.
    //
    // base stablecoin = sats / exchange_rate (sats per 1 stablecoin unit)
    // The swap's source_amount already accounts for protocol + network fees.
    // We just add the gas cost on top of whatever the swap asks for.

    console.log("Fee calculation quote:", {
      exchangeRate,
      protocolFee,
      networkFee,
      gasCostUsd,
    });

    return {
      gasCostStablecoin: gasCostUsd, // stablecoins are ~1:1 with USD
      protocolFeeSats: protocolFee,
      networkFeeSats: networkFee,
      exchangeRate,
    };
  } catch (err) {
    console.error("Error calculating fees:", err);
    throw err;
  }
}

export default {
  initializeLendaSwapClient,
  getLendaSwapAssetPairs,
  getLendaSwapQuote,
  createLightningToStablecoinSwap,
  createStablecoinToLightningSwap,
  claimSwapViaGelato,
  getSwapDetails,
  listAllSwaps,
  recoverPendingSwaps,
  getAvailableTokens,
  clearLendaSwapClient,
  fiatToStablecoinUnits,
  calculateTotalWithFees,
};
