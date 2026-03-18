import { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import './HoldingsTable.css';

const CLASS_LABELS = {
  stock: 'Stocks',
  etf: 'ETFs',
  crypto: 'Crypto',
  bond: 'Bonds',
  other: 'Other',
};

const CLASS_ORDER = ['stock', 'etf', 'crypto', 'bond', 'other'];

function formatCurrency(amount, currency) {
  if (currency === 'JPY') return `¥${Math.round(amount).toLocaleString()}`;
  return `$${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShares(shares) {
  if (shares >= 1) return shares.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return shares.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function HoldingsTable({ holdings, currencySymbol }) {
  const [collapsed, setCollapsed] = useState({});
  const [selectedHolding, setSelectedHolding] = useState(null);

  if (!holdings || holdings.length === 0) return null;

  // Group by asset_class
  const groups = {};
  for (const h of holdings) {
    const cls = h.asset_class;
    if (!groups[cls]) groups[cls] = [];
    groups[cls].push(h);
  }

  const sortedClasses = CLASS_ORDER.filter(cls => groups[cls]);

  const toggleGroup = (cls) => {
    setCollapsed(prev => ({ ...prev, [cls]: !prev[cls] }));
  };

  return (
    <div className="holdings-table card">
      <h4 className="holdings-table__title">Holdings</h4>

      <div className="holdings-table__header-row">
        <span className="holdings-table__col-symbol">Symbol</span>
        <span className="holdings-table__col-shares">Shares</span>
        <span className="holdings-table__col-price">Price</span>
        <span className="holdings-table__col-value">Market Value</span>
        <span className="holdings-table__col-gain">Gain/Loss</span>
      </div>

      {sortedClasses.map(cls => {
        const groupHoldings = groups[cls];
        const isCollapsed = collapsed[cls];
        const groupValue = groupHoldings.reduce((sum, h) => sum + h.market_value, 0);

        return (
          <div key={cls} className="holdings-table__group">
            <button
              className="holdings-table__group-header"
              onClick={() => toggleGroup(cls)}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              <span className="holdings-table__group-label">
                {CLASS_LABELS[cls] || cls}
              </span>
              <span className="holdings-table__group-count">{groupHoldings.length}</span>
              <span className="holdings-table__group-value mono">
                {currencySymbol}{groupValue.toLocaleString()}
              </span>
            </button>

            {!isCollapsed && groupHoldings.map(h => {
              const isPositive = h.gain_loss >= 0;
              return (
                <button
                  key={h.id}
                  className="holdings-table__row"
                  onClick={() => setSelectedHolding(h)}
                >
                  <div className="holdings-table__col-symbol">
                    <span className="holdings-table__symbol">{h.symbol}</span>
                    <span className="holdings-table__name">{h.name}</span>
                  </div>
                  <span className="holdings-table__col-shares mono">
                    {formatShares(h.total_shares)}
                  </span>
                  <span className="holdings-table__col-price mono">
                    {formatCurrency(h.current_price, h.currency)}
                  </span>
                  <span className="holdings-table__col-value mono">
                    {formatCurrency(h.market_value, h.currency)}
                  </span>
                  <div className={`holdings-table__col-gain ${isPositive ? 'gain' : 'loss'}`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span className="mono">
                      {isPositive ? '+' : ''}{formatCurrency(h.gain_loss, h.currency)}
                    </span>
                    <span className="holdings-table__gain-pct mono">
                      ({isPositive ? '+' : ''}{h.gain_loss_pct}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}

      {selectedHolding && (
        <TransactionHistory
          holding={selectedHolding}
          currencySymbol={currencySymbol}
          onClose={() => setSelectedHolding(null)}
        />
      )}
    </div>
  );
}
