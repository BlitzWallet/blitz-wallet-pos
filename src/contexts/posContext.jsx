import React, { createContext, useCallback, useContext, useState } from "react";
import {
  getLocalStorageItem,
  saveToLocalStorage,
} from "../functions/localStorage";
import {
  ACCOUNT_LOCAL_STORAGE,
  POS_SETTINGS_LOCAL_STORAGE,
  SERVER_LOCAL_STORAGE,
} from "../constants";

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
    bitcoinPrice: null,
  });

  const [didConfirmSavedUsername, setDidConfirmSavedUsername] = useState(false);

  const [currentSettings, setCurrentSettings] = useState(
    JSON.parse(getLocalStorageItem(POS_SETTINGS_LOCAL_STORAGE)) || {
      displayCurrency: {
        isSats: false,
        isWord: false,
      },
    }
  );

  const toggleSettings = useCallback((newSettings) => {
    setCurrentSettings((prev) => {
      const settingsUpdate = { ...prev, ...newSettings };
      saveToLocalStorage(
        JSON.stringify(settingsUpdate),
        POS_SETTINGS_LOCAL_STORAGE
      );
      return settingsUpdate;
    });
  }, []);

  const dollarSatValue = 100_000_000 / (currentUserSession?.bitcoinPrice || 1);

  return (
    <POSContext.Provider
      value={{
        user,
        setUser,
        currentUserSession,
        setCurrentUserSession,
        serverName,
        setServerName,
        currentSettings,
        toggleSettings,
        dollarSatValue,
        didConfirmSavedUsername,
        setDidConfirmSavedUsername,
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
