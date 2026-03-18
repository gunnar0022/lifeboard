import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import './TransactionHistory.css';

const TYPE_BADGES = {
  buy: { label: 'Buy', className: 'buy' },
  sell: { label: 'Sell', className: 'sell' },
  dividend: { label: 'Div', className: 'dividend' },
  split: { label: 'Split', className: 'split' },
};

function formatCurrency(amount, currency) {
  if (currency === 'JPY') return `¥${Math.round(amount).toLocaleString()}`;
  return `$${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransactionHistory({ holding, currencySymbol, onClose }) {
  const { data: transactions, loading } = useApi(
    `/api/investing/transactions?holding_id=${holding.id}&limit=50`
  );

  return (
    <AnimatePresence>
      <motion.div
        className="tx-history__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="tx-history__modal"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tx-history__header">
            <div>
              <h3 className="tx-history__title">{holding.symbol}</h3>
              <p className="tx-history__subtitle">{holding.name}</p>
            </div>
            <button className="tx-history__close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="tx-history__summary">
            <div className="tx-history__stat">
              <span className="tx-history__stat-label">Shares</span>
              <span className="tx-history__stat-value mono">{holding.total_shares}</span>
            </div>
            <div className="tx-history__stat">
              <span className="tx-history__stat-label">Avg Cost</span>
              <span className="tx-history__stat-value mono">
                {formatCurrency(holding.avg_cost_per_share, holding.currency)}
              </span>
            </div>
            <div className="tx-history__stat">
              <span className="tx-history__stat-label">Current</span>
              <span className="tx-history__stat-value mono">
                {formatCurrency(holding.current_price, holding.currency)}
              </span>
            </div>
            <div className="tx-history__stat">
              <span className="tx-history__stat-label">Gain/Loss</span>
              <span className={`tx-history__stat-value mono ${holding.gain_loss >= 0 ? 'gain' : 'loss'}`}>
                {holding.gain_loss >= 0 ? '+' : ''}{formatCurrency(holding.gain_loss, holding.currency)} ({holding.gain_loss >= 0 ? '+' : ''}{holding.gain_loss_pct}%)
              </span>
            </div>
          </div>

          <h4 className="tx-history__list-title">Transaction History</h4>

          {loading && <p className="tx-history__loading">Loading...</p>}

          {!loading && transactions && transactions.length === 0 && (
            <p className="tx-history__empty">No transactions recorded</p>
          )}

          {!loading && transactions && transactions.length > 0 && (
            <div className="tx-history__list">
              {transactions.map(tx => {
                const badge = TYPE_BADGES[tx.type] || { label: tx.type, className: 'other' };
                return (
                  <div key={tx.id} className="tx-history__row">
                    <span className={`tx-history__badge ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="tx-history__date">{tx.date}</span>
                    <span className="tx-history__shares mono">
                      {tx.type !== 'dividend' ? `${tx.shares} sh` : '—'}
                    </span>
                    <span className="tx-history__price mono">
                      {tx.price_per_share > 0 ? formatCurrency(tx.price_per_share, tx.currency) : '—'}
                    </span>
                    <span className="tx-history__total mono">
                      {formatCurrency(tx.total_amount, tx.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
