const liquidMainnet = "https://blockstream.info/liquid/api/";
const liquidTestnet = "https://blockstream.info/liquidtestnet/api/";

export default async function getLiquidAddressInfo({ address }) {
  try {
    const response = await fetch(
      `${
        process.env.VITE_ENVIRONMENT === "testnet"
          ? liquidTestnet
          : liquidMainnet
      }address/${address}/txs`,
    );

    return await response.json();
  } catch (err) {
    console.log("fetch liquid address info error:", err);
    return false;
  }
}
