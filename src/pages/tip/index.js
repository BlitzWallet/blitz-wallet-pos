import "./style.css";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PosNavbar from "../../components/nav";
import { useGlobalContext } from "../../contexts/posContext";
import CustomKeyboard from "../../components/keypad";
import BalanceView from "../../components/balanceView";

export default function AddTipPage() {
  const { currentUserSession } = useGlobalContext();
  const location = useLocation();
  const { satAmount, fiatAmount } = location.state;
  const navigate = useNavigate();

  const [tipAmount, setTipAmount] = useState({
    selectedTip: null,
    customTip: "",
    showCustomTip: false,
  });
  const tipAmountFiat = tipAmount.customTip
    ? ((Number(tipAmount.customTip) || 0) / 100).toFixed(2)
    : (fiatAmount * ((tipAmount.selectedTip || 0) / 100)).toFixed(2);
  const tipAmountSats = tipAmount.customTip
    ? Math.round(
        (100_000_000 / currentUserSession.bitcoinPrice) *
          ((tipAmount.customTip || 0) / 100)
      )
    : Math.round(satAmount * ((tipAmount.selectedTip || 0) / 100));

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

  return (
    <div className="TipPage-container">
      <PosNavbar
        backFunction={() => {
          navigate(`../../${currentUserSession.account.storeNameLower}`);
        }}
      />

      <div className="Tip-container">
        <h2 className="total-amount">{`Total: $${fiatAmount}`}</h2>
        <h3 className="amount-breakdown">
          {`$${fiatAmount} + $${tipAmountFiat} Tip`}
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
                  `../${currentUserSession.account.storeNameLower}/checkout`,
                  {
                    state: {
                      satAmount: Math.round(satAmount),
                      tipAmountFiat,
                      tipAmountSats,
                    },
                    replace: true,
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
