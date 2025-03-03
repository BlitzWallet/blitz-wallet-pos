import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { setupSession } from "../../functions/getUserFromFirebase";
import EnterBitcoinPrice from "../../components/popup/enterBitcoinPrice";
import ErrorPopup from "../../components/errorScreen";
import getCurrentUser from "../../hooks/getCurrnetUser";
import { useGlobalContext } from "../../contexts/posContext";
import PosNavbar from "../../components/nav";
import logout from "../../functions/logout";
import FullLoadingScreen from "../../components/loadingScreen.js";
import { removeLocalStorageItem } from "../../functions/localStorage.js";
import EnterServerName from "../../components/popup/enterServerName.js";
import CustomKeyboard from "../../components/keypad/index.js";
import BalanceView from "../../components/balanceView/index.js";
function POSPage() {
  const User = getCurrentUser();
  const { setCurrentUserSession, currentUserSession, serverName } =
    useGlobalContext();
  const didLoadPOS = useRef(false);
  const [chargeAmount, setChargeAmount] = useState(""); // in cents
  const [popupType, setPopupType] = useState({
    openPopup: false,
    bitcoinPrice: false,
    errorScreen: false,
    serverName: false,
  });
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
        setPopupType((prev) => {
          let newObject = {};
          Object.entries(prev).forEach((entry) => {
            newObject[entry[0]] =
              entry[0] === "errorScreen" || entry[0] === "openPopup";
          });
          return newObject;
        });
        return;
      }
      console.log("did retrive point-of-sale data", !!data);

      if (!data) {
        setPopupType((prev) => {
          let newObject = {};
          Object.entries(prev).forEach((entry) => {
            newObject[entry[0]] =
              entry[0] === "errorScreen" || entry[0] === "openPopup";
          });
          return newObject;
        });
        setHasError("Unable to find point-of-sale");
        return;
      }

      if (!data.bitcoinPrice) {
        setPopupType((prev) => {
          let newObject = {};
          Object.entries(prev).forEach((entry) => {
            newObject[entry[0]] =
              entry[0] === "bitcoinPrice" || entry[0] === "openPopup";
          });
          return newObject;
        });
      }
      removeLocalStorageItem("claims");
      setCurrentUserSession({
        account: data.posData,
        bitcoinPrice: data.bitcoinPrice,
      });
      didLoadPOS.current = true;
    }
    if (currentUserSession.account && currentUserSession.bitcoinPrice) return;
    if (!didInitialRender.current) return;
    didInitialRender.current = false;
    initPage();
  }, [currentUserSession, serverName]);

  useEffect(() => {
    if (!currentUserSession.bitcoinPrice || !didLoadPOS.current) return;

    setPopupType((prev) => {
      let newObject = {};
      Object.entries(prev).forEach((entry) => {
        newObject[entry[0]] =
          entry[0] === "serverName" || entry[0] === "openPopup";
      });
      return newObject;
    });
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
      {popupType.openPopup ? (
        <>
          {popupType.bitcoinPrice ? (
            <EnterBitcoinPrice setPopupType={setPopupType} />
          ) : (
            <div />
          )}
          {popupType.errorScreen ? (
            <ErrorPopup
              customFunction={logout}
              navigatePath="../"
              errorMessage={hasError}
            />
          ) : (
            <div />
          )}
          {popupType.serverName ? (
            <EnterServerName setPopupType={setPopupType} />
          ) : (
            <div />
          )}
        </>
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
        <BalanceView balance={chargeAmount} />

        <p className="POS-AmountError">
          {convertedSatAmount > 1000
            ? "\u00A0"
            : `Minimum invoice amount is ${(1000 / dollarSatValue).toFixed(
                2
              )} ${currentUserSession?.account?.storeCurrency || "USD"}`}
        </p>

        <CustomKeyboard customFunction={addNumToBalance} />

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
    navigate(`./tip`, {
      state: {
        satAmount: Math.round(convertedSatAmount),
        fiatAmount: Number(totalAmount).toFixed(2),
      },
    });
  }
}

export default POSPage;
