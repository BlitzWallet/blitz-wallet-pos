import "./style.css";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import checkAnimation from "../../../public/assets/checkmark.json";
import getCurrentUser from "../../hooks/getCurrnetUser";
import { useNavigate } from "react-router-dom";
import NoAccountRedirect from "../../hooks/redirectWhenNoAccount";

export default function ConfirmPaymentScreen({ clearSettings }) {
  const user = getCurrentUser();
  NoAccountRedirect(`../../${user}`);
  const navigate = useNavigate();
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
  function clearSettings() {
    navigate(`../../${user}`);
  }
}
