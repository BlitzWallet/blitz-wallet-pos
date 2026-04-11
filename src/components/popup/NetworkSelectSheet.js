import { useState } from "react";
import "./NetworkSelectSheet.css";

import chainEthereum from "../../assets/chain-ethereum.svg";
import chainPolygon from "../../assets/chain-polygon.png";
import chainArbitrum from "../../assets/chain-arbitrum.svg";
import chainBase from "../../assets/chain-base.svg";
import chainOptimism from "../../assets/chain-optimism.svg";
import chainSolana from "../../assets/chain-solana.svg";
import chainTron from "../../assets/chain-tron.svg";
import usdcIcon from "../../assets/usdc.svg";
import usdtIcon from "../../assets/usdt.svg";
import { X } from "lucide-react";

const NETWORK_TOKENS = {
  ethereum: ["USDC", "USDT"],
  polygon: ["USDC"],
  arbitrum: ["USDC", "USDT"],
  base: ["USDC"],
  optimism: ["USDC", "USDT"],
  solana: ["USDC"],
  tron: ["USDT"],
};

const NETWORK_LABELS = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  arbitrum: "Arbitrum",
  base: "Base",
  optimism: "Optimism",
  solana: "Solana",
  tron: "Tron",
};

const NETWORK_ICONS = {
  ethereum: chainEthereum,
  polygon: chainPolygon,
  arbitrum: chainArbitrum,
  base: chainBase,
  optimism: chainOptimism,
  solana: chainSolana,
  tron: chainTron,
};

const TOKEN_ICONS = {
  USDC: usdcIcon,
  USDT: usdtIcon,
};

const NETWORKS = Object.keys(NETWORK_TOKENS);

export default function NetworkSelectSheet({ onSelect, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState(NETWORKS[0]);
  const [activeToken, setActiveToken] = useState({});

  const handleClose = () => setIsClosing(true);

  const handleAnimationEnd = (e) => {
    if (isClosing && e.target.classList.contains("ns-card")) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleNetworkSelect = (network) => {
    setActiveNetwork(network);
  };

  const handleTokenSelect = (token) => {
    setActiveToken(token);
    setIsClosing(true);
    setTimeout(() => onSelect(activeNetwork, token), 150);
  };

  return (
    <div
      className={`ns-backdrop${isClosing ? " backdrop-exit" : ""}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`ns-card${isClosing ? " card-exit" : ""}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="ns-header">
          <p className="ns-header-title">Choose stablcoin network</p>
          <button
            className="ns-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={18} color="#0375f6" />
          </button>
        </div>

        <div className="ns-body">
          {/* Left: network list */}
          <div className="ns-networks">
            {NETWORKS.map((network) => (
              <button
                key={network}
                className={`ns-network-row${
                  activeNetwork === network ? " selected" : ""
                }`}
                onClick={() => handleNetworkSelect(network)}
              >
                <img
                  src={NETWORK_ICONS[network]}
                  alt={NETWORK_LABELS[network]}
                  className="ns-network-icon"
                />
                {NETWORK_LABELS[network]}
              </button>
            ))}
          </div>

          {/* Right: token list for active network */}
          <div className="ns-tokens">
            {NETWORK_TOKENS[activeNetwork].map((token) => (
              <button
                key={token}
                className={`ns-token-row${
                  activeToken === token ? " selected" : ""
                }`}
                onClick={() => handleTokenSelect(token)}
              >
                <img
                  src={TOKEN_ICONS[token]}
                  alt={token}
                  className="ns-token-icon"
                />
                <div className="ns-token-info">
                  <span className="ns-token-name">{token}</span>
                  <span className="ns-token-subtitle">
                    on {NETWORK_LABELS[activeNetwork]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
