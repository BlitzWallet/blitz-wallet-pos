import { useState } from "react";
import "./enterBitcoinPrice.css";
import { useGlobalContext } from "../../contexts/posContext";
import CustomTextInput from "../textInput";

export default function EnterBitcoinPrice({ setPopupType }) {
  const { setCurrentUserSession } = useGlobalContext();
  const [enteredBitcoinPrice, setEnteredBitcoinPrice] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const closePopup = () =>
    setPopupType((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k]) => [k, false])),
    );

  const handleClose = () => setIsClosing(true);

  const handleAnimationEnd = () => {
    if (isClosing) closePopup();
  };

  const handleSave = () => {
    if (!enteredBitcoinPrice) return;
    setCurrentUserSession((prev) => ({
      ...prev,
      bitcoinPrice: Number(enteredBitcoinPrice),
    }));
    handleClose();
  };

  return (
    <div
      className={`bitcoin-price-backdrop${isClosing ? " backdrop-exit" : ""}`}
    >
      <div
        className={`bitcoin-price-sheet${isClosing ? " sheet-exit" : ""}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="sheet-handle" />
        <p className="sheet-title">Set Bitcoin Price</p>
        <p className="sheet-description">
          Enter the current BTC/USD price to calculate amounts.
        </p>
        <CustomTextInput
          maxLength={50}
          getTextInput={setEnteredBitcoinPrice}
          inputText={enteredBitcoinPrice}
          placeholder="Bitcoin price (no decimals)"
          customStyles={{ width: "100%" }}
        />
        <button className="sheet-cta-button" onClick={handleSave}>
          Save Price
        </button>
      </div>
    </div>
  );
}
