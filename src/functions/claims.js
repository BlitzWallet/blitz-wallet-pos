import { ECPairFactory } from "ecpair";
import { readClaimsFromStorage, saveClaimsToStorage } from "./storage";
import * as ecc from "@bitcoinerlab/secp256k1";
import { lessThanTenMin } from "./date";

const infoToStored = (claim) => ({
  ...claim,
  keys: "",
  preimage: claim.preimage.toString("base64"),
  wif: claim.keys.toWIF(),
});

const storedToInfo = (claim) => ({
  ...claim,
  keys: ECPairFactory(ecc).fromWIF(claim.wif),
  preimage: Buffer.from(claim.preimage, "base64"),
});

export const deleteExpiredClaims = (chainSource, network) => {
  const claims = getClaims(network);
  if (claims.length > 0) {
    chainSource.fetchChainTip().then((tip) => {
      for (const claim of claims) {
        const expired = claim.createdResponse.timeoutBlockHeight <= tip;
        if (expired) removeClaim(claim, network);
      }
    });
  }
};

const getClaims = (network) => {
  const claims = readClaimsFromStorage();
  if (!claims[network]) return [];
  return claims[network].map((claim) => storedToInfo(claim));
};

export const getRetriableClaims = (network) => {
  return getClaims(network).filter(
    (claim) => !claim.claimed && lessThanTenMin(claim.createdAt || 0)
  );
};

export const removeClaim = (claim, network) => {
  const claims = readClaimsFromStorage();
  if (!claims[network]) return;
  claims[network] = claims[network].filter(
    (c) => c.createdResponse.id !== claim.createdResponse.id
  );
  saveClaimsToStorage(claims);
};

export const saveClaim = (claim, network) => {
  console.log("saving claim", claim);
  claim.createdAt = new Date().getTime();
  const claims = readClaimsFromStorage();
  if (!claims[network]) claims[network] = [];
  const claimStored = infoToStored(claim);
  const index = claims[network].findIndex(
    (c) => c.createdResponse.id === claim.createdResponse.id
  );
  if (index === -1) claims[network].push(claimStored);
  else claims[network][index] = claimStored;
  saveClaimsToStorage(claims);
};
