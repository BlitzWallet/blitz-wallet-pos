import { useNavigate } from "react-router-dom";
import { useRescanLiquidSwaps } from "../contexts/rescanSwaps";
import { useEffect } from "react";
import { useGlobalContext } from "../contexts/posContext";

export default function NavigateScreen() {
  const navigate = useNavigate();
  const { user, currentUserSession } = useGlobalContext();
  const { shouldNavigate, setShouldNavigate } = useRescanLiquidSwaps();
  console.log(user, currentUserSession, "CURRNET USER");

  useEffect(() => {
    console.log("should navigate", shouldNavigate);
    if (!shouldNavigate) return;
    setShouldNavigate(null);
    navigate(`/${user}/confirmed`);
  }, shouldNavigate);

  return null;
}
