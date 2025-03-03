import { useGlobalContext } from "../../contexts/posContext";
import "./style.css";
export default function BalanceView({ balance = 0 }) {
  const { currentUserSession } = useGlobalContext;

  return (
    <div className="POS-BalanceView">
      <div className="POS-BalanceScrollView">
        <h1 className="POS-totalBalance">{`${
          !balance
            ? "0.00"
            : Number(balance / 100)
                .toFixed(2)
                .toLocaleString()
        }`}</h1>
      </div>
      <h1
        style={{
          margin: "0 0 0 5px",
          fontSize: 30,
          alignSelf: "center",
        }}
        className="POS-totalBalance"
      >
        {currentUserSession?.account
          ? currentUserSession?.account?.storeCurrency?.toUpperCase()
          : "USD"}
      </h1>
    </div>
  );
}
