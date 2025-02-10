export default async function getBitcoinPrice({ denomination }) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${denomination.toLowerCase()}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": process.env.REACT_APP_COINGECKO_API,
        },
      }
    );
    const data = await response.json();
    console.log("bitcoin price denomination", denomination);
    const bitcoinPrice = data.bitcoin[denomination.toLowerCase()];
    return bitcoinPrice;
  } catch (err) {
    console.log("get bitcoin price error", err);
    return 90000;
  }
}
