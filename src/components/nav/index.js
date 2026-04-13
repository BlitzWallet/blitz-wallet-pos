import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";
import { useGlobalContext } from "../../contexts/posContext";
import { ArrowLeft, History, Pi, UserRound } from "lucide-react";

export default function PosNavbar({
  backFunction,
  openNamePopupFunction,
  fromPage = "",
  setShowSwapHistory,
  PillToggle,
}) {
  const { serverName } = useGlobalContext();
  const User = getCurrentUser();

  return (
    <div className="POS-navbar">
      <div style={{ paddingLeft: 10 }} className="nav-left">
        <button
          className="nav-pill-btn"
          onClick={backFunction}
          aria-label="Go back"
        >
          <ArrowLeft size={20} color="#0375f6" />
        </button>
      </div>

      <div className="nav-center">
        <h2 className="POS-name">{User}</h2>
      </div>

      <div style={{ paddingRight: PillToggle ? 0 : 10 }} className="nav-right">
        {fromPage === "home" && (
          <>
            <button
              className="nav-pill-btn"
              onClick={() => setShowSwapHistory(true)}
              aria-label="Stablecoin history"
            >
              <History size={20} color="#0375f6" />
            </button>

            <button
              className="nav-pill-btn"
              onClick={() => openNamePopupFunction?.()}
              aria-label="Profile settings"
            >
              <UserRound size={20} color="#0375f6" />
            </button>
          </>
        )}
        {PillToggle && PillToggle}
      </div>
    </div>
  );
}
