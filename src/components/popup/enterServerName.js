import { useState } from "react";
import "./enterServerName.css";
import { saveToLocalStorage } from "../../functions/localStorage";
import { SERVER_LOCAL_STORAGE } from "../../constants";
import { useGlobalContext } from "../../contexts/posContext";
import CustomTextInput from "../textInput";
import { useTranslation } from "react-i18next";

export default function EnterServerName({ setPopupType }) {
  const { serverName, setServerName, setDidConfirmSavedUsername } =
    useGlobalContext();
  const [name, setName] = useState(serverName);
  const [isClosing, setIsClosing] = useState(false);
  const { t } = useTranslation();

  const closePopup = () =>
    setPopupType((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k]) => [k, false])),
    );

  const handleClose = () => setIsClosing(true);

  const handleAnimationEnd = () => {
    if (isClosing) closePopup();
  };

  const handleNameInput = () => {
    if (!serverName && !name) return;
    if (name) {
      saveToLocalStorage(name, SERVER_LOCAL_STORAGE);
      setServerName(name);
    }
    setDidConfirmSavedUsername(true);
    handleClose();
  };

  const handleContainerClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`server-name-backdrop${isClosing ? " backdrop-exit" : ""}`}
    >
      <div
        className={`server-name-sheet${isClosing ? " sheet-exit" : ""}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="sheet-handle" />
        <p className="sheet-title">
          {serverName
            ? t("serverName.yourUsername")
            : t("serverName.setUsername")}
        </p>
        <p className="sheet-description">
          {serverName
            ? t("serverName.description")
            : t("serverName.enterDescription")}
        </p>
        <CustomTextInput
          maxLength={50}
          getTextInput={setName}
          inputText={name || ""}
          placeholder={t("serverName.placeholder")}
          customStyles={{ width: "100%" }}
        />
        <button
          className="action-button primary sheet-cta-button"
          onClick={handleNameInput}
        >
          {serverName && !name ? t("common.keep") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
