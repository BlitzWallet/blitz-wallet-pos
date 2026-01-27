import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { setupSession } from "../../functions/getUserFromFirebase.js";
import EnterBitcoinPrice from "../../components/popup/enterBitcoinPrice.jsx";
import ErrorPopup from "../../components/errorScreen/index.jsx";
import getCurrentUser from "../../hooks/getCurrnetUser.js";
import { useGlobalContext } from "../../contexts/posContext.jsx";
import PosNavbar from "../../components/nav/index.jsx";
import logout from "../../functions/logout.js";
import FullLoadingScreen from "../../components/loadingScreen.js/index.jsx";
import { removeLocalStorageItem } from "../../functions/localStorage.js";
import EnterServerName from "../../components/popup/enterServerName.jsx";
import CustomKeyboard from "../../components/keypad/index.jsx";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination.js";
import { formatBalanceAmount } from "../../functions/formatNumber.js";
import ItemsList from "../../components/itemsList/index.jsx";

function POSPage() {
  const User = getCurrentUser();
  const {
    setCurrentUserSession,
    currentUserSession,
    serverName,
    currentSettings,
    dollarSatValue,
    toggleSettings,
  } = useGlobalContext();
  const didLoadPOS = useRef(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [popupType, setPopupType] = useState({
    openPopup: false,
    bitcoinPrice: false,
    errorScreen: false,
    serverName: false,
  });
  const [activeInput, setActiveInput] = useState("keypad");
  const [hasError, setHasError] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const didInitialRender = useRef(true);
  const stopClearOnFirstLoad = useRef(true);
  const navigate = useNavigate();
  const isUsingSpark = currentUserSession?.account?.sparkPubKey;
  const minimumPaymentAmount = isUsingSpark ? 1 : 1000;

  const totalAmount =
    addedItems.reduce((a, b) => {
      return a + Number(b.amount);
    }, 0) + Number(chargeAmount);

  const dollarValue = totalAmount / 100;
  const convertedSatAmount = currentSettings?.displayCurrency?.isSats
    ? totalAmount
    : dollarSatValue * dollarValue;

  const canReceivePayment =
    totalAmount != 0 && convertedSatAmount >= minimumPaymentAmount;

  useEffect(() => {
    if (stopClearOnFirstLoad.current) {
      stopClearOnFirstLoad.current = false;
      return;
    }
    setAddedItems([]);
    setChargeAmount("");
  }, [currentSettings?.displayCurrency?.isSats]);

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

  const handleOpenChangeUsername = () => {
    setPopupType((prev) => {
      let newObject = {};
      Object.entries(prev).forEach((entry) => {
        newObject[entry[0]] =
          entry[0] === "serverName" || entry[0] === "openPopup";
      });
      return newObject;
    });
  };

  return (
    <div className="POS-Container">
      <PosNavbar
        backFunction={() => {
          logout();
        }}
        openNamePopupFunction={handleOpenChangeUsername}
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
      {!currentUserSession.account || !currentUserSession.bitcoinPrice ? (
        <FullLoadingScreen text="Setting up the point-of-sale system" />
      ) : (
        <div className="POS-ContentContainer">
          {/* Amount Display Section */}
          <div className="POS-AmountDisplay">
            <div className="POS-chargeItems">
              {addedItems.length === 0
                ? "No charged items"
                : addedItems
                    .map((value) => {
                      return formatBalanceAmount(
                        displayCorrectDenomination({
                          amount: currentSettings?.displayCurrency?.isSats
                            ? value.amount
                            : (value.amount / 100).toFixed(2),
                          fiatCurrency:
                            currentUserSession.account.storeCurrency || "USD",
                          showSats: currentSettings.displayCurrency.isSats,
                          isWord: currentSettings.displayCurrency.isWord,
                        }),
                      );
                    })
                    .join(" + ")}
            </div>
            <div
              className="POS-MainAmount"
              onClick={() => {
                toggleSettings({
                  displayCurrency: {
                    isSats: !currentSettings.displayCurrency.isSats,
                    isWord: currentSettings.displayCurrency.isWord,
                  },
                });
              }}
            >
              {formatBalanceAmount(
                displayCorrectDenomination({
                  amount: currentSettings?.displayCurrency?.isSats
                    ? chargeAmount || "0"
                    : (chargeAmount / 100).toFixed(2) || "0.00",
                  fiatCurrency:
                    currentUserSession.account.storeCurrency || "USD",
                  showSats: currentSettings.displayCurrency.isSats,
                  isWord: currentSettings.displayCurrency.isWord,
                }),
              )}
            </div>
            <div className="POS-AltAmount">
              {formatBalanceAmount(
                displayCorrectDenomination({
                  amount: !currentSettings?.displayCurrency?.isSats
                    ? ((chargeAmount / 100) * dollarSatValue).toFixed(2)
                    : (chargeAmount / dollarSatValue).toFixed(2),
                  fiatCurrency:
                    currentUserSession.account.storeCurrency || "USD",
                  showSats: !currentSettings.displayCurrency.isSats,
                  isWord: currentSettings.displayCurrency.isWord,
                }),
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="POS-TabNavigation">
            <button
              onClick={() => setActiveInput("keypad")}
              className={`POS-TabButton ${
                activeInput === "keypad" ? "active" : ""
              }`}
            >
              Keypad
            </button>
            <button
              onClick={() => setActiveInput("library")}
              className={`POS-TabButton ${
                activeInput === "library" ? "active" : ""
              }`}
            >
              Library
            </button>
          </div>

          {/* Content Area */}
          <div className="POS-ContentArea">
            {activeInput === "keypad" ? (
              <CustomKeyboard customFunction={addNumToBalance} />
            ) : (
              <ItemsList
                dollarSatValue={dollarSatValue}
                currentSettings={currentSettings}
                currentUserSession={currentUserSession}
                setAddedItems={setAddedItems}
                listElements={currentUserSession.account?.items}
              />
            )}
          </div>

          {/* Footer */}
          <div className="POS-Footer">
            <button
              onClick={handleInvoice}
              disabled={!canReceivePayment}
              className="POS-ChargeButton"
            >
              {`Charge ${formatBalanceAmount(
                displayCorrectDenomination({
                  amount: currentSettings?.displayCurrency?.isSats
                    ? convertedSatAmount || "0"
                    : dollarValue.toFixed(2) || "0.00",
                  fiatCurrency:
                    currentUserSession.account.storeCurrency || "USD",
                  showSats: currentSettings.displayCurrency.isSats,
                  isWord: currentSettings.displayCurrency.isWord,
                }),
              )}`}
            </button>
            <div className="POS-denominationDisclaimer">
              {`Conversion based on ${
                currentUserSession?.account?.storeCurrency || "USD"
              }`}
            </div>
          </div>
        </div>
      )}
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
    const satValue = currentSettings.displayCurrency.isSats
      ? totalAmount
      : dollarSatValue * (totalAmount / 100);
    const fiatValue = currentSettings.displayCurrency.isSats
      ? totalAmount / dollarSatValue
      : totalAmount / 100;

    navigate(`/${currentUserSession?.account?.storeName}/tip`, {
      state: {
        satAmount: Math.round(satValue),
        fiatAmount: Number(fiatValue).toFixed(2),
      },
    });
  }
}

export default POSPage;
