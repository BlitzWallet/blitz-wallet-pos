import "./style.css";
import { useState } from "react";
import getCurrentUser from "../../hooks/getCurrnetUser";
import { useLocation, useNavigate } from "react-router-dom";
import NoAccountRedirect from "../../hooks/redirectWhenNoAccount";
import PosNavbar from "../../components/nav";
import { useGlobalContext } from "../../contexts/posContext";
import CustomKeyboard from "../../components/keypad";

export default function AddTipPage() {
  const { currentUserSession } = useGlobalContext();
  NoAccountRedirect();
  const location = useLocation();
  const { satAmount, fiatAmount } = location.state;
  const navigate = useNavigate();

  const [tipAmount, setTipAmount] = useState({
    selectedTip: null,
    customTip: "",
    usingCustomTip: false,
  });
  const tipAmountFiat = tipAmount.usingCustomTip
    ? (tipAmount.selectedTip || 0).toFixed(2)
    : (fiatAmount * ((tipAmount.selectedTip || 0) / 100)).toFixed(2);
  const tipAmountSats = tipAmount.usingCustomTip
    ? Math.round(
        (100_000_000 / currentUserSession.account?.bitcoinPrice) *
          (tipAmount.selectedTip || 0)
      )
    : Math.round(satAmount * ((tipAmount.selectedTip || 0) / 100));

  console.log(satAmount, fiatAmount, tipAmountFiat, tipAmountSats);

  const tipOptionElements = [15, 20, 25, 0].map((item, index) => {
    return (
      <div
        key={item}
        onClick={() => {
          setTipAmount({
            customTip: 0,
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
          {`${!item ? "No tip" : String(item)}
          ${!item ? "" : "%"}`}
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
        {tipAmount.usingCustomTip ? (
          <>
            <CustomKeyboard />
            <button
              className="back-btn"
              onClick={() =>
                setTipAmount((prev) => ({
                  customTip: 0,
                  usingCustomTip: false,
                }))
              }
            >
              Back
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
                  selectedTip: null,
                  usingCustomTip: true,
                }))
              }
            >
              Custom
            </button>
            <button
              className="continue-btn"
              onClick={() =>
                navigate(
                  `../${currentUserSession.account.storeNameLower}/checkout`,
                  {
                    state: {
                      satAmount: Math.round(satAmount),
                      tipAmountFiat,
                    },
                    replace: true,
                  }
                )
              }
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
