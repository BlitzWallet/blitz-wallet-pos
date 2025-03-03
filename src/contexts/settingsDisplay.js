import React, { createContext, useContext, useEffect, useState } from "react";

// Create Context
const SettingsDisplay = createContext();

// Create Provider Component
export const GlobalSettingsDisplay = ({ children }) => {
  const [displaySettings, setDisplaySettings] = useState(false);

  return (
    <SettingsDisplay.Provider value={{ displaySettings, setDisplaySettings }}>
      {children}
    </SettingsDisplay.Provider>
  );
};

// Custom Hook to use Context
export const useSettingsDisplay = () => {
  return useContext(SettingsDisplay);
};
