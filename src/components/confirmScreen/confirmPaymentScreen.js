import "./style.css";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import checkAnimation from "../../assets/checkmark.json";
import { useTranslation } from "react-i18next";

export default function ConfirmPaymentScreen({ clearSettings }) {
  const [showButton, setShowButton] = useState(false);
  const { t } = useTranslation();

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
            {t("common.continue")}
          </button>
        ) : (
          <p />
        )}
      </div>
    </div>
  );
}
