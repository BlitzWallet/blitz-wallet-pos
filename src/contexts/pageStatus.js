import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const PageStatus = createContext();

export const GlobalPageStatus = ({ children }) => {
  const [isFocused, setIsFocused] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const focusTimerRef = useRef(null);
  const tabTimerRef = useRef(null);

  useEffect(() => {
    const onFocus = () => {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => setIsFocused(true), 250);
    };
    const onBlur = () => {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => setIsFocused(false), 250);
    };
    const documentChange = () => {
      clearTimeout(tabTimerRef.current);
      tabTimerRef.current = setTimeout(() => {
        setIsTabActive(document.visibilityState === "hidden");
        setIsVisible(!document.hidden);
      }, 250);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", documentChange);

    return () => {
      clearTimeout(focusTimerRef.current);
      clearTimeout(tabTimerRef.current);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", documentChange);
    };
  }, []);

  return (
    <PageStatus.Provider value={{ isFocused, isTabActive, isVisible }}>
      {children}
    </PageStatus.Provider>
  );
};

export const usePageStatus = () => useContext(PageStatus);
