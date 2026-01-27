import React, { useEffect } from "react";
import "./style.css";
import { copyTextToClipboard } from "../../functions/copyToClipboard";

export default function CopyToCliboardPopup({ close, content }) {
  useEffect(() => {
    copyTextToClipboard(content);
  }, []);
  return (
    <div className="Popup-Container">
      <p className="Popup-Text">Text copied to clipboard</p>
      <div className="Popup-deviderBar" />
      <button
        className="Popup-Button"
        onClick={() => {
          close();
        }}
      >
        Close
      </button>
    </div>
  );
}
