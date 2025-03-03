export const formatBalanceAmount = (amount) => {
  if (!amount) {
    return "0";
  }

  // Detect decimal separator: prioritize comma, then dot
  let decimalSeparator = amount.includes(",")
    ? ","
    : amount.includes(".")
    ? "."
    : null;

  let [integerPart, decimalPart] = decimalSeparator
    ? amount.split(decimalSeparator)
    : [amount, null];

  // Format the integer part with a space as a thousands separator
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // Rejoin with the decimal part if it exists
  return decimalPart
    ? `${integerPart}${decimalSeparator}${decimalPart}`
    : integerPart;
};
