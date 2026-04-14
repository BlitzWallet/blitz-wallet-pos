import QRCode from "qrcode.react";
import { useCopyToast } from "../../contexts/copyToast";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
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
} from "../../functions/spark.js";
import { formatBalanceAmount } from "../../functions/formatNumber.js";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination.js";
import dollarIcon from "../../assets/dollarIcon.png";
import bitcoinIcon from "../../assets/bitcoinIcon.png";
import { addSwapToHistory } from "../../functions/swapHistory.js";
import { useErrorDisplay } from "../../contexts/errorDisplay.js";
import EnterServerName from "../../components/popup/enterServerName.js";
import NetworkSelectSheet from "../../components/popup/NetworkSelectSheet.js";
import { useTranslation } from "react-i18next";

// ─── Module-level constants (no recreations on render) ───────────────────────

const NETWORK_LABELS = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  base: "Base",
  solana: "Solana",
  tron: "Tron",
};

// ─── PillToggle — memoised; only re-renders when value/onChange change ────────

const PillToggle = memo(function PillToggle({ value, onChange }) {
  const { t } = useTranslation();
  const isUsd = value === "stablecoin";
  return (
    <button
      className={`pill-toggle${isUsd ? " pill-toggle--usd" : ""}`}
      onClick={() => onChange(isUsd ? "btc" : "stablecoin")}
      aria-label={t(`payment.switchPaymentMode`, {
        mode: isUsd ? "BTC" : "USD",
      })}
    >
      <span className="pill-toggle__indicator" />
      <img src={bitcoinIcon} alt="BTC" className="pill-toggle__icon" />
      <img src={dollarIcon} alt="USD" className="pill-toggle__icon" />
    </button>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { showError } = useErrorDisplay();
  const { showCopyToast } = useCopyToast();
  const { t } = useTranslation();

  const { satAmount, tipAmountSats } = location.state || {};
  const convertedSatAmount = satAmount + tipAmountSats; // stable — from location.state

  const { currentUserSession, serverName, currentSettings, dollarSatValue } =
    useGlobalContext();

  // ── Stable dollar amount (inputs never change during page lifetime) ──
  const dollarAmount = useMemo(
    () => (convertedSatAmount / dollarSatValue).toFixed(2),
    [convertedSatAmount, dollarSatValue],
  );

  // ── UI state ──────────────────────────────────────────────────────────
  const [sparkAddress, setSparkAddress] = useState("");
  const [paymentMode, setPaymentMode] = useState("btc");
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [stablecoinAddress, setStablecoinAddress] = useState(null);
  const [stablecoinDisplayAmount, setStablecoinDisplayAmount] = useState(null);
  const [stablecoinLoading, setStablecoinLoading] = useState(false);
  const [showServerNamePopup, setShowServerNamePopup] = useState(false);

  // ── Refs — hold latest values for use inside intervals without stale closures ──
  const bitcoinPollRef = useRef(null);
  const stablecoinPollRef = useRef(null);
  const didRunSparkInvoiceGeneration = useRef(false);
  const paylinkId = useRef(null);

  // Mirror mutable state into refs so interval callbacks always see current values
  const paymentModeRef = useRef(paymentMode);
  const stablecoinAddressRef = useRef(stablecoinAddress);
  const sparkAddressRef = useRef(sparkAddress);
  // These need to be readable inside the stablecoin interval without stale closure
  const selectedTokenRef = useRef(selectedToken);
  const selectedNetworkRef = useRef(selectedNetwork);

  useEffect(() => {
    paymentModeRef.current = paymentMode;
  }, [paymentMode]);
  useEffect(() => {
    stablecoinAddressRef.current = stablecoinAddress;
  }, [stablecoinAddress]);
  useEffect(() => {
    sparkAddressRef.current = sparkAddress;
  }, [sparkAddress]);
  useEffect(() => {
    selectedTokenRef.current = selectedToken;
  }, [selectedToken]);
  useEffect(() => {
    selectedNetworkRef.current = selectedNetwork;
  }, [selectedNetwork]);

  // ── Window resize ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Stable claimObject — inputs are stable for the page lifetime ──────
  const claimObject = useMemo(
    () => ({
      storeName: user,
      skipSaving: !serverName,
      tx: {
        tipAmountSats,
        orderAmountSats: satAmount,
        serverName,
        time: new Date().getTime(),
      },
      bitcoinPrice: currentUserSession?.bitcoinPrice || 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally stable — these values don't change during the page lifetime
  );

  // ── clearIntervals — stops ALL polling; safe to call multiple times ───
  const clearIntervals = useCallback(() => {
    if (bitcoinPollRef.current) {
      clearInterval(bitcoinPollRef.current);
      bitcoinPollRef.current = null;
    }
    if (stablecoinPollRef.current) {
      clearInterval(stablecoinPollRef.current);
      stablecoinPollRef.current = null;
    }
  }, []);

  // ── Cleanup on unmount — prevents interval leaks on back navigation ───
  useEffect(() => {
    return () => clearIntervals();
  }, [clearIntervals]);

  // ── resetStablecoinState ──────────────────────────────────────────────
  const resetStablecoinState = useCallback(() => {
    setSelectedToken(null);
    setSelectedNetwork(null);
    setStablecoinAddress(null);
    setStablecoinDisplayAmount(null);
    setStablecoinLoading(false);

    setShowNetworkModal(false);
    paylinkId.current = null;
    // Sync refs immediately so focus-effect guards work before state flushes
    stablecoinAddressRef.current = null;
    selectedTokenRef.current = null;
    selectedNetworkRef.current = null;
    clearIntervals();
  }, [clearIntervals]);

  // ── Debounce helper (module-level, no deps) ───────────────────────────
  function useDebounce(fn, delay) {
    const timerRef = useRef(null);
    return useCallback(
      (...args) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          fn(...args);
        }, delay);
      },
      [fn, delay],
    );
  }

  // ── BTC poller ────────────────────────────────────────────────────────
  // No dep on sparkAddress state — reads the ref inside the callback instead.
  const runLookupForPayment = useCallback(() => {
    // Always clear any existing BTC poller first
    if (bitcoinPollRef.current) {
      clearInterval(bitcoinPollRef.current);
      bitcoinPollRef.current = null;
    }

    bitcoinPollRef.current = setInterval(async () => {
      // Guard: only poll when we are still in BTC mode
      if (paymentModeRef.current !== "btc") {
        clearInterval(bitcoinPollRef.current);
        bitcoinPollRef.current = null;
        return;
      }

      const wasPaid = await lookForPaidPayment(convertedSatAmount);
      if (wasPaid) {
        clearInterval(bitcoinPollRef.current);
        bitcoinPollRef.current = null;
        await fetchFunction("/addTxActivity", claimObject, "post");
        navigate(`/${user}/confirmed`);
      }
    }, 5_000);
  }, [claimObject, convertedSatAmount, navigate, user]);

  // ── Stablecoin poller ─────────────────────────────────────────────────
  const runLookupForStablecoinPayment = useCallback(() => {
    // Must have a paylinkId to poll against
    if (!paylinkId.current) return;

    // Always clear any existing stablecoin poller first
    if (stablecoinPollRef.current) {
      clearInterval(stablecoinPollRef.current);
      stablecoinPollRef.current = null;
    }

    let pollCount = 0;
    const MAX_POLLS = 200;

    stablecoinPollRef.current = setInterval(async () => {
      // Guard: only poll when still in stablecoin mode
      if (paymentModeRef.current !== "stablecoin") {
        clearInterval(stablecoinPollRef.current);
        stablecoinPollRef.current = null;
        return;
      }

      pollCount++;
      if (pollCount > MAX_POLLS) {
        clearInterval(stablecoinPollRef.current);
        stablecoinPollRef.current = null;
        return;
      }

      try {
        const result = await fetchFunction(
          "/getPOSPaylinkData",
          { paylinkId: paylinkId.current, checkInvoice: true },
          "post",
        );

        if (result?.data?.isPaid) {
          clearInterval(stablecoinPollRef.current);
          stablecoinPollRef.current = null;

          // Read token/network from refs — avoids stale closure over state
          const stablecoinClaimObject = {
            storeName: user,
            skipSaving: !serverName,
            tx: {
              tipAmountSats,
              orderAmountSats: satAmount,
              serverName,
              time: new Date().getTime(),
              paymentType: "stablecoin",
              stablecoinToken: selectedTokenRef.current,
              stablecoinNetwork: selectedNetworkRef.current,
            },
            bitcoinPrice: currentUserSession?.bitcoinPrice || 0,
          };

          await fetchFunction("/addTxActivity", stablecoinClaimObject, "post");
          navigate(`/${user}/confirmed`);
        }
      } catch (_) {
        // Silently ignore transient poll errors; keep polling.
      }
    }, 10_000);
  }, [
    currentUserSession,
    navigate,
    satAmount,
    serverName,
    tipAmountSats,
    user,
  ]);

  // ── Invoice generation ────────────────────────────────────────────────
  const generateStablecoinInvoice = useCallback(
    async (network, token) => {
      setStablecoinLoading(true);
      try {
        const newPaylinkId = crypto.randomUUID();
        paylinkId.current = newPaylinkId;

        const result = await fetchFunction(
          "/createPOSInvoice",
          {
            paylinkId: newPaylinkId,
            sparkPubKey: currentUserSession.account.sparkPubKey,
            network,
            currency: token,
            fiatAmount: dollarAmount,
            fiatCode: currentUserSession.account.storeCurrency || "USD",
          },
          "post",
        );

        if (!result || result.status !== "SUCCESS") {
          throw new Error(result?.message || "Failed to create invoice");
        }

        addSwapToHistory({
          quoteId: result.quoteId,
          depositAddress: result.depositAddress,
          network,
          currency: token,
          amountIn: result.amountIn,
          dateAdded: new Date().toISOString(),
        });

        const displayAmt = result.amountIn
          ? (Number(result.amountIn) / 1_000_000).toFixed(2)
          : dollarAmount;

        // Update ref immediately so the focus-effect guard works before state flushes
        stablecoinAddressRef.current = result.depositAddress;
        setStablecoinAddress(result.depositAddress);
        setStablecoinDisplayAmount(displayAmt);

        // Start polling only after we have a valid address + paylinkId
        runLookupForStablecoinPayment();
      } catch (err) {
        showError(err.message || t("payment.error"));
        // Reset mode back to BTC so the UI isn't stuck on a blank stablecoin screen
        setPaymentMode("btc");
        paymentModeRef.current = "btc";
      } finally {
        setStablecoinLoading(false);
      }
    },
    [
      currentUserSession,
      dollarAmount,
      runLookupForStablecoinPayment,
      showError,
    ],
  );

  // ── Spark invoice generation (runs once on mount) ─────────────────────
  useEffect(() => {
    if (didRunSparkInvoiceGeneration.current) return;
    if (!currentUserSession.account?.sparkPubKey) return;
    didRunSparkInvoiceGeneration.current = true;

    async function getSparkInvoice() {
      await createSparkWallet();

      const invoice = await receiveSparkLightningPayment({
        amountSats: convertedSatAmount,
        receiverIdentityPubkey: currentUserSession.account.sparkPubKey,
      });

      if (!invoice) {
        showError(t("payment.invoiceError"));
        return;
      }

      const encodedInvoice = invoice.invoice.encodedInvoice;
      // Update ref immediately before state flush
      sparkAddressRef.current = encodedInvoice;
      setSparkAddress(encodedInvoice);
      runLookupForPayment();
    }

    getSparkInvoice();
  }, []);

  // ── Mode toggle handler ───────────────────────────────────────────────
  const handleModeChange = useCallback(
    (newMode) => {
      if (newMode === "stablecoin") {
        const usdAmount = currentUserSession?.usdPriceResponse
          ? (convertedSatAmount * currentUserSession.usdPriceResponse) /
            100000000
          : Number(dollarAmount);
        if (usdAmount < 1) {
          showError(t("payment.minimumError"));
          return;
        }
        // Stop BTC polling before switching mode
        clearIntervals();
        resetStablecoinState();
        setPaymentMode("stablecoin");
        paymentModeRef.current = "stablecoin";
        setShowNetworkModal(true);
      } else {
        // Switching back to BTC — stop stablecoin polling, restart BTC polling
        clearIntervals();
        resetStablecoinState();
        setPaymentMode("btc");
        paymentModeRef.current = "btc";
        // Only restart BTC polling if we already have an invoice
        if (sparkAddressRef.current) {
          runLookupForPayment();
        }
      }
    },
    [
      clearIntervals,
      currentUserSession,
      dollarAmount,
      resetStablecoinState,
      runLookupForPayment,
      showError,
    ],
  );

  // ── Network select handler ────────────────────────────────────────────
  const handleNetworkSelect = useCallback(
    (network, token) => {
      setSelectedNetwork(network);
      setSelectedToken(token);
      selectedNetworkRef.current = network;
      selectedTokenRef.current = token;
      setShowNetworkModal(false);
      generateStablecoinInvoice(network, token);
    },
    [generateStablecoinInvoice],
  );

  const handleNetworkClose = useCallback(() => {
    setShowNetworkModal(false);
    // If no network was ever selected, snap back to BTC mode
    if (!selectedNetworkRef.current) {
      setPaymentMode("btc");
      paymentModeRef.current = "btc";
      if (sparkAddressRef.current) runLookupForPayment();
    }
  }, [runLookupForPayment]);

  // ── Guard: stale session or missing amount ────────────────────────────
  if (!currentUserSession.account?.sparkPubKey || !satAmount) {
    return (
      <div className="stale-state-container">
        <div className="stale-state-content">
          <p className="stale-state-text">{t("payment.sessionTimeout")}</p>
          <button
            onClick={() => navigate("../")}
            className="action-button stale-state-button"
          >
            {t("payment.goHome")}
          </button>
        </div>
      </div>
    );
  }

  if ((paymentMode === "btc" && !sparkAddress) || stablecoinLoading) {
    return <FullLoadingScreen />;
  }

  // ── Render ────────────────────────────────────────────────────────────
  const qrSize = Math.min(windowWidth * 0.8, 315);

  return (
    <div className="PaymentPage-Container-globalOuter">
      <PosNavbar
        backFunction={() => {
          resetStablecoinState();
          navigate(-1);
        }}
        openNamePopupFunction={() => setShowServerNamePopup(true)}
        PillToggle={
          <PillToggle value={paymentMode} onChange={handleModeChange} />
        }
      />

      {showServerNamePopup && (
        <EnterServerName setPopupType={() => setShowServerNamePopup(false)} />
      )}

      {showNetworkModal && (
        <NetworkSelectSheet
          onSelect={handleNetworkSelect}
          onClose={handleNetworkClose}
        />
      )}

      <div className="PaymentPage-Container-globalInner">
        {paymentMode === "btc" ? (
          <div className="PaymentPage-Container">
            <div className="payment-content-row">
              <div className="payment-info-col">
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
                    }),
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
                    }),
                  )}
                </p>
              </div>
              <div>
                <button
                  className="PaymentPage-QRcontainer"
                  onClick={() => showCopyToast(sparkAddress)}
                >
                  <QRCode
                    size={qrSize}
                    value={sparkAddress}
                    renderAs="canvas"
                  />
                </button>
                <p className="PaymentPage-Instruction">
                  {t("payment.scanLightning")}
                </p>
              </div>
            </div>
          </div>
        ) : stablecoinAddress ? (
          <div className="stablecoin-qr-screen">
            <div className="payment-content-row">
              <div className="payment-info-col">
                <h1 className="balance-text">${stablecoinDisplayAmount}</h1>
                <p className="alt-amount">
                  {selectedToken} ·{" "}
                  {selectedNetwork ? NETWORK_LABELS[selectedNetwork] : ""}
                </p>
              </div>
              <div>
                <button
                  className="PaymentPage-QRcontainer"
                  onClick={() => showCopyToast(stablecoinAddress)}
                >
                  <QRCode
                    size={qrSize}
                    value={stablecoinAddress}
                    renderAs="canvas"
                  />
                </button>
                <p className="PaymentPage-Instruction">
                  {t("payment.scanStablecoin", {
                    token: selectedToken,
                  })}
                </p>
              </div>
            </div>

            <button
              className="action-button primary change-network-link"
              onClick={() => setShowNetworkModal(true)}
            >
              {t("payment.changeNetwork")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
