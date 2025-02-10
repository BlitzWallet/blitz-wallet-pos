import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { setupSession } from "../../functions/getUserFromFirebase";
import getBitcoinPrice from "../../functions/getBitcoinPrice";
import EnterBitcoinPrice from "../../components/popup/enterBitcoinPrice";
import ErrorPopup from "../../components/errorScreen";
import getCurrentUser from "../../hooks/getCurrnetUser";
import { useGlobalContext } from "../../contexts/posContext";
import PosNavbar from "../../components/nav";
import logout from "../../functions/logout";
import FullLoadingScreen from "../../components/loadingScreen.js";
import { removeLocalStorageItem } from "../../functions/localStorage.js";
function POSPage() {
  const User = getCurrentUser();
  const { setCurrentUserSession, currentUserSession } = useGlobalContext();
  const [chargeAmount, setChargeAmount] = useState(""); // in cents
  const [openPopup, setOpenPopup] = useState(false);
  const [hasError, setHasError] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const didInitialRender = useRef(true);

  const navigate = useNavigate();

  const totalAmount =
    addedItems.reduce((a, b) => {
      return a + Number(b.amount / 100);
    }, 0) +
    Number(chargeAmount) / 100;

  const dollarSatValue = 100000000 / currentUserSession.bitcoinPrice;
  const convertedSatAmount = dollarSatValue * totalAmount;

  const canReceivePayment = totalAmount != 0 && convertedSatAmount >= 1000;

  useEffect(() => {
    async function initPage() {
      let data;
      try {
        data = await setupSession(User.toLowerCase());
      } catch (err) {
        console.log("init page get single contact error", err);
        setHasError("Unable to authenticate request");
        return;
      }
      console.log("did retrive point-of-sale data", !!data);

      if (!data) {
        setHasError("Unable to find point-of-sale");
        return;
      }

      if (!data.bitcoinPrice) setOpenPopup(true);
      removeLocalStorageItem("claims");
      setCurrentUserSession({
        account: data.posData,
        bitcoinPrice: data.bitcoinPrice,
      });
    }
    if (currentUserSession.account && currentUserSession.bitcoinPrice) return;
    if (!didInitialRender.current) return;
    didInitialRender.current = false;
    initPage();
  }, [currentUserSession]);

  if (
    !currentUserSession.account &&
    !currentUserSession.bitcoinPrice &&
    !hasError
  ) {
    return <FullLoadingScreen text="Setting up the point-of-sale system" />;
  }

  return (
    <div className="POS-Container">
      <PosNavbar
        backFunction={() => {
          logout();
        }}
      />
      {openPopup ? (
        <EnterBitcoinPrice
          setOpenPopup={setOpenPopup}
          setBitcoinPrice={setCurrentUserSession}
        />
      ) : hasError ? (
        <ErrorPopup
          customFunction={logout}
          navigatePath="../"
          errorMessage={hasError}
        />
      ) : (
        <div />
      )}
      <div className="POS-ContentContainer">
        {addedItems.length === 0 ? (
          <p className="POS-chargeItems">No charged items</p>
        ) : (
          <p className="POS-chargeItems">
            {addedItems
              .map((value) => {
                return `${(value.amount / 100).toFixed(2).toLocaleString()} ${
                  currentUserSession?.account?.storeCurrency || "USD"
                }`;
              })
              .join(" + ")}
          </p>
        )}
        <div className="POS-BalanceView">
          <div className="POS-BalanceScrollView">
            <h1 className="POS-totalBalance">{`${
              !chargeAmount
                ? "0.00"
                : Number(chargeAmount / 100)
                    .toFixed(2)
                    .toLocaleString()
            }`}</h1>
          </div>
          <h1
            style={{
              margin: "0 0 0 5px",
              fontSize: 30,
              alignSelf: "center",
            }}
            className="POS-totalBalance"
          >
            {currentUserSession?.account
              ? currentUserSession?.account?.storeCurrency?.toUpperCase()
              : "USD"}
          </h1>
        </div>

        <p className="POS-AmountError">
          {convertedSatAmount > 1000
            ? "\u00A0"
            : `Minimum invoice amount is ${(1000 / dollarSatValue).toFixed(
                2
              )} ${currentUserSession?.account?.storeCurrency || "USD"}`}
        </p>

        <div className="POS-keypad">
          <div className="POS-keypadRow">
            <div
              onClick={() => {
                addNumToBalance(1);
              }}
              className="key"
            >
              <span>1</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(2);
              }}
              className="key"
            >
              <span>2</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(3);
              }}
              className="key"
            >
              <span>3</span>
            </div>
          </div>
          <div className="POS-keypadRow">
            <div
              onClick={() => {
                addNumToBalance(4);
              }}
              className="key"
            >
              <span>4</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(5);
              }}
              className="key"
            >
              <span>5</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(6);
              }}
              className="key"
            >
              <span>6</span>
            </div>
          </div>
          <div className="POS-keypadRow">
            <div
              onClick={() => {
                addNumToBalance(7);
              }}
              className="key"
            >
              <span>7</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(8);
              }}
              className="key"
            >
              <span>8</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(9);
              }}
              className="key"
            >
              <span>9</span>
            </div>
          </div>
          <div className="POS-keypadRow">
            <div
              onClick={() => {
                addNumToBalance("C");
              }}
              className="key"
            >
              <span>C</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance(0);
              }}
              className="key"
            >
              <span>0</span>
            </div>
            <div
              onClick={() => {
                addNumToBalance("+");
              }}
              className="key"
            >
              <span style={{ color: "var(--primary)" }}>+</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleInvoice}
          style={{ opacity: !canReceivePayment ? 0.5 : 1 }}
          className="POS-btn"
        >
          {`Charge $${totalAmount.toFixed(2).toLocaleString()}`}
        </button>
        <p className="POS-denominationDisclaimer">{`Priced in ${
          currentUserSession?.account?.storeCurrency || "USD"
        }`}</p>
      </div>
    </div>
  );

  function addNumToBalance(targetNum) {
    if (Number.isInteger(targetNum)) {
      setChargeAmount((prev) => {
        let num;

        if (targetNum === 0) num = String(prev) + 0;
        else num = String(prev) + targetNum;

        return num;
      });
    } else {
      if (targetNum.toLowerCase() === "c") {
        if (!chargeAmount) setAddedItems([]);
        else setChargeAmount("");
      } else {
        if (!chargeAmount) return;
        setAddedItems((prev) => {
          const newItem = { amount: chargeAmount };

          return [...prev, newItem];
        });
        setChargeAmount("");
      }
    }
  }

  async function handleInvoice() {
    if (!canReceivePayment) return;
    navigate(`./checkout?amount=${Math.round(convertedSatAmount)}`);
  }
}

export default POSPage;
