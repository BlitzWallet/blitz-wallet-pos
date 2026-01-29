import QRCode from "qrcode.react";
import Popup from "reactjs-popup";
import CopyToCliboardPopup from "../../components/popup/index.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import getCurrentUser from "../../hooks/getCurrnetUser.js";
import PosNavbar from "../../components/nav/index.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../../contexts/posContext.jsx";
import FullLoadingScreen from "../../components/loadingScreen.js/index.jsx";
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
import PaymentMethodSelector from "../../components/paymentSelector/index.jsx";
import { createStablecoinToLightningSwap } from "../../functions/lendaswap.js";
import {
  monitorSwapStatus,
  getStatusMessage,
} from "../../functions/lendaswapUtils.js";
import { useLendaSwap } from "../../contexts/lendaswapContext.jsx";

/**
 * Build an EIP-681 payment URI for ERC20 token transfers.
 * When scanned by MetaMask or other EIP-681 wallets, this triggers
 * an ERC20 transfer() call — not a native ETH/MATIC send.
 *
 * Format: ethereum:<tokenAddress>@<chainId>/transfer?address=<recipient>&uint256=<amount>
 *
 * @param {string} tokenAddress - ERC20 token contract address
 * @param {string} recipientAddress - Address to receive the tokens (HTLC contract)
 * @param {number|string} amount - Amount in human-readable units (e.g. 0.85698)
 * @param {number} decimals - Token decimals (6 for USDC/USDT)
 * @param {string} network - "polygon" or "ethereum"
 * @returns {string} EIP-681 URI
 */
function buildERC20PaymentURI(
  tokenAddress,
  recipientAddress,
  amount,
  decimals,
  network,
) {
  const chainId = network === "polygon" ? 137 : 1;
  // Convert human-readable amount to base units (e.g. 0.85698 * 10^6 = 856980)
  const amountBigInt = BigInt(Math.round(parseFloat(amount) * 10 ** decimals));

  return `ethereum:${tokenAddress}@${chainId}/transfer?address=${recipientAddress}&uint256=${amountBigInt}`;
}

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

