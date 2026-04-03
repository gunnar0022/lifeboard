import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Check, XCircle } from 'lucide-react';
import { useApi, apiPut, apiDelete } from '../../hooks/useApi';
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

export default function TransactionHistory({ holding, currencySymbol, onClose, onRefresh }) {
  const { data: transactions, loading, refetch } = useApi(
    `/api/investing/transactions?holding_id=${holding.id}&limit=50`
  );
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setConfirmDeleteId(null);
    setEditFields({
      type: tx.type,
      shares: tx.shares,
      price_per_share: tx.price_per_share,
      total_amount: tx.total_amount,
      date: tx.date,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({});
  };

  const saveEdit = async (txId) => {
    setSaving(true);
    try {
      await apiPut(`/api/investing/transactions/${txId}`, editFields);
      setEditingId(null);
      refetch();
      onRefresh?.();
    } catch (err) {
      console.error('Failed to update transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (txId) => {
    if (confirmDeleteId !== txId) {
      setConfirmDeleteId(txId);
      setEditingId(null);
      return;
    }
    setSaving(true);
    try {
      await apiDelete(`/api/investing/transactions/${txId}`);
      setConfirmDeleteId(null);
      refetch();
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const currency = holding.currency;
  const isJPY = currency === 'JPY';

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
                const isEditing = editingId === tx.id;
                const isConfirmingDelete = confirmDeleteId === tx.id;

                if (isEditing) {
                  return (
                    <div key={tx.id} className="tx-history__row tx-history__row--editing">
                      <select
                        className="tx-history__edit-select"
                        value={editFields.type}
                        onChange={(e) => setEditFields({ ...editFields, type: e.target.value })}
                        disabled={saving}
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                        <option value="dividend">Dividend</option>
                        <option value="split">Split</option>
                      </select>
                      <input
                        type="date"
                        className="tx-history__edit-input"
                        value={editFields.date}
                        onChange={(e) => setEditFields({ ...editFields, date: e.target.value })}
                        disabled={saving}
                      />
                      <input
                        type="number"
                        className="tx-history__edit-input tx-history__edit-input--num"
                        value={editFields.shares}
                        onChange={(e) => setEditFields({ ...editFields, shares: parseFloat(e.target.value) || 0 })}
                        step="any"
                        placeholder="Shares"
                        disabled={saving}
                      />
                      <input
                        type="number"
                        className="tx-history__edit-input tx-history__edit-input--num"
                        value={isJPY ? editFields.price_per_share : editFields.price_per_share / 100}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditFields({
                            ...editFields,
                            price_per_share: isJPY ? Math.round(val) : Math.round(val * 100),
                            total_amount: isJPY
                              ? Math.round(editFields.shares * val)
                              : Math.round(editFields.shares * val * 100),
                          });
                        }}
                        step={isJPY ? '1' : '0.01'}
                        placeholder="Price"
                        disabled={saving}
                      />
                      <div className="tx-history__actions">
                        <button
                          className="tx-history__action-btn tx-history__action-btn--save"
                          onClick={() => saveEdit(tx.id)}
                          disabled={saving}
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="tx-history__action-btn tx-history__action-btn--cancel"
                          onClick={cancelEdit}
                          disabled={saving}
                          title="Cancel"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={tx.id} className={`tx-history__row${isConfirmingDelete ? ' tx-history__row--deleting' : ''}`}>
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
                    <div className="tx-history__actions">
                      {isConfirmingDelete ? (
                        <>
                          <button
                            className="tx-history__action-btn tx-history__action-btn--confirm-delete"
                            onClick={() => handleDelete(tx.id)}
                            disabled={saving}
                            title="Confirm delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            className="tx-history__action-btn tx-history__action-btn--cancel"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={saving}
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="tx-history__action-btn"
                            onClick={() => startEdit(tx)}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="tx-history__action-btn tx-history__action-btn--delete"
                            onClick={() => handleDelete(tx.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
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
