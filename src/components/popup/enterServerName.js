import { useState } from "react";
import "./enterServerName.css";
import { saveToLocalStorage } from "../../functions/localStorage";
import { SERVER_LOCAL_STORAGE } from "../../constants";
import { useGlobalContext } from "../../contexts/posContext";
export default function EnterServerName({ setPopupType }) {
  const [name, setName] = useState("");
  const { serverName, setServerName } = useGlobalContext();
  return (
    <div className="namePopup-Container">
      <div className="ChangePaymentContainer">
        <p className="ChangePaymentContainer-Desc">
          {serverName
            ? `Your last used name is ${serverName}. Please enter a name below if you would like to change it. Otherwise click save.`
            : "Please enter your name so tips can be sent to you."}
        </p>

        <input
          className="bitcoinPriceInput"
          onInput={(e) => setName(e.currentTarget.value)}
          value={name}
          placeholder="Name"
          maxLength={50}
          type="text"
        />

        <button
          onClick={() => {
            if (!serverName && !name) return;
            if (name) {
              saveToLocalStorage(name, SERVER_LOCAL_STORAGE);
              setServerName(name);
            }
            setPopupType((prev) => {
              let newObject = {};
              Object.entries(prev).forEach((entry) => {
                newObject[entry[0]] = false;
              });
              console.log(newObject);
              return newObject;
            });
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
