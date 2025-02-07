import { clearAccount } from "./localStorage";

export default function logout() {
  const didClear = clearAccount();
  console.log(didClear);
  if (didClear) {
    window.location.href = "/";
  }
}
