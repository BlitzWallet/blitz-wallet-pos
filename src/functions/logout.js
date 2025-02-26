import { ACCOUNT_LOCAL_STORAGE } from "../constants";
import { removeLocalStorageItem } from "./localStorage";

export default function logout() {
  const didClear = removeLocalStorageItem(ACCOUNT_LOCAL_STORAGE);
  console.log("Did clear account:", didClear);
  if (didClear) {
    window.location.href = "/";
  }
}
