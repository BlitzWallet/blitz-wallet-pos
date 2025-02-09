import QRCode from "qrcode.react";
import "./style.css";
import Popup from "reactjs-popup";
import CopyToCliboardPopup from "../../components/popup";
import { useEffect, useRef, useState } from "react";
import ChangeSelectedReceiveOptionPopup from "../../components/popup/changeSelectedReceiveOption";
import getLiquidAddressInfo from "../../functions/lookForLiquidPayment";
import NoAccountRedirect from "../../hooks/redirectWhenNoAccount";
import getCurrentUser from "../../hooks/getCurrnetUser";
import PosNavbar from "../../components/nav";
import { useNavigate } from "react-router-dom";
import ConfirmPaymentScreen from "../../components/confirmScreen/confirmPaymentScreen";
import LoadingAnimation from "../../components/loadingAnimation";
import { useGlobalContext } from "../../contexts/posContext";
import { reverseSwap } from "../../functions/handleClaim";
import { getSendAmount } from "../../hooks/getSendAmount";
import formatLiquidAddress from "./formatLiquidAddress";
import FullLoadingScreen from "../../components/loadingScreen.js";

export default function PaymentPage() {
  const user = getCurrentUser();
  NoAccountRedirect(`../../${user}`);
  const navigate = useNavigate();
  const convertedSatAmount = getSendAmount() || 1000;
  const { currentUserSession } = useGlobalContext();
  const liquidAdress = currentUserSession?.account?.receiveAddress;
  const [boltzLoadingAnimation, setBoltzLoadingAnimation] = useState("");
  const [didReceiveBoltzPayment, setDidReceiveBoltzPayment] = useState(null);
  const [boltzSwapClaimInfo, setBoltzSwapClaimInfo] = useState({});
  const boltzInvoice = boltzSwapClaimInfo?.createdResponse?.invoice || "";
  const formatedLiquidAddress = formatLiquidAddress(
    liquidAdress,
    convertedSatAmount
  );
  const intervalRef = useRef(null);
  const didRunInvoiceLoad = useRef(false);
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState("lightning");

  useEffect(() => {
    if (selectedPaymentOption != "liquid") {
      clearInterval(intervalRef.current);
      return;
    }
    async function handleLiquidClaim() {
      intervalRef.current = setInterval(async () => {
        let liquidAddressInfo = await getLiquidAddressInfo({
          address:
            process.env.REACT_APP_ENVIRONMENT === "testnet"
              ? process.env.REACT_APP_LIQUID_TESTNET_ADDRESS
              : liquidAdress,
        });
        console.log(liquidAddressInfo, "liquid address interval information");

        if (liquidAddressInfo.mempool_stats.tx_count != 0) {
          setBoltzLoadingAnimation("Receiving payment");
          clearInterval(intervalRef.current);
          setDidReceiveBoltzPayment(true);
        }
      }, 2500);
    }
    handleLiquidClaim();
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [selectedPaymentOption]);

  useEffect(() => {
    async function handleInvoice() {
      const claimInfo = await reverseSwap(
        { amount: convertedSatAmount },
        process.env.REACT_APP_ENVIRONMENT === "testnet"
          ? process.env.REACT_APP_LIQUID_TESTNET_ADDRESS
          : liquidAdress,
        setDidReceiveBoltzPayment,
        // setBoltzInvoice,
        // user,
        setBoltzLoadingAnimation
      );
      setBoltzSwapClaimInfo(claimInfo);
    }
    console.log("RUNNING HERE");
    if (!liquidAdress && process.env.REACT_APP_ENVIRONMENT !== "testnet")
      return;
    if (didRunInvoiceLoad.current) return;
    didRunInvoiceLoad.current = true;

    handleInvoice();
  }, [liquidAdress]);

  if (!Object.keys(boltzSwapClaimInfo).length) {
    return <FullLoadingScreen text="Generating Invoice" />;
  }
  return (
    <div className="POS-Container">
      <PosNavbar
        backFunction={() => {
          navigate(`../${user}`);
        }}
      />
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
                          ? boltzSwapClaimInfo.createdResponse.invoice
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
                      ? boltzInvoice
                      : formatedLiquidAddress
                  }
                  close={close}
                />
              )}
            </Popup>

            <div className="QR-OptionsContainer">
              <button
                onClick={() => {
                  navigate(`../${user}`);
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
                        ? boltzInvoice
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
  function clearSettings() {
    navigate(`../${user}`);
  }
}
