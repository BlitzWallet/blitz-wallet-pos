import { getBoltzApiUrl } from "./boltz";

export default async function getBoltzFeeRates() {
  try {
    const response = await (
      await fetch(
        `${getBoltzApiUrl(process.env.VITE_ENVIRONMENT)}/v2/chain/fees`,
      )
    ).json();
    return response["L-BTC"];
  } catch (err) {
    console.log("boltz fee rate fetch error", err);
    return false;
  }
}
