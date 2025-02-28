import { useNavigate } from "react-router-dom";
import { useRescanLiquidSwaps } from "../contexts/rescanSwaps";
import { useEffect } from "react";
import { useGlobalContext } from "../contexts/posContext";

export default function NavigateScreen() {
  const navigate = useNavigate();
  const { user } = useGlobalContext();
  const { shouldNavigate, setShouldNavigate } = useRescanLiquidSwaps();

  useEffect(() => {
    console.log("should navigate", shouldNavigate);
    if (!shouldNavigate) return;
    setShouldNavigate(null);
    navigate(`/${user}/confirmed`);
  }, [shouldNavigate]);

  return null;
}
