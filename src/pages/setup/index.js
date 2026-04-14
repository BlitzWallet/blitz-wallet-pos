import React, { useEffect, useState } from "react";
import "../onboarding.css";
import { useNavigate } from "react-router-dom";
import { saveToLocalStorage } from "../../functions/localStorage";
import { useGlobalContext } from "../../contexts/posContext";
import { ACCOUNT_LOCAL_STORAGE } from "../../constants";
import CustomTextInput from "../../components/textInput";
import { ArrowLeft } from "lucide-react";
import { setupSession } from "../../functions/getUserFromFirebase";
import { useErrorDisplay } from "../../contexts/errorDisplay";
import FullLoadingScreen from "../../components/loadingScreen.js";
import { useTranslation } from "react-i18next";

function SetupPage() {
  const { setUser, setCurrentUserSession } = useGlobalContext();
  const [posName, setPosName] = useState("");
  const navigate = useNavigate();
  const { showError } = useErrorDisplay();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleUsername = async () => {
    try {
      if (!posName) return;
      setLoading(true);
      const userData = await setupSession(posName.toLowerCase());
      console.log(userData);
      saveToLocalStorage(posName, ACCOUNT_LOCAL_STORAGE);
      setUser(posName);
      setCurrentUserSession({
        account: userData.posData,
        bitcoinPrice: userData.bitcoinPrice,
        usdPriceResponse: userData.usdPriceResponse,
      });
      navigate("/createTipsUsername");
    } catch (err) {
      console.log(err);
      showError(t("setup.notFound"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FullLoadingScreen />;
  }

  return (
    <div className="ob-page">
      <button className="ob-back" onClick={() => navigate("/")}>
        <ArrowLeft size={18} color="#0375f6" />
      </button>

      <div className="ob-content">
        <h1 className="ob-heading">
          {t("setup.titleLine1")}

          <br />
          {t("setup.titleLine2")}
        </h1>
        <p className="ob-desc">{t("setup.description")}</p>

        <div className="ob-input-wrap">
          <CustomTextInput
            getTextInput={setPosName}
            inputText={posName}
            placeholder="Eg. Joes_Snacks"
          />
        </div>

        <button className="ob-cta" disabled={!posName} onClick={handleUsername}>
          {t("common.continue")}
        </button>
      </div>
    </div>
  );
}

export default SetupPage;
