import React, { useEffect, useState } from "react";
import logo from "../../logo.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { saveToLocalStorage } from "../../functions/localStorage";
import { useGlobalContext } from "../../contexts/posContext";
import { ACCOUNT_LOCAL_STORAGE } from "../../constants";
import CustomTextInput from "../../components/textInput";

function HomePage() {
  const { setUser } = useGlobalContext();
  const [posName, setPosName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="Home">
      <header className="Home-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main className="Home-main">
        <h1 className="Home-title">Blitz</h1>
        <p className="Home-subtitle">
          An online point-of-sale platform giving your business the ability to
          receive Bitcoin.
        </p>

        <div className="Home-inputContainer">
          <p>Enter point-of-sale name</p>
          <CustomTextInput getTextInput={setPosName} placeholder="Name..." />
        </div>

        <button
          onClick={() => {
            if (!posName) return;
            saveToLocalStorage(posName, ACCOUNT_LOCAL_STORAGE);
            setUser(posName);
            navigate(`./createTipsUsername`);
          }}
          className="Home-button"
        >
          Continue
        </button>
      </main>
    </div>
  );
}

export default HomePage;
