import { BITCOIN_SATS_ICON } from "../../constants";
import { useGlobalContext } from "../../contexts/posContext";
import { formatCurrency } from "../../functions/formatCurrency";
import { formatBalanceAmount } from "../../functions/formatNumber";
import "./style.css";
export default function BalanceView({ balance = 0, actionFunction }) {
  const { currentUserSession, currentSettings } = useGlobalContext();
  const currencyText = currentUserSession?.account?.storeCurrency;
  const showSymbol = !currentSettings?.displayCurrency?.isWord;
  const showSats = currentSettings?.displayCurrency?.isSats;
  const formattedCurrency = formatCurrency({
    amount: Number(balance / 100).toFixed(2),
    code: currencyText,
  });
  const isSymbolInFront = formattedCurrency[3];
  const currencySymbol = formattedCurrency[2];
  const formatedSat = balance;

  return (
    <div
      style={{ cursor: actionFunction ? "pointer" : "default" }}
      onClick={() => {
        if (!actionFunction) return;
        actionFunction();
      }}
      className="POS-BalanceView"
    >
      {isSymbolInFront && !showSats && showSymbol && (
        <h1
          style={{
            margin: "0 5px 0 0",
            alignSelf: "center",
          }}
          className="POS-totalBalance"
        >
          {currencySymbol}
        </h1>
      )}
      {showSats && showSymbol && (
        <h1
          style={{
            margin: "0 5px 0 0",
            alignSelf: "center",
          }}
          className="POS-totalBalance"
        >
          {BITCOIN_SATS_ICON}
        </h1>
      )}
      <div className="POS-BalanceScrollView">
        <h1 className="POS-totalBalance">{`${
          !balance
            ? showSats
              ? "0"
              : formatCurrency({
                  amount: Number(0).toFixed(2),
                  code: currencyText,
                })[1]
            : showSats
            ? formatBalanceAmount(formatedSat)
            : formattedCurrency[1]
        }`}</h1>
      </div>
      {!isSymbolInFront && !showSats && showSymbol && (
        <h1
          style={{
            margin: "0 0 0 5px",
            alignSelf: "center",
          }}
          className="POS-totalBalance"
        >
          {currencySymbol}
        </h1>
      )}
      {!showSymbol && !showSats && (
        <h1
          style={{
            margin: "0 0 0 5px",

            alignSelf: "center",
          }}
          className="POS-totalBalance"
        >
          {currencyText}
        </h1>
      )}

      {!showSymbol && showSats && (
        <h1
          style={{
            margin: "0 0 0 5px",

            alignSelf: "center",
          }}
          className="POS-totalBalance"
        >
          SAT
        </h1>
      )}
    </div>
  );
}
