import React, { useState } from "react";
import "../onboarding.css";
import { useNavigate } from "react-router-dom";
import { saveToLocalStorage } from "../../functions/localStorage";
import { useGlobalContext } from "../../contexts/posContext";
import { SERVER_LOCAL_STORAGE } from "../../constants";
import CustomTextInput from "../../components/textInput";
import { ArrowLeft } from "lucide-react";

function AddTipsUsername() {
  const { setServerName, user } = useGlobalContext();
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="ob-page">
      <button className="ob-back" onClick={() => navigate("/setup")}>
        <ArrowLeft size={18} color="#0375f6" />
      </button>

      <div className="ob-content">
        <h1 className="ob-heading">
          Where should
          <br />
          tips go?
        </h1>
        <p className="ob-desc">
          Add a Blitz username or Lightning address to receive tips
        </p>

        <div className="ob-input-wrap">
          <CustomTextInput
            getTextInput={setName}
            inputText={name}
            placeholder="Eg. blitz or name@domain.com"
          />
        </div>

        <button
          className="ob-cta"
          disabled={!name}
          onClick={() => {
            if (!name) return;
            saveToLocalStorage(name, SERVER_LOCAL_STORAGE);
            setServerName(name);
            navigate(`/${user}`);
          }}
        >
          Continue
        </button>
        <button
          style={{ paddingBottom: 0 }}
          className="ob-skip"
          onClick={() => navigate(`/${user}`)}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default AddTipsUsername;
