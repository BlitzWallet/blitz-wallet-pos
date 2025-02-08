import "./style.css";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import checkAnimation from "../../../public/assets/checkmark.json";

export default function ConfirmPaymentScreen({ clearSettings }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowButton(true);
    }, 400);
  }, []);
  return (
    <div className="ConfirmPayment-container">
      <div className="ConfirmPayment-BackgroundAnimation" />
      <div className="ConfirmPayment-ContentContainer">
        <Lottie
          loop={false}
          className="ConfirmPayment-Icon"
          animationData={checkAnimation}
        />
        {showButton ? (
          <button onClick={clearSettings} className="ConfirmScreen-BTN">
            Continue
          </button>
        ) : (
          <p />
        )}
      </div>
    </div>
  );
}
