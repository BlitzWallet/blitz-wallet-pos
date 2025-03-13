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
    selectedTip: null,
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

  const tipOptionElements = [15, 20, 25, 0].map((item, index) => {
    return (
      <div
        key={item}
        onClick={() => {
          setTipAmount({
            customTip: "",
            selectedTip: tipAmount.selectedTip === item ? null : item,
          });
        }}
        className="tipItem"
        style={{
          backgroundColor:
            tipAmount.selectedTip == item
              ? "var(--primary)"
              : "var(--lightModeBackgroundOffset)",
        }}
      >
        <p
          style={{
            color:
              tipAmount.selectedTip == item
                ? "var(--darkModeText)"
                : "var(--lightModeText)",
          }}
        >
          {`${!item ? "No tip" : String(item)}${!item ? "" : "%"}`}
        </p>
      </div>
    );
  });

  if (!currentUserSession.account) return;

  return (
    <div className="TipPage-container">
      <PosNavbar
        backFunction={() => {
          navigate(-1);
        }}
      />

      <div className="Tip-container">
        <h2 className="total-amount">{`Total: ${formatBalanceAmount(
          displayCorrectDenomination({
            amount: currentSettings?.displayCurrency?.isSats
              ? satAmount
              : fiatAmount,
            fiatCurrency: currentUserSession.account.storeCurrency || "USD",
            showSats: currentSettings.displayCurrency.isSats,
            isWord: currentSettings.displayCurrency.isWord,
          })
        )}`}</h2>
        <h3 className="amount-breakdown">
          {`${formatBalanceAmount(
            displayCorrectDenomination({
              amount: currentSettings?.displayCurrency?.isSats
                ? satAmount
                : fiatAmount,
              fiatCurrency: currentUserSession.account.storeCurrency || "USD",
              showSats: currentSettings.displayCurrency.isSats,
              isWord: currentSettings.displayCurrency.isWord,
            })
          )} +${formatBalanceAmount(
            displayCorrectDenomination({
              amount: tipValue,
              fiatCurrency: currentUserSession.account.storeCurrency || "USD",
              showSats: currentSettings.displayCurrency.isSats,
              isWord: currentSettings.displayCurrency.isWord,
            })
          )} Tip`}
        </h3>
        {tipAmount.showCustomTip ? (
          <>
            <BalanceView balance={tipAmount.customTip} />
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
                      return { ...prev, customTip: 0 };
                    }
                  }
                });
              }}
            />
            <button
              className="back-btn"
              onClick={() =>
                setTipAmount((prev) => ({
                  ...prev,
                  showCustomTip: false,
                }))
              }
            >
              {tipAmount.customTip ? "Save" : "Back"}
            </button>
          </>
        ) : (
          <>
            <h2 className="header">Add a tip?</h2>
            <div className="tipContainer">{tipOptionElements}</div>

            <button
              className="no-tip"
              onClick={() =>
                setTipAmount((prev) => ({
                  customTip: "",
                  selectedTip: null,
                  showCustomTip: true,
                }))
              }
              style={{
                backgroundColor: tipAmount.customTip
                  ? "var(--primary)"
                  : "var(--lightModeBackgroundOffset)",

                color: tipAmount.customTip
                  ? "var(--darkModeText)"
                  : "var(--lightModeText)",
              }}
            >
              Custom
            </button>
            <button
              className="continue-btn"
              style={{
                opacity:
                  !tipAmount.customTip && tipAmount.selectedTip === null
                    ? 0.2
                    : 1,
              }}
              onClick={() => {
                if (!tipAmount.customTip && tipAmount.selectedTip === null)
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
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
