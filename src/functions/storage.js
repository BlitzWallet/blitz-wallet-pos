export const saveClaimsToStorage = (claims) => {
  localStorage.setItem("claims", JSON.stringify(claims));
};

export const readClaimsFromStorage = () => {
  const claims = localStorage.getItem("claims");
  return claims ? JSON.parse(claims) : {};
};
