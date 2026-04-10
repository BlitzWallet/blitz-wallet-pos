import React, { createContext, useContext, useState } from "react";

const CopyToast = createContext();

export const GlobalCopyToast = ({ children }) => {
  const [toastContent, setToastContent] = useState(null);
  const showCopyToast = (content) => setToastContent(content);
  const clearCopyToast = () => setToastContent(null);
  return (
    <CopyToast.Provider value={{ toastContent, showCopyToast, clearCopyToast }}>
      {children}
    </CopyToast.Provider>
  );
};

export const useCopyToast = () => useContext(CopyToast);
