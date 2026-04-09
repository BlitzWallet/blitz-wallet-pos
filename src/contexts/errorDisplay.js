import React, { createContext, useContext, useState } from "react";

const ErrorDisplay = createContext();

export const GlobalErrorDisplay = ({ children }) => {
  const [errorState, setErrorState] = useState(null);
  // errorState shape: { message: string, navigatePath?: string, customFunction?: fn } | null

  const showError = (message, options = {}) =>
    setErrorState({ message, ...options });

  const clearError = () => setErrorState(null);

  return (
    <ErrorDisplay.Provider value={{ errorState, showError, clearError }}>
      {children}
    </ErrorDisplay.Provider>
  );
};

export const useErrorDisplay = () => useContext(ErrorDisplay);
