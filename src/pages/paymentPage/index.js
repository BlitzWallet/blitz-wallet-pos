import QRCode from "qrcode.react";
import "./style.css";
import Popup from "reactjs-popup";
import CopyToCliboardPopup from "../../components/popup";
import { useEffect, useRef, useState } from "react";
import ChangeSelectedReceiveOptionPopup from "../../components/popup/changeSelectedReceiveOption";
import getLiquidAddressInfo from "../../functions/lookForLiquidPayment";

export default function PaymentPage({
  liquidAdress,
  boltzAddress,
  setBoltzInvoice,
  setBoltzLoadingAnimation,
  setDidReceiveBoltzPayment,
  convertedSatAmount,
}) {
  const formatedLiquidAddress = `${
    process.env.REACT_APP_ENVIRONMENT === "testnet"
      ? "liquidtestnet:"
      : "liquidnetwork:"
  }${
    process.env.REACT_APP_ENVIRONMENT === "testnet"
      ? process.env.REACT_APP_LIQUID_TESTNET_ADDRESS
      : liquidAdress
  }?amount=${(convertedSatAmount / 100000000).toFixed(8)}&assetid=${
    process.env.REACT_APP_ENVIRONMENT === "testnet"
      ? "144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49"
      : "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d"
  }`;
  const intervalRef = useRef(null);
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
  return (
    <div className="PaymentPage-Container">
      <p>{selectedPaymentOption}</p>
      <Popup
        trigger={
          <button className="PaymentPage-QRcontainer">
            <div className="PaymentPage-QRPadding">
              <QRCode
                size={220}
                value={
                  selectedPaymentOption === "lightning"
                    ? boltzAddress
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
                ? boltzAddress
                : formatedLiquidAddress
            }
            close={close}
          />
        )}
      </Popup>

      <div className="QR-OptionsContainer">
        <button onClick={() => setBoltzInvoice("")} className="QR-Option">
          Edit
        </button>
        <Popup trigger={<button className="QR-Option">Copy</button>} modal>
          {(close) => (
            <CopyToCliboardPopup
              content={
                selectedPaymentOption === "lightning"
                  ? boltzAddress
                  : formatedLiquidAddress
              }
              close={close}
            />
          )}
        </Popup>
      </div>
      <Popup
        trigger={
          <button className="QR-OptionNoFill QR-Option">Choose format</button>
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
      </Popup>
    </div>
  );
}
