import React, { createContext, useContext, useState } from "react";
import { getLocalStorageItem } from "../functions/localStorage";
import { ACCOUNT_LOCAL_STORAGE, SERVER_LOCAL_STORAGE } from "../constants";

// Create Context
const POSContext = createContext();

// Create Provider Component
export const GlobalPOSContext = ({ children }) => {
  const [user, setUser] = useState(getLocalStorageItem(ACCOUNT_LOCAL_STORAGE)); // Example state
  const [serverName, setServerName] = useState(
    getLocalStorageItem(SERVER_LOCAL_STORAGE)
  ); // Example state
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
        serverName,
        setServerName,
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
