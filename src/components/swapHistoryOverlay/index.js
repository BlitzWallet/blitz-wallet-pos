import "./index.css";
import chainArbitrum from "../../assets/chain-arbitrum.svg";
import chainBase from "../../assets/chain-base.svg";
import chainEthereum from "../../assets/chain-ethereum.svg";
import chainOptimism from "../../assets/chain-optimism.svg";
import chainPolygon from "../../assets/chain-polygon.png";
import chainSolana from "../../assets/chain-solana.svg";
import chainTron from "../../assets/chain-tron.svg";
import usdt from "../../assets/usdt.svg";
import usdc from "../../assets/usdc.svg";

import { getSwapHistory } from "../../functions/swapHistory";
import { X } from "lucide-react";
import { useCopyToast } from "../../contexts/copyToast";

const CHAIN_LOGOS = {
  arbitrum: chainArbitrum,
  base: chainBase,
  ethereum: chainEthereum,
  optimism: chainOptimism,
  polygon: chainPolygon,
  solana: chainSolana,
  tron: chainTron,
};
const CURRENCY_LOGOS = {
  usdc: usdc,
  usdt: usdt,
};

const NETWORK_LABELS = {
  arbitrum: "Arbitrum",
  base: "Base",
  ethereum: "Ethereum",
  optimism: "Optimism",
  polygon: "Polygon",
  solana: "Solana",
  tron: "Tron",
};

function truncateQuoteId(id) {
  if (!id || id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(amountIn) {
  if (amountIn == null) return "";
  const value = (Number(amountIn) / 1_000_000).toFixed(2);
  return `${value}`.trim();
}

export default function SwapHistoryOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { showCopyToast } = useCopyToast();

  const history = getSwapHistory();
  const handleClick = (entry) => {
    showCopyToast(entry.quoteId);
  };

  return (
    <div className="SwapHistory-Container">
      <div className="SwapHistory-Panel">
        <div className="SwapHistory-Header">
          <div>
            <p className="SwapHistory-Title">Swap History</p>
          </div>
          <button className="ns-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} color="#0375f6" />
          </button>
        </div>
        <div className="SwapHistory-List">
          {history.length === 0 ? (
            <p className="SwapHistory-Empty">No swaps recorded yet.</p>
          ) : (
            history.map((entry, i) => (
              <div
                onClick={() => handleClick(entry)}
                className="SwapHistory-Row"
                key={entry.quoteId || i}
              >
                <div className="SwapHistory-ChainLogo-container ">
                  {CHAIN_LOGOS[entry.network] && (
                    <img
                      src={CHAIN_LOGOS[entry.network]}
                      alt={entry.network}
                      className="SwapHistory-ChainLogo"
                    />
                  )}
                  {CHAIN_LOGOS[entry.network] && (
                    <img
                      src={CURRENCY_LOGOS[entry.currency?.toLowerCase()]}
                      alt={entry.network}
                      className="SwapHistory-CurrencyLogo"
                    />
                  )}
                </div>
                <div className="SwapHistory-Info">
                  <div className="SwapHistory-TopRow">
                    <span className="SwapHistory-NetworkLabel">
                      {NETWORK_LABELS[entry.network] || entry.network}
                    </span>
                  </div>
                  <div className="SwapHistory-QuoteId">
                    {truncateQuoteId(entry.quoteId)}
                  </div>
                  <div className="SwapHistory-BottomRow">
                    <span className="SwapHistory-Date">
                      {formatDate(entry.dateAdded)}
                    </span>
                  </div>
                </div>
                <span className="SwapHistory-Amount">
                  {formatAmount(entry.amountIn)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
