import { Plus } from "lucide-react";
import displayCorrectDenomination from "../../functions/displayCorrectDenomination";
import { formatBalanceAmount } from "../../functions/formatNumber";
import "./style.css";
import { useTranslation } from "react-i18next";

export default function ItemsList({
  listElements,
  currentSettings,
  currentUserSession,
  dollarSatValue,
  setAddedItems,
}) {
  const { t } = useTranslation();
  if (!listElements || !listElements?.length) {
    return (
      <div className="customItemsContainer">
        <p className="noItemsText">{t("itemList.empty")}</p>
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
      <div
        onClick={() =>
          addItemToTotal(
            currentSettings?.displayCurrency?.isSats
              ? Math.round(dollarSatValue * item.price)
              : (item.price * 100).toFixed(2),
          )
        }
        className="itemContainer"
        key={item.uuid}
      >
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
              }),
            )}
          </p>
        </div>
        <Plus color="#0375f6" />
      </div>
    );
  });

  return <div className="customItemsContainer">{elements}</div>;
}
