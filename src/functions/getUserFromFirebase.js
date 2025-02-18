export async function setupSession(wantedName) {
  const response = await fetch("/getUser", {
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

  return {
    posData: data?.data?.posData,
    bitcoinPrice: data?.data?.bitcoinData,
  };
}
