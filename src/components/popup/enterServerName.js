import { useEffect, useState } from "react";
import "./enterServerName.css";
import { saveToLocalStorage } from "../../functions/localStorage";
import { SERVER_LOCAL_STORAGE } from "../../constants";
import { useGlobalContext } from "../../contexts/posContext";
import CustomTextInput from "../textInput";
export default function EnterServerName({ setPopupType }) {
  const [name, setName] = useState("");
  const { serverName, setServerName, setDidConfirmSavedUsername } =
    useGlobalContext();

  const closePopup = () => {
    setPopupType((prev) => {
      let newObject = {};
      Object.entries(prev).forEach((entry) => {
        newObject[entry[0]] = false;
      });
      return newObject;
    });
  };

  const handleNameInput = () => {
    if (!serverName && !name) return;
    if (name) {
      saveToLocalStorage(name, SERVER_LOCAL_STORAGE);
      setServerName(name);
    }
    setDidConfirmSavedUsername(true);
    closePopup();
  };

  const handleContainerClick = (event) => {
    if (event.target === event.currentTarget) {
      closePopup(); // call your close function here
    }
  };

  return (
    <div onClick={handleContainerClick} className="namePopup-Container">
      <div className="ChangePaymentContainer">
        <p className="ChangePaymentContainer-Desc">
          {serverName
            ? `Your last used Blitz username or LNURL is ${serverName}. Enter a new username or LNURL below to change it, or click save to keep it.`
            : "Enter a Blitz username or LNURL address to receive tips."}
        </p>
        <CustomTextInput
          maxLength={50}
          getTextInput={setName}
          placeholder="Name..."
          customStyles={{ marginBottom: "30px" }}
        />

        <button onClick={handleNameInput}>
          {serverName && !name ? "Keep" : "Save"}
        </button>
      </div>
    </div>
  );
}
