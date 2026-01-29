import React, { createContext, useEffect, useRef } from "react";
import { useLendaSwap } from "./lendaswapContext";
import { createSparkWallet } from "../functions/spark";

// Create Context
const WalletInitializationProvider = createContext();

// Create Provider Component
export const HandleWalletInitializationProvider = ({ children }) => {
  const { initializeLendaSwap } = useLendaSwap();
  const didInitialize = useRef(null);
  useEffect(() => {
    async function initializeWallets() {
      try {
        const { walletMnemonic } = await createSparkWallet();
        initializeLendaSwap(walletMnemonic);
      } catch (err) {
        console.log("Error intializing wallets", err);
      }
    }
    if (didInitialize.current) return;
    initializeWallets();
    didInitialize.current = true;
  }, []);
  return (
    <WalletInitializationProvider.Provider value={{}}>
      {children}
    </WalletInitializationProvider.Provider>
  );
};
