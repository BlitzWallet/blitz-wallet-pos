import { PAYMENT_DESCRIPTION } from "../../constants";

export default function formatLiquidAddress(liquidAddress, convertedSatAmount) {
  if (!liquidAddress || !convertedSatAmount) return "";
  return `${
    process.env.VITE_ENVIRONMENT === "testnet"
      ? "liquidtestnet:"
      : "liquidnetwork:"
  }${
    process.env.VITE_ENVIRONMENT === "testnet"
      ? process.env.VITE_LIQUID_TESTNET_ADDRESS
      : liquidAddress
  }?amount=${(convertedSatAmount / 100000000).toFixed(8)}&assetid=${
    process.env.VITE_ENVIRONMENT === "testnet"
      ? "144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49"
      : "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d"
  }&message=${encodeURI(PAYMENT_DESCRIPTION)}`;
}
