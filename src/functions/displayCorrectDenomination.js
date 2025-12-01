import { BITCOIN_SATS_ICON } from "../constants";
import { formatCurrency } from "./formatCurrency";

export default function displayCorrectDenomination({
  amount,
  fiatCurrency,
  showSats,
  isWord,
}) {
  try {
    const currencyText = fiatCurrency;
    const showSymbol = !isWord;

    const formattedCurrency = formatCurrency({
      amount: amount,
      code: currencyText,
    });
    const isSymbolInFront = formattedCurrency[3];
    const currencySymbol = formattedCurrency[2];
    const formatedSat = amount;

    if (showSats) {
      if (showSymbol) return BITCOIN_SATS_ICON + formatedSat;
      else return formatedSat + " SAT";
    } else {
      if (showSymbol && isSymbolInFront)
        return currencySymbol + formattedCurrency[1];
      else if (showSymbol && !isSymbolInFront)
        return formattedCurrency[1] + currencySymbol;
      else return formattedCurrency[1] + ` ${currencyText}`;
    }
  } catch (err) {
    console.log("display correct denomincation error", err);
    return "";
  }
}
