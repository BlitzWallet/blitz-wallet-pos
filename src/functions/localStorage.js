const saveAccount = (Account) => {
  localStorage.setItem("Account", Account);
};

const getAccount = () => {
  return localStorage.getItem("Account");
};
const removeLocalStorageItem = (item) => {
  return localStorage.removeItem(item);
};

const clearAccount = () => {
  try {
    localStorage.removeItem("Account");
    return true;
  } catch (err) {
    console.log("remove local storage error", err);
    return false;
  }
};
export { saveAccount, getAccount, clearAccount, removeLocalStorageItem };