export default function EnhancedPaymentPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { ethersAddress } = useLendaSwap();
  const isWindowFocused = useWindowFocus();
  const isTabFocused = usePageVisibility();
  const INVOICE_EXPIRY_SECONDS = 300;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { satAmount, tipAmountSats } = location.state || {};
  const convertedSatAmount = satAmount + tipAmountSats;
  const { currentUserSession, serverName, currentSettings, dollarSatValue } =
    useGlobalContext();

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({
    id: "lightning",
    name: "BTC",
    network: "bitcoin",
    description: "Lightning network",
    disabledReason: "Lightning not configured",
  });
  const [paymentAddress, setPaymentAddress] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [invoiceGeneratedTime, setInvoiceGeneratedTime] = useState(null);
  const [swapStatus, setSwapStatus] = useState(null);
  const [stablecoinAmount, setStablecoinAmount] = useState(null);

  const didRunPaymentGeneration = useRef(null);
  const monitorCleanup = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const claimObject = useMemo(
    () => ({
      storeName: user,
      tx: {
        tipAmountSats,
        orderAmountSats: satAmount,
        serverName,
        time: new Date().getTime(),
        paymentMethod: selectedPaymentMethod.id,
      },
      bitcoinPrice: currentUserSession?.bitcoinPrice || 0,
    }),
    [selectedPaymentMethod],
  );

  // Monitor Lightning payments
  const runLookupForPayment = async () => {
    if (!sparkWallet || selectedPaymentMethod.id !== "lightning") return;
    const wasPaid = await lookForPaidPayment(convertedSatAmount);
    if (wasPaid) {
      handleConfirmation(true, claimObject);
    }
  };

  useEffect(() => {
    if (!paymentAddress || selectedPaymentMethod.id !== "lightning") return;
    if (!isWindowFocused || !isTabFocused) return;
    if (Date.now() - invoiceGeneratedTime > INVOICE_EXPIRY_SECONDS * 1000)
      return;

    runLookupForPayment();
    const intervalId = setInterval(runLookupForPayment, 5000);
    return () => clearInterval(intervalId);
  }, [
    isTabFocused,
    isWindowFocused,
    paymentAddress,
    invoiceGeneratedTime,
    selectedPaymentMethod,
  ]);

  // Generate payment based on selected method
  useEffect(() => {
    if (didRunPaymentGeneration.current) return;
    if (!selectedPaymentMethod) return;

    didRunPaymentGeneration.current = true;
    generatePayment();
  }, [selectedPaymentMethod.id]);

  const generatePayment = async () => {
    try {
      if (selectedPaymentMethod.id === "lightning") {
        await generateLightningInvoice();
      } else {
        await generateStablecoinSwap();
      }
    } catch (err) {
      console.error("Error generating payment:", err);
      setLoadingMessage("Error generating payment. Please try again.");
    }
  };

  const generateLightningInvoice = async () => {
    if (!currentUserSession.account?.sparkPubKey) return;

    setLoadingMessage("Generating Lightning invoice");
    await createSparkWallet();

    const invoice = await receiveSparkLightningPayment({
      amountSats: convertedSatAmount,
      receiverIdentityPubkey: currentUserSession.account?.sparkPubKey,
    });

    setPaymentAddress(invoice.invoice.encodedInvoice);
    setPaymentData(invoice);
    setInvoiceGeneratedTime(Date.now());
    setLoadingMessage("");
  };

  const generateStablecoinSwap = async () => {
    setLoadingMessage("Creating swap...");

    try {
      // Ensure Spark wallet is initialized
      await createSparkWallet();

      // Create Lightning invoice for the merchant to receive sats
      const invoice = await receiveSparkLightningPayment({
        amountSats: convertedSatAmount,
        receiverIdentityPubkey: currentUserSession.account?.sparkPubKey,
      });

      // Create the LendaSwap swap (stablecoin -> Lightning)
      const swap = await createStablecoinToLightningSwap({
        bolt11Invoice: invoice.invoice.encodedInvoice,
        userAddress: ethersAddress,
        sourceToken: selectedPaymentMethod.id,
        sourceNetwork: selectedPaymentMethod.network,
      });

      console.log("Swap created:", swap);
      console.log("HTLC address:", swap.htlc_address_evm);
      console.log("Amount customer must send:", swap.sourceAmount);

      setPaymentData(swap);
      // sourceAmount is already human-readable (e.g. "0.85698")
      const displayAmount = String(swap.sourceAmount);
      setStablecoinAmount(displayAmount);

      // Build EIP-681 URI so MetaMask triggers an ERC20 transfer() when scanned
      const paymentURI = buildERC20PaymentURI(
        swap.source_token_address,
        swap.htlc_address_evm,
        displayAmount,
        6, // USDC/USDT decimals
        selectedPaymentMethod.network,
      );
      console.log("Payment URI:", paymentURI);
      setPaymentAddress(paymentURI);
      setLoadingMessage("");

      // Start monitoring swap status — the customer sends directly to the HTLC
      monitorCleanup.current = monitorSwapStatus(
        swap.swapId,
        handleSwapStatusUpdate,
      );
    } catch (err) {
      console.error("Error creating stablecoin swap:", err);
      setLoadingMessage("Failed to create swap. Please try again.");
    }
  };

  const handleSwapStatusUpdate = ({ response: swap }) => {
    setSwapStatus(swap);
    const s = swap.status;

    console.log(`[Payment] Swap status update: ${s}`);

    // Success states: ServerRedeemed (7) means the server claimed our HTLC
    // and paid the Lightning invoice — the merchant got paid
    if (s === 6 || s === 7) {
      handleConfirmation(true, claimObject);
    }
    // Failure states
    else if (
      s === 3 || // ClientRefunded
      s === 11 || // Expired
      s === 8 || // ClientFundedServerRefunded
      s === 12 || // ClientInvalidFunded
      s === 13 // ClientFundedTooLate
    ) {
      setLoadingMessage("Swap failed or expired. Please try again.");
    }
  };

  // Cleanup monitor on unmount
  useEffect(() => {
    return () => {
      if (monitorCleanup.current) {
        monitorCleanup.current();
      }
    };
  }, []);

  const handleConfirmation = async (result, claimObject) => {
    if (result) {
      await fetchFunction("/addTxActivity", claimObject, "post");
      navigate(`/${user}/confirmed`);
    } else {
      setLoadingMessage("Error receiving payment");
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    // Reset state
    setPaymentAddress("");
    setPaymentData(null);
    setInvoiceGeneratedTime(null);
    setSwapStatus(null);
    setStablecoinAmount(null);
    didRunPaymentGeneration.current = false;

    if (monitorCleanup.current) {
      monitorCleanup.current();
      monitorCleanup.current = null;
    }
    console.log(method);

    setSelectedPaymentMethod(method);
  };

  if (!currentUserSession.account) {
    return (
      <div className="stale-state-container">
        <div className="stale-state-content">
          <p className="stale-state-text">
            Your session has timed out. Please log back in.
          </p>
          <button
            onClick={() => navigate("../")}
            className="stale-state-button"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loadingMessage && !paymentAddress) {
    return (
      <div className="stale-state-content">
        <FullLoadingScreen text={loadingMessage} />
        <button onClick={() => navigate("../")} className="stale-state-button">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="PaymentPage-Container-globalOuter">
      <PosNavbar backFunction={() => navigate(-1)} />
      <div className="PaymentPage-Container-globalInner">
        <div className="PaymentPage-Container">
          {/* Total Amount */}
          <h1 className="balance-text" style={{ textTransform: "capitalize" }}>
            {formatBalanceAmount(
              displayCorrectDenomination({
                amount: !currentSettings?.displayCurrency?.isSats
                  ? (convertedSatAmount / dollarSatValue).toFixed(2)
                  : convertedSatAmount.toFixed(0),
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              }),
            )}
          </h1>

          <p className="alt-amount">
            {formatBalanceAmount(
              displayCorrectDenomination({
                amount: currentSettings?.displayCurrency?.isSats
                  ? (convertedSatAmount / dollarSatValue).toFixed(2)
                  : convertedSatAmount.toFixed(0),
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: !currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              }),
            )}
          </p>

          {/* Payment Method Selector */}
          {!paymentAddress && (
            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod.id}
              onSelect={handlePaymentMethodChange}
              currentUserSession={currentUserSession}
            />
          )}

          {/* Payment QR Code */}
          {paymentAddress && (
            <>
              <p className="PaymentPage-Instruction">
                {selectedPaymentMethod.id === "lightning"
                  ? "Scan to Pay via Lightning"
                  : `Scan to Pay via ${selectedPaymentMethod.name.toUpperCase()}`}
              </p>

              <Popup
                trigger={
                  <button className="PaymentPage-QRcontainer">
                    <QRCode
                      size={Math.min(windowWidth * 0.8, 260)}
                      value={paymentAddress}
                      renderAs="canvas"
                    />
                  </button>
                }
                modal
              >
                {(close) => (
                  <CopyToCliboardPopup
                    content={
                      selectedPaymentMethod.id !== "lightning" && paymentData
                        ? paymentData.htlc_address_evm
                        : paymentAddress
                    }
                    close={close}
                  />
                )}
              </Popup>

              {/* Stablecoin amount to send */}
              {stablecoinAmount && selectedPaymentMethod.id !== "lightning" && (
                <div className="stablecoin-amount-display">
                  <p>Send exactly:</p>
                  <p className="amount">
                    {stablecoinAmount} {selectedPaymentMethod.name}
                  </p>
                  <p>on {selectedPaymentMethod.network}</p>
                </div>
              )}

              {/* Swap Status */}
              {swapStatus && selectedPaymentMethod.id !== "lightning" && (
                <div className="swap-status">
                  <p className="swap-status-text">
                    {getStatusMessage(swapStatus.status)}
                  </p>
                </div>
              )}

              {/* Timer */}
              {selectedPaymentMethod.id === "lightning" && (
                <InvoiceTimer
                  expirySeconds={
                    INVOICE_EXPIRY_SECONDS -
                    Math.floor((Date.now() - invoiceGeneratedTime) / 1000)
                  }
                />
              )}

              {/* Change Payment Method */}
              <button
                onClick={() => handlePaymentMethodChange(selectedPaymentMethod)}
                className="change-payment-method-btn"
              >
                Change Payment Method
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
