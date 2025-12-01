import { useEffect, useState } from "react";
import { useSettingsDisplay } from "../../contexts/settingsDisplay";
import "./style.css";
import { BITCOIN_SATS_ICON } from "../../constants";
import { useGlobalContext } from "../../contexts/posContext";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination";
export default function SettingsPage() {
  const { displaySettings, setDisplaySettings } = useSettingsDisplay();
  const { currentUserSession, currentSettings, toggleSettings } =
    useGlobalContext();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!displaySettings) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [displaySettings]);

  if (!currentUserSession.account) return;

  return (
    <div
      className={`settings-container ${displaySettings ? "active" : ""}`}
      style={{ zIndex: displaySettings || isAnimating ? 99 : -1 }}
      onClick={() => setDisplaySettings(false)}
    >
      <div className="settings-page" onClick={(e) => e.stopPropagation()}>
        <p>Balance denomination</p>
        <div className="optionsContainer">
          <p>Current denomination</p>
          <div className="optionsButtonContainer">
            <p
              onClick={() => {
                toggleSettings({
                  displayCurrency: {
                    isSats: true,
                    isWord: currentSettings.displayCurrency.isWord,
                  },
                });
              }}
              className="option"
              style={{
                backgroundColor: `var(--${
                  !currentSettings.displayCurrency.isSats
                    ? "lightModeBackground"
                    : "primary"
                })`,
                color: `var(--${
                  !currentSettings.displayCurrency.isSats
                    ? "lightModeText"
                    : "darkModeText"
                })`,
              }}
            >
              {BITCOIN_SATS_ICON}
            </p>
            <p
              onClick={() => {
                toggleSettings({
                  displayCurrency: {
                    isSats: false,
                    isWord: currentSettings.displayCurrency.isWord,
                  },
                });
              }}
              className="option"
              style={{
                backgroundColor: `var(--${
                  currentSettings.displayCurrency.isSats
                    ? "lightModeBackground"
                    : "primary"
                })`,
                color: `var(--${
                  currentSettings.displayCurrency.isSats
                    ? "lightModeText"
                    : "darkModeText"
                })`,
              }}
            >
              {currentUserSession.account.storeCurrency || "USD"}{" "}
            </p>
          </div>
        </div>
        <div className="optionsContainer">
          <p>
            How to display{" "}
            {currentSettings.displayCurrency.isSats ? "SAT" : "fiat"}
          </p>
          <div className="optionsButtonContainer">
            <p
              onClick={() => {
                toggleSettings({
                  displayCurrency: {
                    isSats: currentSettings.displayCurrency.isSats,
                    isWord: false,
                  },
                });
              }}
              className="option"
              style={{
                backgroundColor: `var(--${
                  currentSettings.displayCurrency.isWord
                    ? "lightModeBackground"
                    : "primary"
                })`,
                color: `var(--${
                  currentSettings.displayCurrency.isWord
                    ? "lightModeText"
                    : "darkModeText"
                })`,
              }}
            >
              {currentSettings.displayCurrency.isSats ? BITCOIN_SATS_ICON : "$"}
            </p>
            <p
              onClick={() => {
                toggleSettings({
                  displayCurrency: {
                    isSats: currentSettings.displayCurrency.isSats,
                    isWord: true,
                  },
                });
              }}
              className="option"
              style={{
                backgroundColor: `var(--${
                  !currentSettings.displayCurrency.isWord
                    ? "lightModeBackground"
                    : "primary"
                })`,
                color: `var(--${
                  !currentSettings.displayCurrency.isWord
                    ? "lightModeText"
                    : "darkModeText"
                })`,
              }}
            >
              {currentSettings.displayCurrency.isSats
                ? "SAT"
                : currentUserSession.account.storeCurrency || "USD"}{" "}
            </p>
          </div>
        </div>
        <p className="exampleText">Example</p>
        <p className="exampleText">
          {displayCorrectDenomination({
            amount: currentSettings.displayCurrency.isSats
              ? 21
              : Number(21).toFixed(2),
            fiatCurrency: currentUserSession.account.storeCurrency || "USD",
            showSats: currentSettings.displayCurrency.isSats,
            isWord: currentSettings.displayCurrency.isWord,
          })}
        </p>
      </div>
    </div>
  );
}
