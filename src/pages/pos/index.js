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
import displayCorrectDenomination from "../../functions/displayCorrectDenomination.js";
import { formatBalanceAmount } from "../../functions/formatNumber.js";
import ItemsList from "../../components/itemsList/index.js";
import { createSparkWallet } from "../../functions/spark.js";
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
  const [inputTextWidths, setInputTextWidths] = useState([]);
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
    async function getSparkInvoice() {
      await createSparkWallet();
    }
    getSparkInvoice();
  }, []);
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

  useEffect(() => {
    // Loading widths for inut text elemtns to use for slider
    setTimeout(
      () => {
        const sliderTexts = document.querySelectorAll(".inputText");
        const widths = Array.from(sliderTexts).map((item) => {
          return item.getBoundingClientRect().width;
        });
        setInputTextWidths(widths);
      },
      currentUserSession?.account ? 0 : 500
    );
  }, [currentUserSession]);

  const handleSlider = (event) => {
    const targetElement = event.target;

    if (!Array.from(targetElement.classList).includes("inputText")) return;
    const children = targetElement.parentElement.children;
    const element = targetElement.innerHTML;

    Array.from(children).forEach((child) => {
      child.classList.remove("active");
      if (child.innerHTML === element) {
        child.classList.add("active");
      }
    });

    setActiveInput(element.toLowerCase());
  };

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
      {!currentUserSession.account || !currentUserSession.bitcoinPrice ? (
        <FullLoadingScreen text="Setting up the point-of-sale system" />
      ) : (
        <div className="POS-ContentContainer">
          {addedItems.length === 0 ? (
            <p className="POS-chargeItems">No charged items</p>
          ) : (
            <p className="POS-chargeItems">
              {addedItems
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
                    })
                  );
                })
                .join(" + ")}
            </p>
          )}
          <BalanceView
            actionFunction={() => {
              toggleSettings({
                displayCurrency: {
                  isSats: !currentSettings.displayCurrency.isSats,
                  isWord: currentSettings.displayCurrency.isWord,
                },
              });
            }}
            balance={chargeAmount}
          />
          <p className="POS-AmountError">
            {convertedSatAmount > minimumPaymentAmount
              ? "\u00A0"
              : `Minimum invoice amount is ${formatBalanceAmount(
                  displayCorrectDenomination({
                    amount: currentSettings?.displayCurrency?.isSats
                      ? minimumPaymentAmount
                      : (minimumPaymentAmount / dollarSatValue).toFixed(2),
                    fiatCurrency:
                      currentUserSession.account.storeCurrency || "USD",
                    showSats: currentSettings.displayCurrency.isSats,
                    isWord: currentSettings.displayCurrency.isWord,
                  })
                )}`}
          </p>

          <div className="POS-savedItemsContainer" onClick={handleSlider}>
            <p className="active inputText">Keypad</p>
            <p className="inputText">Library</p>
            <div
              style={{
                width: inputTextWidths[activeInput === "keypad" ? 0 : 1],
                left:
                  activeInput === "keypad"
                    ? 0
                    : `calc(100% - ${inputTextWidths[1]}px)`,
              }}
              className="selectedInputBar"
            />
          </div>

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

          <button
            onClick={handleInvoice}
            style={{ opacity: !canReceivePayment ? 0.5 : 1 }}
            className="POS-btn"
          >
            {`Charge ${formatBalanceAmount(
              displayCorrectDenomination({
                amount: currentSettings?.displayCurrency?.isSats
                  ? convertedSatAmount
                  : dollarValue.toFixed(2),
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              })
            )}`}
          </button>
          <p className="POS-denominationDisclaimer">{`Conversion based on ${
            currentUserSession?.account?.storeCurrency || "USD"
          }`}</p>
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
