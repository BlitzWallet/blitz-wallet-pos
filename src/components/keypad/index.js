import { useCallback } from "react";
import "./style.css";
export default function CustomKeyboard({ customFunction, addNumToBalance }) {
  const handleClick = useCallback(
    (input) => {
      if (customFunction) {
        customFunction(input);
      } else addNumToBalance(input);
    },
    [customFunction, addNumToBalance]
  );
  return (
    <div className="POS-keypad">
      <div className="POS-keypadRow">
        <div
          onClick={() => {
            handleClick(1);
          }}
          className="key"
        >
          <span>1</span>
        </div>
        <div
          onClick={() => {
            handleClick(2);
          }}
          className="key"
        >
          <span>2</span>
        </div>
        <div
          onClick={() => {
            handleClick(3);
          }}
          className="key"
        >
          <span>3</span>
        </div>
      </div>
      <div className="POS-keypadRow">
        <div
          onClick={() => {
            handleClick(4);
          }}
          className="key"
        >
          <span>4</span>
        </div>
        <div
          onClick={() => {
            handleClick(5);
          }}
          className="key"
        >
          <span>5</span>
        </div>
        <div
          onClick={() => {
            handleClick(6);
          }}
          className="key"
        >
          <span>6</span>
        </div>
      </div>
      <div className="POS-keypadRow">
        <div
          onClick={() => {
            handleClick(7);
          }}
          className="key"
        >
          <span>7</span>
        </div>
        <div
          onClick={() => {
            handleClick(8);
          }}
          className="key"
        >
          <span>8</span>
        </div>
        <div
          onClick={() => {
            handleClick(9);
          }}
          className="key"
        >
          <span>9</span>
        </div>
      </div>
      <div className="POS-keypadRow">
        <div
          onClick={() => {
            handleClick("C");
          }}
          className="key"
        >
          <span>C</span>
        </div>
        <div
          onClick={() => {
            handleClick(0);
          }}
          className="key"
        >
          <span>0</span>
        </div>
        <div
          onClick={() => {
            handleClick("+");
          }}
          className="key"
        >
          <span style={{ color: "var(--primary)" }}>+</span>
        </div>
      </div>
    </div>
  );
}
