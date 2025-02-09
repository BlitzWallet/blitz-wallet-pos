import { getBoltzApiUrl } from "./boltz";

export const getSwapStatus = async (id) => {
  const response = await fetch(`${getBoltzApiUrl()}/v2/swap/${id}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  return response.json();
};
