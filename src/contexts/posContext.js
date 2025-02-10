import React, { createContext, useContext, useState } from "react";
import { getAccount } from "../functions/localStorage";

// Create Context
const POSContext = createContext();

// Create Provider Component
export const GlobalPOSContext = ({ children }) => {
  const [user, setUser] = useState(getAccount()); // Example state
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
