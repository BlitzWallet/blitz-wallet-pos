export async function getSignleContact(wantedName) {
  try {
    const url = `${getBackendURL()}`;
    console.log(url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: process.env.REACT_APP_POS_API_KEY,
        storeName: wantedName,
      }),
    });

    const data = await response.json();

    if (data.status !== "SUCCESS") return;
    return data.data.posSettings;
  } catch (err) {
    console.log(err, "user data fetch error");
  }
}

function getBackendURL() {
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    console.log("Running in development mode");
    return process.env.REACT_APP_BACKEND_LOCAL_URL;
  } else if (process.env.NODE_ENV === "production") {
    console.log("Running in production mode");
    return process.env.REACT_APP_BACKEND_URL;
  } else {
    console.log("Unknown environment:", process.env.NODE_ENV);
  }
}
