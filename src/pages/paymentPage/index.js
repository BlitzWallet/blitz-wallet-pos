import QRCode from "qrcode.react";
import Popup from "reactjs-popup";
import CopyToCliboardPopup from "../../components/popup";
import { useEffect, useMemo, useRef, useState } from "react";
import getLiquidAddressInfo from "../../functions/lookForLiquidPayment";
import getCurrentUser from "../../hooks/getCurrnetUser";
import PosNavbar from "../../components/nav";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../../contexts/posContext";
import { reverseSwap } from "../../functions/handleClaim";
import formatLiquidAddress from "./formatLiquidAddress";
import FullLoadingScreen from "../../components/loadingScreen.js";
import "./style.css";
import fetchFunction from "../../functions/fetchFunction.js";
import { hasTwentySecondsPassed } from "../../functions/time.js";
import lookForPaidPayment, {
  createSparkWallet,
  receiveSparkLightningPayment,
  sparkWallet,
} from "../../functions/spark.js";
import useWindowFocus from "../../hooks/isWindowFocused.js";
import usePageVisibility from "../../hooks/isTabFocused.js";
export default function PaymentPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isWindowFocused = useWindowFocus();
  const isTabFocused = usePageVisibility();
  const { satAmount, tipAmountSats } = location.state;
  const convertedSatAmount = satAmount + tipAmountSats;
  const { currentUserSession, serverName } = useGlobalContext();
  const [liquidAdress, setLiquidAdress] = useState("");
  const [sparkAddress, setSparkAddress] = useState("");
  const [boltzLoadingAnimation, setBoltzLoadingAnimation] = useState("");
  const [boltzSwapClaimInfo, setBoltzSwapClaimInfo] = useState({});
  const didRunSparkInvoiceGeneration = useRef(null);
  const isUsingSpark = !!currentUserSession.account.sparkPubKey;
  const boltzInvoice = isUsingSpark
    ? sparkAddress
    : boltzSwapClaimInfo?.createdResponse?.invoice || "";
  const formatedLiquidAddress = formatLiquidAddress(
    liquidAdress,
    convertedSatAmount
  );
  const intervalRef = useRef(null);
  const didRunInvoiceLoad = useRef(false);
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState("lightning");

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

    runLookupForPayment();

    const intervalId = setInterval(() => {
      runLookupForPayment();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isTabFocused, isWindowFocused, sparkAddress]);

  useEffect(() => {
    if (!isUsingSpark) return;
    if (didRunSparkInvoiceGeneration.current) return;
    didRunSparkInvoiceGeneration.current = true;

    async function getSparkInvoice() {
      await createSparkWallet();
      // remove all listeners
      const invoice = await receiveSparkLightningPayment({
        amountSats: convertedSatAmount,
        receiverIdentityPubkey: currentUserSession.account.sparkPubKey,
      });

      setSparkAddress(invoice.invoice.encodedInvoice);
    }
    getSparkInvoice();
  }, []);

  useEffect(() => {
    if (isUsingSpark) return;
    const addressList = currentUserSession?.account?.addressesArray;
    if (addressList) {
      const arrayLength = addressList.length - 1;
      const randomNum = Math.round(Math.random() * arrayLength);

      setLiquidAdress(addressList[randomNum]);
    } else setLiquidAdress(currentUserSession?.account?.receiveAddress);
  }, []);

  useEffect(() => {
    if (isUsingSpark) return;
    async function handleInvoice() {
      const claimInfo = await reverseSwap(
        { amount: convertedSatAmount },
        process.env.REACT_APP_ENVIRONMENT === "testnet"
          ? process.env.REACT_APP_LIQUID_TESTNET_ADDRESS
          : liquidAdress,
        handleConfirmation,
        claimObject,
        setBoltzLoadingAnimation,
        clearIntervalRef
      );
      setBoltzSwapClaimInfo(claimInfo);
    }
    if (!liquidAdress && process.env.REACT_APP_ENVIRONMENT !== "testnet")
      return;
    if (didRunInvoiceLoad.current) return;
    didRunInvoiceLoad.current = true;

    handleInvoice();
  }, [liquidAdress]);

  useEffect(() => {
    if (isUsingSpark) return;
    if (!Object.keys(boltzSwapClaimInfo).length) return;
    const startTime = new Date().getTime() + 1000 * 10;
    let initialMempoolTxCount = null;

    async function handleLiquidClaim() {
      const intervalTime = new Date().getTime();
      console.log("Looking for transaction....");
      let liquidAddressInfo = await getLiquidAddressInfo({
        address:
          process.env.REACT_APP_ENVIRONMENT === "testnet"
            ? process.env.REACT_APP_LIQUID_TESTNET_ADDRESS
            : liquidAdress,
      });
      console.log(liquidAddressInfo.length, "Current mempool tx count");
      console.log(initialMempoolTxCount, "Initial mempool tx count");
      console.log(
        hasTwentySecondsPassed(startTime, intervalTime),
        "has 20 seconds passed"
      );
      if (
        initialMempoolTxCount === null ||
        !hasTwentySecondsPassed(startTime, intervalTime)
      ) {
        initialMempoolTxCount = liquidAddressInfo.length;
        return;
      }

      if (liquidAddressInfo.length > initialMempoolTxCount) {
        clearInterval(intervalRef.current);
        handleConfirmation(true, claimObject);
      }
    }
    intervalRef.current = setInterval(handleLiquidClaim, 10000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [boltzSwapClaimInfo]);

  if (!isUsingSpark && !Object.keys(boltzSwapClaimInfo).length) {
    return <FullLoadingScreen text="Generating Invoice" />;
  }
  if (isUsingSpark && !sparkAddress) {
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
            <p style={{ textTransform: "capitalize" }}>
              {selectedPaymentOption}
            </p>
            <Popup
              trigger={
                <button className="PaymentPage-QRcontainer">
                  <div className="PaymentPage-QRPadding">
                    <QRCode
                      size={220}
                      value={
                        selectedPaymentOption === "lightning"
                          ? isUsingSpark
                            ? sparkAddress
                            : boltzSwapClaimInfo.createdResponse.invoice
                          : formatedLiquidAddress
                      }
                      renderAs="canvas"
                    />
                  </div>
                </button>
              }
              modal
            >
              {(close) => (
                <CopyToCliboardPopup
                  content={
                    selectedPaymentOption === "lightning"
                      ? isUsingSpark
                        ? sparkAddress
                        : boltzInvoice
                      : formatedLiquidAddress
                  }
                  close={close}
                />
              )}
            </Popup>

            <div className="QR-OptionsContainer">
              <button
                onClick={() => {
                  navigate(`/${user}`, { replace: true });
                }}
                className="QR-Option"
              >
                Edit
              </button>
              <Popup
                trigger={<button className="QR-Option">Copy</button>}
                modal
              >
                {(close) => (
                  <CopyToCliboardPopup
                    content={
                      selectedPaymentOption === "lightning"
                        ? isUsingSpark
                          ? sparkAddress
                          : boltzInvoice
                        : formatedLiquidAddress
                    }
                    close={close}
                  />
                )}
              </Popup>
            </div>
            {/* <Popup
              trigger={
                <button className="QR-OptionNoFill QR-Option">
                  Choose format
                </button>
              }
              modal
            >
              {(close) => (
                <ChangeSelectedReceiveOptionPopup
                  close={close}
                  setSelectedPaymentOption={setSelectedPaymentOption}
                  selectedPaymentOption={selectedPaymentOption}
                />
              )}
            </Popup> */}
          </div>
        )}
      </div>
    </div>
  );
  function clearIntervalRef() {
    clearInterval(intervalRef.current);
  }
  async function handleConfirmation(result, claimObject) {
    console.log(result, "save response");

    if (result) {
      await fetchFunction("/addTxActivity", claimObject, "post");
      navigate(`/${user}/confirmed`);
    } else setBoltzLoadingAnimation("Error receiving payment");
  }
}
