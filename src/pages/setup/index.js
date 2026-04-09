import React, { useEffect, useState } from "react";
import "../onboarding.css";
import { useNavigate } from "react-router-dom";
import { saveToLocalStorage } from "../../functions/localStorage";
import { useGlobalContext } from "../../contexts/posContext";
import { ACCOUNT_LOCAL_STORAGE } from "../../constants";
import CustomTextInput from "../../components/textInput";
import { createSparkWallet } from "../../functions/spark";
import { ArrowLeft } from "lucide-react";

function SetupPage() {
  const { setUser } = useGlobalContext();
  const [posName, setPosName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      await createSparkWallet();
    }
    init();
  }, []);

  return (
    <div className="ob-page">
      <button className="ob-back" onClick={() => navigate("/")}>
        <ArrowLeft size={18} color="#0375f6" />
      </button>

      <div className="ob-content">
        <h1 className="ob-heading">
          Enter your
          <br />
          point of sale name.
        </h1>
        <p className="ob-desc">
          This should match the store name created in the Blitz mobile app.
        </p>

        <div className="ob-input-wrap">
          <CustomTextInput
            getTextInput={setPosName}
            placeholder="Eg. Joes_Snacks"
          />
        </div>

        <button
          className="ob-cta"
          disabled={!posName}
          onClick={() => {
            if (!posName) return;
            saveToLocalStorage(posName, ACCOUNT_LOCAL_STORAGE);
            setUser(posName);
            navigate("/createTipsUsername");
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default SetupPage;
