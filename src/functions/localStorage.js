const saveToLocalStorage = (data, localStorageName) => {
  try {
    return localStorage.setItem(localStorageName, data);
  } catch (err) {
    console.log("saving to local storage error", err);
    return null;
  }
};
const getLocalStorageItem = (localStorageName) => {
  try {
    return localStorage.getItem(localStorageName);
  } catch (err) {
    console.log("saving to local storage error", err);
    return null;
  }
};

const removeLocalStorageItem = (localStorageName) => {
  return localStorage.removeItem(localStorageName);
};

export { removeLocalStorageItem, saveToLocalStorage, getLocalStorageItem };
