import { useLocation } from "react-router-dom";
import { useSettingsDisplay } from "../../contexts/settingsDisplay";
import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";

export default function PosNavbar({ backFunction }) {
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
        <img
          onClick={() => {
            setDisplaySettings(true);
          }}
          alt="Back arrow"
          className="nav-settings"
          src="/assets/icons/settings.png"
        />
      )}
    </div>
  );
}
