import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { setupSession } from "../../functions/getUserFromFirebase";
import EnterBitcoinPrice from "../../components/popup/enterBitcoinPrice";
import getCurrentUser from "../../hooks/getCurrnetUser";
import { useGlobalContext } from "../../contexts/posContext";
import PosNavbar from "../../components/nav";
import logout from "../../functions/logout";
import FullLoadingScreen from "../../components/loadingScreen.js";
import { removeLocalStorageItem } from "../../functions/localStorage.js";
import EnterServerName from "../../components/popup/enterServerName.js";
import CustomKeyboard from "../../components/keypad/index.js";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination.js";
import { formatBalanceAmount } from "../../functions/formatNumber.js";
import ItemsList from "../../components/itemsList/index.js";
import { createSparkWallet } from "../../functions/spark.js";
import { useErrorDisplay } from "../../contexts/errorDisplay";
import SwapHistoryOverlay from "../../components/swapHistoryOverlay/index.js";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { showError } = useErrorDisplay();
  const didLoadPOS = useRef(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [popupType, setPopupType] = useState({
    openPopup: false,
    bitcoinPrice: false,
    serverName: false,
  });
  const [activeInput, setActiveInput] = useState("keypad");
  const [hasError, setHasError] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const [showSwapHistory, setShowSwapHistory] = useState(false);
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
        showError(t("setup.authError"), { customFunction: logout });
        return;
      }
      console.log("did retrive point-of-sale data", !!data);

      if (!data) {
        showError(t("setup.notFound"), { customFunction: logout });
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
        usdPriceResponse: data.usdPriceResponse,
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
        fromPage="home"
        setShowSwapHistory={setShowSwapHistory}
      />
      {popupType.openPopup ? (
        <>
          {popupType.bitcoinPrice ? (
            <EnterBitcoinPrice setPopupType={setPopupType} />
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
        <FullLoadingScreen />
      ) : (
        <main className="POS-ContentContainer">
          {/* Amount Display Section */}
          <div className="POS-AmountDisplay">
            <div className="POS-chargeItems">
              {addedItems.length === 0
                ? t("pos.noChargedItems")
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
                    ? ((chargeAmount / 100) * dollarSatValue).toFixed(0)
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
              {t("pos.keypadTab")}
            </button>
            <button
              onClick={() => setActiveInput("library")}
              className={`POS-TabButton ${
                activeInput === "library" ? "active" : ""
              }`}
            >
              {t("pos.libraryTab")}
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
              className="action-button primary"
            >
              {t("pos.charge", {
                amount: formatBalanceAmount(
                  displayCorrectDenomination({
                    amount: currentSettings?.displayCurrency?.isSats
                      ? convertedSatAmount || "0"
                      : dollarValue.toFixed(2) || "0.00",
                    fiatCurrency:
                      currentUserSession.account.storeCurrency || "USD",
                    showSats: currentSettings.displayCurrency.isSats,
                    isWord: currentSettings.displayCurrency.isWord,
                  }),
                ),
              })}
            </button>
            <div className="POS-denominationDisclaimer">
              {t("pos.conversionNote", {
                currency: currentUserSession?.account?.storeCurrency || "USD",
              })}
            </div>
          </div>
        </main>
      )}
      <SwapHistoryOverlay
        isOpen={showSwapHistory}
        onClose={() => setShowSwapHistory(false)}
      />
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
