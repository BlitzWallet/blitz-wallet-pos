import React, { createContext, useContext, useState, useCallback } from "react";
import {
  initializeLendaSwapClient,
  getLendaSwapQuote,
  createLightningToStablecoinSwap,
  claimSwapViaGelato,
  getSwapDetails,
  listAllSwaps,
  getLendaSwapAssetPairs,
  recoverPendingSwaps,
} from "../functions/lendaswap";
import {
  createEthersWallet,
  getEthersWalletAddress,
} from "../functions/ethersWallet";
import { monitorSwapStatus } from "../functions/lendaswapUtils";

// Create Context
const LendaSwapContext = createContext();

// Create Provider Component
export const GlobalLendaSwapContext = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [ethersAddress, setEthersAddress] = useState(null);
  const [activeSwaps, setActiveSwaps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize LendaSwap with mnemonic
   */
  const initializeLendaSwap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize LendaSwap client
      const { mnemoinc } = await initializeLendaSwapClient();

      // Initialize ethers wallet
      await createEthersWallet(mnemoinc);
      const address = getEthersWalletAddress();
      setEthersAddress(address);

      // Get existing swaps
      const swaps = await listAllSwaps();
      setActiveSwaps(swaps);

      // Recover any incomplete swaps from previous sessions
      try {
        const recovery = await recoverPendingSwaps();
        console.log("[Init] Swap recovery results:", recovery);

        // Monitor swaps that are funded but waiting for server
        for (const pendingId of recovery.pending) {
          monitorSwapStatus(pendingId, async (swap) => {
            console.log(
              `[Init] Pending swap ${pendingId} status update:`,
              swap.status,
            );
            // If server has funded, try to claim
            if (swap.status === 4 || swap.status === 5) {
              try {
                await claimSwapViaGelato(pendingId);
                console.log(
                  `[Init] Successfully claimed recovered swap ${pendingId}`,
                );
              } catch (claimErr) {
                console.error(
                  `[Init] Failed to claim recovered swap ${pendingId}:`,
                  claimErr,
                );
              }
            }
            // Refresh swap list after any status change
            const updatedSwaps = await listAllSwaps();
            setActiveSwaps(updatedSwaps);
          });
        }
      } catch (recoveryErr) {
        console.error("[Init] Swap recovery failed:", recoveryErr);
        // Non-fatal — continue initialization
      }

      setIsInitialized(true);
      console.log("LendaSwap initialized successfully");
      return true;
    } catch (err) {
      console.error("Error initializing LendaSwap:", err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  /**
   * Get a quote for a swap
   */
  const getQuote = useCallback(async (fromAsset, toAsset, amount) => {
    try {
      setIsLoading(true);
      setError(null);
      const quote = await getLendaSwapQuote(fromAsset, toAsset, amount);
      return quote;
    } catch (err) {
      console.error("Error getting quote:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a Lightning to stablecoin swap
   */
  const createLightningSwap = useCallback(
    async (
      sourceAmountSats,
      targetToken = "usdc_pol",
      targetNetwork = "polygon",
    ) => {
      if (!ethersAddress) {
        throw new Error("Wallet not initialized");
      }

      try {
        setIsLoading(true);
        setError(null);

        const swapDetails = await createLightningToStablecoinSwap(
          ethersAddress,
          sourceAmountSats,
          targetToken,
          targetNetwork,
        );

        // Add to active swaps
        setActiveSwaps((prev) => [...prev, swapDetails]);

        return swapDetails;
      } catch (err) {
        console.error("Error creating Lightning swap:", err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [ethersAddress],
  );

  /**
   * Claim a swap (gasless via Gelato)
   */
  const claimSwap = useCallback(async (swapId) => {
    try {
      setIsLoading(true);
      setError(null);

      await claimSwapViaGelato(swapId);

      // Update swap status
      const updatedSwap = await getSwapDetails(swapId);
      setActiveSwaps((prev) =>
        prev.map((swap) => (swap.swapId === swapId ? updatedSwap : swap)),
      );

      return true;
    } catch (err) {
      console.error("Error claiming swap:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh active swaps
   */
  const refreshSwaps = useCallback(async () => {
    try {
      const swaps = await listAllSwaps();
      setActiveSwaps(swaps);
      return swaps;
    } catch (err) {
      console.error("Error refreshing swaps:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  return (
    <LendaSwapContext.Provider
      value={{
        isInitialized,
        ethersAddress,
        activeSwaps,
        isLoading,
        error,
        initializeLendaSwap,
        getQuote,
        createLightningSwap,
        claimSwap,
        refreshSwaps,
      }}
    >
      {children}
    </LendaSwapContext.Provider>
  );
};

// Custom Hook to use Context
export const useLendaSwap = () => {
  return useContext(LendaSwapContext);
};
