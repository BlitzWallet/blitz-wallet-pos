import React, { createContext, useContext, useEffect, useState } from "react";
import useWindowFocus from "../hooks/isWindowFocused";
import usePageVisibility from "../hooks/isTabFocused";
import { getRetriableClaims } from "../functions/claims";
import { claimUnclaimedSwaps } from "../functions/handleSavedClaim";
import fetchFunction from "../functions/fetchFunction";

// Create Context
const RescanLiquidSwaps = createContext();

// Create Provider Component
export const GlobalRescanLiquidSwaps = ({ children }) => {
  const isWindowFocused = useWindowFocus();
  const isTabFocused = usePageVisibility();
  const [lastRun, setLastRun] = useState(0);
  const [shouldNavigate, setShouldNavigate] = useState(null);
  const debounceTime = 5000; // 5 seconds

  const runClaimProcess = async () => {
    console.log(isWindowFocused, "isWindowFocused");
    console.log(isTabFocused, "isTabFocused");

    const claims = getRetriableClaims(process.env.VITE_ENVIRONMENT);
    console.log("rescanning swaps....");

    let didClaim = false;

    for (let index = 0; index < claims.length; index++) {
      const element = claims[index];
      try {
        const response = await claimUnclaimedSwaps(element);
        if (!response) continue;
        await fetchFunction("/addTxActivity", element?.dbClaim, "post");
        didClaim = true;
      } catch (err) {
        console.log("claim error", err);
      }
    }

    console.log("did claim response", didClaim);
    if (!didClaim) return;

    setShouldNavigate(true);
  };

  useEffect(() => {
    if (!isWindowFocused || !isTabFocused) return;

    const now = Date.now();

    if (lastRun === 0 || now - lastRun > debounceTime) {
      setLastRun(now);
      runClaimProcess();
    } else {
      const timeout = setTimeout(() => {
        setLastRun(Date.now());
        runClaimProcess();
      }, debounceTime);
      return () => clearTimeout(timeout);
    }
  }, [isTabFocused, isWindowFocused]);

  return (
    <RescanLiquidSwaps.Provider value={{ shouldNavigate, setShouldNavigate }}>
      {children}
    </RescanLiquidSwaps.Provider>
  );
};

// Custom Hook to use Context
export const useRescanLiquidSwaps = () => {
  return useContext(RescanLiquidSwaps);
};
