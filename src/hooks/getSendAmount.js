import { useLocation } from "react-router-dom";

export function getSendAmount() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const convertedSatAmount = params.get("amount");
  return convertedSatAmount;
}
