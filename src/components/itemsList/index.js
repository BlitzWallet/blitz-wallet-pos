import displayCorrectDenomination from "../../functions/displayCorrectDenomination";
import { formatBalanceAmount } from "../../functions/formatNumber";
import "./style.css";

export default function ItemsList({
  listElements,
  currentSettings,
  currentUserSession,
  dollarSatValue,
  setAddedItems,
}) {
  if (!listElements || !listElements?.length) {
    return (
      <div className="customItemsContainer">
        <p className="noItemsText">
          Nothing to show yet! Your employer can add items through the Blitz
          Wallet POS settings.
        </p>
      </div>
    );
  }

  const addItemToTotal = (total) => {
    setAddedItems((prev) => {
      const newItem = { amount: total };

      return [...prev, newItem];
    });
  };

  const elements = listElements.map((item) => {
    if (!item.price) return;
    return (
      <div className="itemContainer" key={item.uuid}>
        <div>
          <p>{item.name}</p>
          <p>
            {formatBalanceAmount(
              displayCorrectDenomination({
                amount: currentSettings?.displayCurrency?.isSats
                  ? Math.round(dollarSatValue * item.price)
                  : item.price?.toFixed(2),
                fiatCurrency: currentUserSession.account.storeCurrency || "USD",
                showSats: currentSettings.displayCurrency.isSats,
                isWord: currentSettings.displayCurrency.isWord,
              })
            )}
          </p>
        </div>
        <div
          onClick={() =>
            addItemToTotal(
              currentSettings?.displayCurrency?.isSats
                ? Math.round(dollarSatValue * item.price)
                : (item.price * 100).toFixed(2)
            )
          }
          className="addItemIconContainer"
        >
          <img className="addItemIcon" src="/assets/icons/plus.png" />
        </div>
      </div>
    );
  });

  return <div className="customItemsContainer">{elements}</div>;
}
