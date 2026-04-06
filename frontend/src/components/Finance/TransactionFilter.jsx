import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import './TransactionFilter.css';

function formatAmount(amount, currency) {
  const sym = currency === 'JPY' ? '¥' : '$';
  const val = currency === 'USD' ? Math.abs(amount) / 100 : Math.abs(amount);
  const formatted = currency === 'USD'
    ? val.toLocaleString(undefined, { minimumFractionDigits: 2 })
    : val.toLocaleString();
  return `${amount >= 0 ? '+' : '-'}${sym}${formatted}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthRange(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export default function TransactionFilter({ filterType, filterValue, filterLabel, currency, onClose }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ income: 0, expense: 0, count: 0 });

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const { from, to } = getMonthRange(month);

  const isCurrentMonth = (() => {
    const now = new Date();
    return month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  })();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      date_from: from,
      date_to: to,
      limit: '500',
    });
    if (filterType === 'account') params.set('account_id', filterValue);
    if (filterType === 'category') params.set('category', filterValue);

    Promise.all([
      fetch(`/api/finance/transactions?${params}`).then(r => r.json()),
      filterType === 'account'
        ? fetch(`/api/finance/transfers?account_id=${filterValue}&date_from=${from}&date_to=${to}&limit=200`).then(r => r.json())
        : Promise.resolve([]),
    ]).then(([txns, transfers]) => {
      const merged = [];
      let income = 0, expense = 0;

      for (const tx of txns) {
        const isIncome = tx.amount > 0;
        if (isIncome) income += tx.amount;
        else expense += Math.abs(tx.amount);
        merged.push({
          type: isIncome ? 'income' : 'expense',
          id: `tx-${tx.id}`,
          date: tx.date,
          description: tx.description || tx.category,
          category: tx.category,
          amount: tx.amount,
          accountName: tx.account_name,
          currency: tx.account_currency || currency,
        });
      }
      for (const tr of transfers) {
        merged.push({
          type: 'transfer',
          id: `tr-${tr.id}`,
          date: tr.date,
          description: tr.description || `${tr.from_account_name} → ${tr.to_account_name}`,
          category: 'Transfer',
          amount: -tr.from_amount,
          accountName: `${tr.from_account_name} → ${tr.to_account_name}`,
          currency: tr.from_currency || currency,
        });
      }
      merged.sort((a, b) => b.date.localeCompare(a.date));
      setItems(merged);
      setTotals({ income, expense, count: merged.length });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [from, to, filterType, filterValue, currency]);

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const sym = currency === 'JPY' ? '¥' : '$';
  const formatTotal = (v) => currency === 'USD' ? `${sym}${(v / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${sym}${v.toLocaleString()}`;

  return (
    <motion.div
      className="tx-filter__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="tx-filter__modal"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tx-filter__header">
          <div>
            <h3 className="tx-filter__title">{filterLabel}</h3>
            <p className="tx-filter__subtitle">
              {filterType === 'account' ? 'Account transactions' : 'Category spending'}
            </p>
          </div>
          <button className="tx-filter__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tx-filter__nav">
          <button className="tx-filter__nav-btn" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span className="tx-filter__month">{monthLabel}</span>
          <button className="tx-filter__nav-btn" onClick={nextMonth} disabled={isCurrentMonth}>
            <ChevronRight size={18} />
          </button>
        </div>

        {!loading && totals.count > 0 && (
          <div className="tx-filter__summary">
            {totals.income > 0 && <span className="tx-filter__summary-in">+{formatTotal(totals.income)}</span>}
            {totals.expense > 0 && <span className="tx-filter__summary-out">-{formatTotal(totals.expense)}</span>}
            <span className="tx-filter__summary-count">{totals.count} transactions</span>
          </div>
        )}

        {loading && <p className="tx-filter__loading">Loading...</p>}

        {!loading && items.length === 0 && (
          <p className="tx-filter__empty">No transactions for {monthLabel}</p>
        )}

        {!loading && items.length > 0 && (
          <div className="tx-filter__list">
            {items.map(item => (
              <div key={item.id} className={`tx-item tx-item--${item.type}`}>
                <div className="tx-item__icon">
                  {item.type === 'income' ? <ArrowUpRight size={16} /> :
                   item.type === 'transfer' ? <ArrowLeftRight size={16} /> :
                   <ArrowDownRight size={16} />}
                </div>
                <div className="tx-item__info">
                  <span className="tx-item__desc">{item.description}</span>
                  <span className="tx-item__meta">
                    {item.category} · {item.accountName}
                  </span>
                </div>
                <div className="tx-item__right">
                  <span className="tx-item__amount mono">
                    {formatAmount(item.amount, item.currency)}
                  </span>
                  <span className="tx-item__date">{formatDate(item.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
