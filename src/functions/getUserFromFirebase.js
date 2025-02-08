export async function setupSession(wantedName) {
  const response = await fetch(`${getBackendURL()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      storeName: wantedName,
    }),
  });

  const data = await response.json();

  if (response.status !== 200) throw new Error(data?.error || "BAD REQUEST");
  return { posData: data.posData, bitcoinPrice: data.bitcoinData };
}
function getBackendURL() {
  if (process.env.REACT_APP_ENVIRONMENT === "testnet") {
    console.log("Running in development mode");
    return process.env.REACT_APP_NETLIFY_BACKEND_DEV;
  } else if (process.env.REACT_APP_ENVIRONMENT === "liquid") {
    console.log("Running in production mode");
    return process.env.REACT_APP_NETLIFY_BACKEND_PROD;
  } else {
    console.log("Unknown environment:", process.env.REACT_APP_ENVIRONMENT);
  }
}
