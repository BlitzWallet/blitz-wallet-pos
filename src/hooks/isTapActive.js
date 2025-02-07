import { useCallback, useEffect, useState } from "react";

const useIsTabActive = () => {
  const [isTabActive, setIsTabActive] = useState(true);

  const handleVisibilityChange = useCallback(() => {
    setIsTabActive(document.visibilityState === "hidden");
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  return isTabActive;
};

export default useIsTabActive;
