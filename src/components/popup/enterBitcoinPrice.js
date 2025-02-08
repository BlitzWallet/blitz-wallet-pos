import { useState } from "react";
import "./enterBitcoinPrice.css";
export default function EnterBitcoinPrice({ setOpenPopup, setBitcoinPrice }) {
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
            setBitcoinPrice((prev) => {
              return { ...prev, bitcoinPrice: enteredBitcoinPrice };
            });
            setOpenPopup(false);
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
