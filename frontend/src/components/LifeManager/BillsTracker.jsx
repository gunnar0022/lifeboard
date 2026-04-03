import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, CreditCard, Check, AlertCircle, Clock, Plus } from 'lucide-react';
import { apiPost } from '../../hooks/useApi';
import './BillsTracker.css';

function formatAmount(amount, currencySymbol) {
  return `${currencySymbol}${Math.abs(amount).toLocaleString()}`;
}

function getDueStatus(nextDue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue + 'T00:00:00');
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, className: 'overdue' };
  if (diff === 0) return { label: 'Due today', className: 'today' };
  if (diff <= 3) return { label: `${diff}d`, className: 'soon' };
  return { label: `${diff}d`, className: 'normal' };
}

export default function BillsTracker({ bills, currencySymbol, onRefresh }) {
  const [loading, setLoading] = useState(null);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const handleMarkPaid = async (billId) => {
    setLoading(billId);
    try {
      await apiPost(`/api/life/bills/${billId}/paid`);
      onRefresh();
    } catch (err) {
      console.error('Failed to mark bill paid:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!billName.trim() || !billAmount) return;
    setAdding(true);
    try {
      await apiPost('/api/life/bills', {
        name: billName.trim(),
        amount: Math.round(parseFloat(billAmount) || 0),
      });
      setBillName('');
      setBillAmount('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add bill:', err);
    } finally {
      setAdding(false);
    }
  };

  const unpaidBills = bills.filter(b => !b.is_paid);
  const totalMonthly = unpaidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="bills-tracker card">
      <div className="bills-tracker__header">
        <h3 className="chart-title">Bills</h3>
        {totalMonthly > 0 && (
          <span className="bills-tracker__total">
            {formatAmount(totalMonthly, currencySymbol)} due
          </span>
        )}
      </div>

      <form className="bills-tracker__quick-add" onSubmit={handleQuickAdd}>
        <Plus size={16} className="bills-tracker__quick-icon" />
        <input
          type="text"
          placeholder="Add a bill..."
          value={billName}
          onChange={(e) => setBillName(e.target.value)}
          disabled={adding}
        />
        <div className="bills-tracker__quick-amount">
          <span className="bills-tracker__quick-currency">{currencySymbol}</span>
          <input
            type="number"
            placeholder="0"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            disabled={adding}
          />
        </div>
      </form>

      {unpaidBills.length === 0 ? (
        <div className="bills-tracker__empty">
          <Receipt size={24} />
          <p>No unpaid bills</p>
        </div>
      ) : (
        <div className="bills-tracker__list">
          <AnimatePresence>
            {unpaidBills.map((bill, i) => {
              const status = getDueStatus(bill.next_due);
              return (
                <motion.div
                  key={bill.id}
                  className={`bill-item bill-item--${status.className}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="bill-item__left">
                    <div className="bill-item__icon">
                      {status.className === 'overdue' ? (
                        <AlertCircle size={16} />
                      ) : (
                        <Receipt size={16} />
                      )}
                    </div>
                    <div className="bill-item__info">
                      <span className="bill-item__name">
                        {bill.name}
                        {bill.is_autopay ? (
                          <span className="bill-badge bill-badge--autopay">
                            <CreditCard size={10} /> Autopay
                          </span>
                        ) : null}
                      </span>
                      <span className="bill-item__meta">
                        {bill.category} &middot; {bill.frequency}
                        <span className={`bill-item__due bill-item__due--${status.className}`}>
                          <Clock size={10} /> {status.label}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="bill-item__right">
                    <span className="bill-item__amount">
                      {formatAmount(bill.amount || 0, currencySymbol)}
                    </span>
                    <button
                      className="bill-item__pay-btn"
                      onClick={() => handleMarkPaid(bill.id)}
                      disabled={loading === bill.id}
                      title="Mark as paid"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
