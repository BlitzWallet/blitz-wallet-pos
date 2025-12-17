import "./style.css";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PosNavbar from "../../components/nav";
import { useGlobalContext } from "../../contexts/posContext";
import CustomKeyboard from "../../components/keypad";
import BalanceView from "../../components/balanceView";
import { formatBalanceAmount } from "../../functions/formatNumber";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination";

export default function AddTipPage() {
  const { currentUserSession, currentSettings, dollarSatValue } =
    useGlobalContext();
  const location = useLocation();
  const { satAmount, fiatAmount } = location.state;
  const navigate = useNavigate();

  const [tipAmount, setTipAmount] = useState({
    selectedTip: undefined,
    customTip: "",
    showCustomTip: false,
  });

  const tipValue = tipAmount.customTip
    ? currentSettings?.displayCurrency?.isSats
      ? tipAmount.customTip
      : ((Number(tipAmount.customTip) || 0) / 100).toFixed(2)
    : (
        (currentSettings?.displayCurrency?.isSats ? satAmount : fiatAmount) *
        ((tipAmount.selectedTip || 0) / 100)
      ).toFixed(currentSettings?.displayCurrency?.isSats ? 0 : 2);

  const tipAmountFiat = currentSettings?.displayCurrency?.isSats
    ? (tipValue / dollarSatValue).toFixed(2)
    : Number(tipValue).toFixed(2);

  const tipAmountSats = currentSettings?.displayCurrency?.isSats
    ? Math.round(tipValue)
    : Math.round(dollarSatValue * tipValue);

  if (!currentUserSession.account) return;

  return (
    <div className="TipPage-container">
      <PosNavbar
        backFunction={() => {
          navigate(-1);
        }}
      />

      {/* Content */}
      <main className="Tip-container">
        {/* Total Section */}
        <div className="total-section">
          <div className="total-label">Total amount</div>
          <div className="total-amount-large">
            {formatBalanceAmount(
              displayCorrectDenomination({
                amount: currentSettings?.displayCurrency?.isSats
                  ? (Number(satAmount) + Number(tipAmountSats)).toFixed(0)
                  : (Number(fiatAmount) + Number(tipAmountFiat)).toFixed(2),
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              })
            )}
          </div>
          <div className="amount-breakdown">
            {`${formatBalanceAmount(
              displayCorrectDenomination({
                amount: currentSettings?.displayCurrency?.isSats
                  ? satAmount
                  : fiatAmount,
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              })
            )} + ${formatBalanceAmount(
              displayCorrectDenomination({
                amount: tipValue,
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              })
            )} tip`}
          </div>
        </div>

        {tipAmount.showCustomTip ? (
          <div className="custom-tip-section">
            {/* <BalanceView balance={tipAmount.customTip} /> */}
            <CustomKeyboard
              showPlus={false}
              customFunction={(input) => {
                setTipAmount((prev) => {
                  if (Number.isInteger(input)) {
                    let num;
                    if (input === 0) num = String(prev.customTip) + 0;
                    else num = String(prev.customTip) + input;
                    return { ...prev, customTip: num };
                  } else {
                    if (input.toLowerCase() === "c") {
                      return { ...prev, customTip: "" };
                    }
                  }
                });
              }}
            />
            <button
              onClick={() =>
                setTipAmount((prev) => ({
                  ...prev,
                  showCustomTip: false,
                }))
              }
              className="continue-btn"
            >
              {tipAmount.customTip ? "Save" : "Back"}
            </button>
          </div>
        ) : (
          <>
            {/* Tip Selection */}
            <div className="tip-selection-section">
              <h2 className="tip-header-text">Add a tip?</h2>

              <div className="tip-grid">
                {[15, 18, 20, "custom"].map((item) => {
                  const isSelected =
                    tipAmount.selectedTip === item ||
                    (typeof item === "string" && !!tipAmount.customTip);

                  return (
                    <button
                      key={item}
                      onClick={() => {
                        if (typeof item === "string") {
                          setTipAmount({
                            customTip: "",
                            selectedTip: undefined,
                            showCustomTip: true,
                          });
                        } else {
                          setTipAmount({
                            customTip: "",
                            selectedTip:
                              tipAmount.selectedTip === item ? undefined : item,
                            showCustomTip: false,
                          });
                        }
                      }}
                      className={`tip-option ${
                        isSelected ? "tip-option-selected" : ""
                      }`}
                    >
                      {typeof item === "string" ? "Custom" : `${item}%`}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setTipAmount({
                    customTip: "",
                    selectedTip: null,
                    showCustomTip: false,
                  })
                }
                className={`no-tip-btn ${
                  tipAmount.selectedTip === null ? "no-tip-selected" : ""
                }`}
              >
                No tip
              </button>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => {
                if (!tipAmount.customTip && tipAmount.selectedTip === undefined)
                  return;

                navigate(
                  `/${currentUserSession.account.storeNameLower}/checkout`,
                  {
                    state: {
                      satAmount: Math.round(satAmount),
                      tipAmountFiat,
                      tipAmountSats,
                    },
                  }
                );
              }}
              disabled={
                !tipAmount.customTip && tipAmount.selectedTip === undefined
              }
              className="continue-btn"
            >
              Continue
            </button>
          </>
        )}
      </main>
    </div>
  );
}
