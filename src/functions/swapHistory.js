import {
  getLocalStorageItem,
  removeLocalStorageItem,
  saveToLocalStorage,
} from "./localStorage";

const SWAP_HISTORY_KEY = "blitz_pos_swap_history";
const MAX_ENTRIES = 50;

// NOTE: quoteId is the Flashnet identifier returned by /createPOSInvoice.
// It is NOT the same as paylinkId, which is generated client-side and sent to
// the backend — paylinkId is never stored here.

const getSwapHistory = () => {
  const raw = getLocalStorageItem(SWAP_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const addSwapToHistory = (entry) => {
  const current = getSwapHistory();
  const updated = [entry, ...current].slice(0, MAX_ENTRIES);
  saveToLocalStorage(JSON.stringify(updated), SWAP_HISTORY_KEY);
};

const clearSwapHistory = () => {
  removeLocalStorageItem(SWAP_HISTORY_KEY);
};

export { addSwapToHistory, clearSwapHistory, getSwapHistory };
