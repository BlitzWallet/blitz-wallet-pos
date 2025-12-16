import React, { useEffect, useState } from "react";
import logo from "../../logo.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { saveToLocalStorage } from "../../functions/localStorage";
import { useGlobalContext } from "../../contexts/posContext";
import { SERVER_LOCAL_STORAGE } from "../../constants";
import CustomTextInput from "../../components/textInput";

function AddTipsUsername() {
  const { setServerName, user } = useGlobalContext();
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="addTipsUsername">
      <header className="addTipsUsername-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main className="addTipsUsername-main">
        <h1 className="addTipsUsername-title">Add Tips Username</h1>
        <p className="addTipsUsername-subtitle">
          Enter a Blitz username or a Lightning address to receive tips to. This
          should be a personal handle that your employer can send your tips to.
        </p>

        <div className="addTipsUsername-inputContainer">
          <p>Enter tips name</p>
          <CustomTextInput getTextInput={setName} placeholder="@username" />
        </div>

        <button
          onClick={() => {
            if (!name) return;
            saveToLocalStorage(name, SERVER_LOCAL_STORAGE);
            setServerName(name);
            navigate(`/${user}`);
          }}
          className="addTipsUsername-button"
        >
          Continue
        </button>
      </main>
    </div>
  );
}

export default AddTipsUsername;
