import { useLocation } from "react-router-dom";
import { useSettingsDisplay } from "../../contexts/settingsDisplay";
import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";
import { useGlobalContext } from "../../contexts/posContext";

export default function PosNavbar({ backFunction, openNamePopupFunction }) {
  const { didConfirmSavedUsername, setDidConfirmSavedUsername } =
    useGlobalContext();
  const User = getCurrentUser();
  const { setDisplaySettings } = useSettingsDisplay();
  const location = useLocation();

  return (
    <div className="POS-navbar">
      <img
        onClick={() => {
          backFunction();
        }}
        alt="Back arrow"
        className="POS-back"
        src="/assets/icons/arrowLeft.png"
      />
      <h2 className="POS-name">{User}</h2>
      {location.pathname.split("/").length == 2 && (
        <>
          {!didConfirmSavedUsername && (
            <img
              onClick={() => {
                setDidConfirmSavedUsername(true);
                openNamePopupFunction();
              }}
              alt="Back arrow"
              className="nav-warning"
              src="/assets/icons/warningBlue.png"
            />
          )}
          <img
            onClick={() => {
              setDisplaySettings(true);
            }}
            alt="Back arrow"
            className="nav-settings"
            src="/assets/icons/settings.png"
          />
        </>
      )}
    </div>
  );
}
