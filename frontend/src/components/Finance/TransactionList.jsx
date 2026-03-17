import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import './TransactionList.css';

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
  const today = new Date();
  const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TransactionList({ transactions, transfers, currencySymbol, currency }) {
  // Merge transactions and transfers into a single timeline
  const items = [];

  for (const tx of transactions) {
    items.push({
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
    items.push({
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

  // Sort by date descending
  items.sort((a, b) => b.date.localeCompare(a.date));

  if (items.length === 0) {
    return (
      <div className="transaction-list card">
        <h3 className="chart-title">Recent Transactions</h3>
        <div className="chart-empty">
          No transactions yet. Log your first one via Telegram or the form above!
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-list card">
      <h3 className="chart-title">Recent Transactions</h3>
      <div className="transaction-list__items">
        {items.slice(0, 30).map((item, i) => (
          <motion.div
            key={item.id}
            className={`tx-item tx-item--${item.type}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
          >
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
