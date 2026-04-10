import { useLocation } from "react-router-dom";
import { useSettingsDisplay } from "../../contexts/settingsDisplay";
import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";
import { useGlobalContext } from "../../contexts/posContext";
import { AlertTriangle, ArrowLeft, History } from "lucide-react";

export default function PosNavbar({
  backFunction,
  openNamePopupFunction,
  fromPage = "",
  setShowSwapHistory,
}) {
  const { didConfirmSavedUsername } = useGlobalContext();
  const User = getCurrentUser();
  const { setDisplaySettings } = useSettingsDisplay();
  const location = useLocation();

  return (
    <div className="POS-navbar">
      <ArrowLeft
        color="#0375f6"
        alt="Back arrow"
        onClick={backFunction}
        className="POS-back"
      />
      <h2 className="POS-name">{User}</h2>
      {location.pathname.split("/").length == 2 && (
        <>
          {!didConfirmSavedUsername && (
            <AlertTriangle
              onClick={() => openNamePopupFunction()}
              color="#0375f6"
              className="nav-warning"
            />
          )}
        </>
      )}
      {fromPage === "home" && (
        <History
          className="POS-SwapHistoryBtn"
          onClick={() => setShowSwapHistory(true)}
          color="#0375f6"
        />
      )}
    </div>
  );
}
