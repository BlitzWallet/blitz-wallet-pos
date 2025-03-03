import { useState } from "react";
import "./enterBitcoinPrice.css";
import { useGlobalContext } from "../../contexts/posContext";
import CustomTextInput from "../textInput";
export default function EnterBitcoinPrice({ setPopupType }) {
  const { setCurrentUserSession } = useGlobalContext();
  const [enteredBitcoinPrice, setEnteredBitcoinPrice] = useState(0);
  return (
    <div className="EnterBitconPrice-Container">
      <div className="ChangePaymentContainer">
        <p className="ChangePaymentContainer-Desc">
          No currency information found. Please enter current bitcoin price.
        </p>
        <CustomTextInput
          maxLength={50}
          getTextInput={setEnteredBitcoinPrice}
          placeholder="Bitcoin price (no decimals)"
          customStyles={{ marginBottom: "30px" }}
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
