import { clearAccount } from "./localStorage";

export default function logout() {
  const didClear = clearAccount();
  console.log("Did clear account:", didClear);
  if (didClear) {
    window.location.href = "/";
  }
}
