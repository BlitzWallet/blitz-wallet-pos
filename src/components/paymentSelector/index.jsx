import { useEffect, useState } from "react";
import "./style.css";
import { getAvailableTokens } from "../../functions/lendaswap";
import { useLendaSwap } from "../../contexts/lendaswapContext";

export default function PaymentMethodSelector({
  onSelect,
  selectedMethod = "lightning",
  currentUserSession,
}) {
  const { isInitialized } = useLendaSwap();

  console.log(isInitialized, "testing");

  const hasSparkSupport = !!currentUserSession?.account?.sparkPubKey;

  const paymentMethods = [
    {
      id: "lightning",
      name: "BTC",
      description: "Lightning network",
      enabled: hasSparkSupport,
      disabledReason: "Lightning not configured",
    },
    {
      id: "USDT_pol",
      name: "USDT",
      icon: null,
      description: "Polygon Network",
      enabled: isInitialized,
    },
    {
      id: "USDT_eth",
      name: "USDT",
      icon: null,
      description: "Ethereum Network",
      enabled: isInitialized,
    },
    {
      id: "USDC_pol",
      name: "USDC",
      icon: null,
      description: "Polygon Network",
      enabled: isInitialized,
    },
    {
      id: "USDC_eth",
      name: "USDC",
      icon: null,
      description: "Ethereum Network",
      enabled: isInitialized,
    },
  ];

  return (
    <div className="payment-method-selector">
      <h3 className="payment-method-title">Select Payment Method</h3>
      <div className="payment-method-grid">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isDisabled = !method.enabled;

          return (
            <button
              key={method.id}
              onClick={() => method.enabled && onSelect(method.id)}
              disabled={isDisabled}
              className={`payment-method-option ${
                isSelected ? "selected" : ""
              } ${isDisabled ? "disabled" : ""}`}
            >
              <div className="payment-method-content">
                <div className="payment-method-text-icon">{method.name}</div>
                <div className="payment-method-info">
                  <p className="payment-method-name">{method.name}</p>
                  <p className="payment-method-description">
                    {method.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
