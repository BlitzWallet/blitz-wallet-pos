import { useState } from "react";
import "./enterBitcoinPrice.css";
import { useGlobalContext } from "../../contexts/posContext";
export default function EnterBitcoinPrice({ setPopupType }) {
  const { setCurrentUserSession } = useGlobalContext();
  const [enteredBitcoinPrice, setEnteredBitcoinPrice] = useState(0);
  return (
    <div className="EnterBitconPrice-Container">
      <div className="ChangePaymentContainer">
        <p className="ChangePaymentContainer-Desc">
          No currency information found. Please enter current bitcoin price.
        </p>

        <input
          className="bitcoinPriceInput"
          onInput={(e) => setEnteredBitcoinPrice(e.currentTarget.value)}
          placeholder="Bitcoin price (no decimals)"
          type="text"
        />

        <button
          onClick={() => {
            if (!enteredBitcoinPrice) return;
            setCurrentUserSession((prev) => {
              return { ...prev, bitcoinPrice: Number(enteredBitcoinPrice) };
            });
            setPopupType((prev) => {
              let newObject = {};
              Object.entries(prev).forEach((entry) => {
                newObject[entry[0]] = false;
              });
              console.log(newObject);
              return newObject;
            });
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
