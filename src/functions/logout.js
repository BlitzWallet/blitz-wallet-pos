import { ACCOUNT_LOCAL_STORAGE, SERVER_LOCAL_STORAGE } from "../constants";
import { removeLocalStorageItem } from "./localStorage";

export default function logout() {
  const didClearAccount = removeLocalStorageItem(ACCOUNT_LOCAL_STORAGE);
  const didClearServer = removeLocalStorageItem(SERVER_LOCAL_STORAGE);

  console.log("Did clear account:", didClearAccount);
  console.log("Did clear server name:", didClearServer);
  if (didClearAccount && didClearServer) {
    window.location.href = "/";
  }
}
