import { useSettingsDisplay } from "../../contexts/settingsDisplay";
import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";
import { useGlobalContext } from "../../contexts/posContext";
import { ArrowLeft, History, UserRound } from "lucide-react";

export default function PosNavbar({
  backFunction,
  openNamePopupFunction,
  fromPage = "",
  setShowSwapHistory,
}) {
  const { serverName } = useGlobalContext();
  const User = getCurrentUser();
  const { setDisplaySettings } = useSettingsDisplay();

  return (
    <div className="POS-navbar">
      <ArrowLeft
        color="#0375f6"
        alt="Back arrow"
        onClick={backFunction}
        className="POS-back"
      />
      <h2 className="POS-name">{User}</h2>

      {fromPage === "home" && (
        <History
          className="POS-SwapHistoryBtn"
          onClick={() => setShowSwapHistory(true)}
          color="#0375f6"
        />
      )}
      <div
        className="nav-profile-badge"
        onClick={() => openNamePopupFunction?.()}
      >
        {serverName ? (
          <span className="nav-profile-initial">
            {serverName[0].toUpperCase()}
          </span>
        ) : (
          <UserRound size={16} color="#0375f6" />
        )}
      </div>
    </div>
  );
}
