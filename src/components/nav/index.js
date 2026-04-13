import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";
import { ArrowLeft, History, Pi, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PosNavbar({
  backFunction,
  openNamePopupFunction,
  fromPage = "",
  setShowSwapHistory,
  PillToggle,
}) {
  const User = getCurrentUser();
  const { t } = useTranslation();

  return (
    <div className="POS-navbar">
      <div style={{ paddingLeft: 10 }} className="nav-left">
        <button
          className="nav-pill-btn"
          onClick={backFunction}
          aria-label={t("common.goBack")}
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
              aria-label={t("common.history")}
            >
              <History size={20} color="#0375f6" />
            </button>

            <button
              className="nav-pill-btn"
              onClick={() => openNamePopupFunction?.()}
              aria-label={t("common.settings")}
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
