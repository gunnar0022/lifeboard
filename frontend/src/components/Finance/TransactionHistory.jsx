import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, History, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import './TransactionHistory.css';

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonthRange(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export default function TransactionHistory({ currency, currencySymbol }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const { from, to } = getMonthRange(month);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/finance/transactions?date_from=${from}&date_to=${to}&limit=500`).then(r => r.json()),
      fetch(`/api/finance/transfers?date_from=${from}&date_to=${to}&limit=200`).then(r => r.json()),
    ]).then(([txns, transfers]) => {
      const merged = [];
      for (const tx of txns) {
        merged.push({
          type: tx.amount > 0 ? 'income' : 'expense',
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
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, from, to, currency]);

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const isCurrentMonth = (() => {
    const now = new Date();
    return month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  })();

  return (
    <div className="tx-history-browser card">
      <button className="tx-history-browser__toggle" onClick={() => setOpen(!open)}>
        <History size={16} />
        <span>{open ? 'Hide' : 'View'} Transaction History</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="tx-history-browser__content"
          >
            <div className="tx-history-browser__nav">
              <button className="tx-history-browser__nav-btn" onClick={prevMonth}>
                <ChevronLeft size={18} />
              </button>
              <span className="tx-history-browser__month">{monthLabel}</span>
              <button
                className="tx-history-browser__nav-btn"
                onClick={nextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {loading && <p className="tx-history-browser__loading">Loading...</p>}

            {!loading && items.length === 0 && (
              <p className="tx-history-browser__empty">No transactions for {monthLabel}</p>
            )}

            {!loading && items.length > 0 && (
              <div className="tx-history-browser__list">
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
        )}
      </AnimatePresence>
    </div>
  );
}
