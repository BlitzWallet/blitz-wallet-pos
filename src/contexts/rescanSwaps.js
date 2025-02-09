import React, { createContext, useContext, useEffect, useState } from "react";
import useWindowFocus from "../hooks/isWindowFocused";
import usePageVisibility from "../hooks/isTabFocused";
import { getRetriableClaims } from "../functions/claims";
import { claimUnclaimedSwaps } from "../functions/handleSavedClaim";

// Create Context
const RescanLiquidSwaps = createContext();

// Create Provider Component
export const GlobalRescanLiquidSwaps = ({ children }) => {
  const isWindowFocused = useWindowFocus();
  const isTabFocues = usePageVisibility();
  const [lastRun, setLastRun] = useState(0);
  const debounceTime = 20000; // 20 seconds

  useEffect(() => {
    if (!isWindowFocused || !isTabFocues) return;

    const now = Date.now();

    // If the function hasn't run before or it's been more than debounceTime since the last run, execute immediately
    if (lastRun === 0 || now - lastRun > debounceTime) {
      setLastRun(now);
      runClaimProcess();
    } else {
      // Otherwise, debounce the function
      const timeout = setTimeout(() => {
        setLastRun(Date.now());
        runClaimProcess();
      }, debounceTime);

      return () => clearTimeout(timeout);
    }
  }, [isTabFocues, isWindowFocused]);

  async function runClaimProcess() {
    const claims = getRetriableClaims(process.env.REACT_APP_ENVIRONMENT);
    console.log("RESCAN SWAPS");
    console.log(claims);

    for (let index = 0; index < claims.length; index++) {
      const element = claims[index];
      await claimUnclaimedSwaps(element);
    }

    console.log(isWindowFocused, "isWindowFocused");
    console.log(isTabFocues, "isTabFocused");
  }

  return (
    <RescanLiquidSwaps.Provider value={{}}>
      {children}
    </RescanLiquidSwaps.Provider>
  );
};

// Custom Hook to use Context
export const useRescanLiquidSwaps = () => {
  return useContext(RescanLiquidSwaps);
};
