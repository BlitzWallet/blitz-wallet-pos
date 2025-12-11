import QRCode from "qrcode.react";
import Popup from "reactjs-popup";
import CopyToCliboardPopup from "../../components/popup";
import { useEffect, useMemo, useRef, useState } from "react";
import getCurrentUser from "../../hooks/getCurrnetUser";
import PosNavbar from "../../components/nav";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../../contexts/posContext";
import FullLoadingScreen from "../../components/loadingScreen.js";
import "./style.css";
import fetchFunction from "../../functions/fetchFunction.js";
import lookForPaidPayment, {
  createSparkWallet,
  receiveSparkLightningPayment,
  sparkWallet,
} from "../../functions/spark.js";
import useWindowFocus from "../../hooks/isWindowFocused.js";
import usePageVisibility from "../../hooks/isTabFocused.js";
import { formatBalanceAmount } from "../../functions/formatNumber.js";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination.js";

// Utility component for the countdown timer
const InvoiceTimer = ({ expirySeconds = 300 }) => {
  const [timeLeft, setTimeLeft] = useState(expirySeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0;

  return (
    <p className={`PaymentPage-Timer ${isExpired ? "expired" : ""}`}>
      {isExpired
        ? "Invoice Expired"
        : `Expires in: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`}
    </p>
  );
};

export default function PaymentPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isWindowFocused = useWindowFocus();
  const isTabFocused = usePageVisibility();
  const INVOICE_EXPIRY_SECONDS = 300;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { satAmount, tipAmountSats } = location.state || {};
  const convertedSatAmount = satAmount + tipAmountSats;
  const { currentUserSession, serverName, currentSettings, dollarSatValue } =
    useGlobalContext();
  const [sparkAddress, setSparkAddress] = useState("");
  const [boltzLoadingAnimation, setBoltzLoadingAnimation] = useState("");
  const didRunSparkInvoiceGeneration = useRef(null);

  const [invoiceGeneratedTime, setInvoiceGeneratedTime] = useState(null);

  const claimObject = useMemo(
    () => ({
      storeName: user,
      tx: {
        tipAmountSats,
        orderAmountSats: satAmount,
        serverName,
        time: new Date().getTime(),
      },
      bitcoinPrice: currentUserSession?.bitcoinPrice || 0,
    }),
    []
  );

  const runLookupForPayment = async () => {
    if (!sparkWallet) return;
    const wasPaid = await lookForPaidPayment(convertedSatAmount);
    if (wasPaid) {
      handleConfirmation(true, claimObject);
    }
  };

  useEffect(() => {
    if (!sparkAddress) return;
    if (!isWindowFocused || !isTabFocused) return;
    if (Date.now() - invoiceGeneratedTime > INVOICE_EXPIRY_SECONDS * 1000)
      return;

    runLookupForPayment();

    const intervalId = setInterval(() => {
      runLookupForPayment();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isTabFocused, isWindowFocused, sparkAddress, invoiceGeneratedTime]);

  useEffect(() => {
    if (didRunSparkInvoiceGeneration.current) return;
    if (!currentUserSession.account?.sparkPubKey) return;
    didRunSparkInvoiceGeneration.current = true;

    async function getSparkInvoice() {
      await createSparkWallet();

      const invoice = await receiveSparkLightningPayment({
        amountSats: convertedSatAmount,
        receiverIdentityPubkey: currentUserSession.account?.sparkPubKey,
      });

      setSparkAddress(invoice.invoice.encodedInvoice);
      setInvoiceGeneratedTime(Date.now());
    }
    getSparkInvoice();
  }, []);

  if (!currentUserSession.account?.sparkPubKey && !satAmount)
    return (
      <div className="stale-state-container">
        <div className="stale-state-content">
          <p className="stale-state-text">
            Your session has timed out, Please log back in.
          </p>
          <button
            onClick={() => {
              navigate("../");
            }}
            className="stale-state-button"
          >
            Go Home
          </button>
        </div>
      </div>
    );

  if (!sparkAddress || !invoiceGeneratedTime) {
    return <FullLoadingScreen text="Generating Invoice" />;
  }

  return (
    <div className="POS-Container">
      <PosNavbar
        backFunction={() => {
          navigate(-1);
        }}
      />
      <div className="POS-ContentContainer">
        {boltzLoadingAnimation ? (
          <FullLoadingScreen text={boltzLoadingAnimation} />
        ) : (
          <div className="PaymentPage-Container">
            {/* 1. Total Amount */}
            <h1
              className="balance-text"
              style={{ textTransform: "capitalize" }}
            >
              {formatBalanceAmount(
                displayCorrectDenomination({
                  amount: !currentSettings?.displayCurrency?.isSats
                    ? (convertedSatAmount / dollarSatValue).toFixed(2)
                    : convertedSatAmount.toFixed(0),
                  fiatCurrency:
                    currentUserSession.account.storeCurrency || "USD",
                  showSats: currentSettings.displayCurrency.isSats,
                  isWord: currentSettings.displayCurrency.isWord,
                })
              )}
            </h1>

            <p className="alt-amount">
              {formatBalanceAmount(
                displayCorrectDenomination({
                  amount: currentSettings?.displayCurrency?.isSats
                    ? (convertedSatAmount / dollarSatValue).toFixed(2)
                    : convertedSatAmount.toFixed(0),
                  fiatCurrency:
                    currentUserSession.account.storeCurrency || "USD",
                  showSats: !currentSettings.displayCurrency.isSats,
                  isWord: currentSettings.displayCurrency.isWord,
                })
              )}
            </p>

            {/* 2. QR Code (wrapped in a copy-trigger) */}
            <p className="PaymentPage-Instruction">Scan to Pay via Lightning</p>
            <Popup
              trigger={
                <button className="PaymentPage-QRcontainer">
                  <QRCode
                    size={Math.min(windowWidth * 0.8, 260)}
                    value={sparkAddress}
                    renderAs="canvas"
                  />
                </button>
              }
              modal
            >
              {(close) => (
                <CopyToCliboardPopup content={sparkAddress} close={close} />
              )}
            </Popup>

            {/* 3. Timer */}
            <InvoiceTimer
              expirySeconds={
                INVOICE_EXPIRY_SECONDS -
                Math.floor((Date.now() - invoiceGeneratedTime) / 1000)
              }
            />
          </div>
        )}
      </div>
    </div>
  );

  async function handleConfirmation(result, claimObject) {
    console.log(result, "save response");

    if (result) {
      await fetchFunction("/addTxActivity", claimObject, "post");
      navigate(`/${user}/confirmed`);
    } else setBoltzLoadingAnimation("Error receiving payment");
  }
}
