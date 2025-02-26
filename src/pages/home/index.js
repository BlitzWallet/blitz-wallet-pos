import React, { useState } from "react";
import logo from "../../logo.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { saveToLocalStorage } from "../../functions/localStorage";
import { useGlobalContext } from "../../contexts/posContext";
import { ACCOUNT_LOCAL_STORAGE } from "../../constants";

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
          <input
            onInput={(e) => setPosName(e.currentTarget.value)}
            placeholder="Name..."
            className="Home-input"
            type="text"
          />
        </div>

        <button
          onClick={() => {
            saveToLocalStorage(posName, ACCOUNT_LOCAL_STORAGE);
            setUser(posName);
            navigate(`./${posName}`);
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
