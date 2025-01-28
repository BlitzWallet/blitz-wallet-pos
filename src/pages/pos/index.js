import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { useNavigate, useParams } from "react-router-dom";
import icons from "../../constants/icons";
import { getSignleContact } from "../../functions/getUserFromFirebase";
import LoadingAnimation from "../../components/loadingAnimation";
import { reverseSwap, waitAndClaim } from "../../functions/handleClaim";
import PaymentPage from "../paymentPage";
import getBitcoinPrice from "../../functions/getBitcoinPrice";
import ConfirmPaymentScreen from "../../components/confirmScreen/confirmPaymentScreen";
import useIsTabActive from "../../hooks/isTapActive";
import { clearAccount } from "../../functions/localStorage";
import EnterBitcoinPrice from "../../components/popup/enterBitcoinPrice";
function POSPage() {
  const { username } = useParams();
  const [chargeAmount, setChargeAmount] = useState(""); // in cents
  const [openPopup, setOpenPopup] = useState(false);

  const [addedItems, setAddedItems] = useState([]);
  const [bitcoinPrice, setBitcoinPrice] = useState(0);

  const [hasAccount, setHasAccount] = useState(null);
  const [boltzInvoice, setBoltzInvoice] = useState("");
  const [boltzLoadingAnimation, setBoltzLoadingAnimation] = useState("");
  const [didReceiveBoltzPayment, setDidReceiveBoltzPayment] = useState(null);

  const [boltzSwapClaimInfo, setBoltzSwapClaimInfo] = useState({});
  const isTabActive = useIsTabActive();
  const buttonRef = useRef(null);

  const navigate = useNavigate();

  const totalAmount = addedItems.reduce((a, b) => {
    return a + Number(b.amount / 100);
  }, 0);

  const dollarSatValue = 100000000 / bitcoinPrice;
  const convertedSatAmount = dollarSatValue * totalAmount;

  const canReceivePayment = totalAmount != 0 && convertedSatAmount > 1000;

  console.log(bitcoinPrice, dollarSatValue, convertedSatAmount);

  useEffect(() => {
    async function initPage() {
      const data = await getSignleContact(username.toLowerCase());

      console.log(data, "TEST");

      if (!data) {
        setHasAccount(data);
        return;
      }

      const retrivedBitcoinPrice = await getBitcoinPrice({
        denomination: data?.storeCurrency.toLowerCase() || "usd",
      });

      setHasAccount(data);

      if (!retrivedBitcoinPrice) buttonRef.current.click();

      setBitcoinPrice(retrivedBitcoinPrice);
    }
    initPage();
  }, []);

  useEffect(() => {
    if (Object.keys(boltzSwapClaimInfo).length === 0) return;
    if (isTabActive) return;
    console.log("RUNNING IN UES EFFECT");

    if (boltzLoadingAnimation === "Processing payment") return;
    waitAndClaim(
      boltzSwapClaimInfo,
      setDidReceiveBoltzPayment,
      setBoltzLoadingAnimation
    );
  }, [isTabActive]);

  return (
    <div className="POS-Container">
      <button onClick={() => setOpenPopup(true)} hidden ref={buttonRef} />

      {openPopup ? (
        <EnterBitcoinPrice
          setOpenPopup={setOpenPopup}
          setBitcoinPrice={setBitcoinPrice}
        />
      ) : (
        <div />
      )}

      <div className="POS-navbar">
        <img
          onClick={() => {
            if (boltzInvoice) {
              setBoltzInvoice("");
              return;
            }
            clearAccount();

            setTimeout(() => {
              navigate(`/`, { replace: true });
            }, 300);
          }}
          alt="Back arrow"
          className="POS-back"
          src={icons.leftArrow}
        />
        {hasAccount ? <h2 className="POS-name">{username}</h2> : <p />}
      </div>
      <div className="POS-ContentContainer">
        {boltzLoadingAnimation ? (
          <>
            {didReceiveBoltzPayment ? (
              <ConfirmPaymentScreen clearSettings={clearSettings} />
            ) : (
              <div className="POS-LoadingScreen">
                <LoadingAnimation />
                <p className="POS-LoadingScreenDescription">
                  {boltzLoadingAnimation}
                </p>
              </div>
            )}
          </>
        ) : boltzInvoice ? (
          <PaymentPage
            liquidAdress={hasAccount?.receiveAddress}
            boltzAddress={boltzInvoice}
            setBoltzInvoice={setBoltzInvoice}
            setBoltzLoadingAnimation={setBoltzLoadingAnimation}
            setDidReceiveBoltzPayment={setDidReceiveBoltzPayment}
            convertedSatAmount={convertedSatAmount}
          />
        ) : hasAccount ? (
          <>
            {addedItems.length === 0 ? (
              <p className="POS-chargeItems">No charged items</p>
            ) : (
              <p className="POS-chargeItems">
                {addedItems
                  .map((value) => {
                    return `${(value.amount / 100).toLocaleString()} ${
                      hasAccount.storeCurrency || "USD"
                    }`;
                  })
                  .join(" + ")}
              </p>
            )}
            <div className="POS-BalanceView">
              <div className="POS-BalanceScrollView">
                <h1 className="POS-totalBalance">{`${
                  !chargeAmount
                    ? "0"
                    : Number(chargeAmount / 100).toLocaleString()
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
                {hasAccount ? hasAccount.storeCurrency.toUpperCase() : ""}
              </h1>
            </div>
            {totalAmount != 0 && convertedSatAmount < 1000 ? (
              <p className="POS-AmountError">{`Minimum invoice amount is ${(
                1000 / dollarSatValue
              ).toFixed(2)} ${hasAccount?.storeCurrency || "USD"}`}</p>
            ) : (
              <p className="POS-AmountError"> </p>
            )}

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
              <img className="POS-btnIcon" src={icons.LNicon} />

              {`Charge $${totalAmount.toLocaleString()}`}
            </button>
            <p className="POS-denominationDisclaimer">{`Priced in ${
              hasAccount.storeCurrency || "USD"
            }`}</p>
          </>
        ) : hasAccount === null ? (
          <div className="POS-LoadingScreen">
            <LoadingAnimation />
            <p className="POS-LoadingScreenDescription">
              Setting up the point-of-sale system
            </p>
          </div>
        ) : (
          <div className="POS-LoadingScreen">
            <p className="POS-LoadingScreenDescription">
              There is no point-of-sale system set up for this buisness
            </p>
          </div>
        )}
      </div>
    </div>
  );

  function clearSettings() {
    setAddedItems([]);
    setBoltzInvoice("");
    setBoltzLoadingAnimation("");
    setDidReceiveBoltzPayment(null);
    setChargeAmount("");
    setBoltzSwapClaimInfo({});
  }

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
    setBoltzLoadingAnimation("Generating invoice");

    const claimInfo = await reverseSwap(
      { amount: convertedSatAmount, descriptoin: "" },
      process.env.REACT_APP_ENVIRONMENT === "testnet"
        ? process.env.REACT_APP_LIQUID_TESTNET_ADDRESS
        : hasAccount.receiveAddress,
      setDidReceiveBoltzPayment,
      setBoltzInvoice,
      username,
      setBoltzLoadingAnimation
    );
    setBoltzSwapClaimInfo(claimInfo);
  }
}

export default POSPage;
