import React, { createContext, useContext, useState } from "react";
import { getLocalStorageItem } from "../functions/localStorage";
import { ACCOUNT_LOCAL_STORAGE } from "../constants";

// Create Context
const POSContext = createContext();

// Create Provider Component
export const GlobalPOSContext = ({ children }) => {
  const [user, setUser] = useState(getLocalStorageItem(ACCOUNT_LOCAL_STORAGE)); // Example state
  const [currentUserSession, setCurrentUserSession] = useState({
    account: null,
    bitcoinPrice: 0,
  });

  return (
    <POSContext.Provider
      value={{
        user,
        setUser,
        currentUserSession,
        setCurrentUserSession,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

// Custom Hook to use Context
export const useGlobalContext = () => {
  return useContext(POSContext);
};
