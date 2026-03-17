import { motion } from 'framer-motion';
import { RefreshCw, Zap, Clock } from 'lucide-react';
import './RecurringManager.css';

export default function RecurringManager({ recurring, currencySymbol, onRefresh }) {
  if (!recurring || recurring.length === 0) {
    return (
      <div className="recurring-manager card">
        <h3 className="chart-title">Recurring Expenses</h3>
        <div className="chart-empty">
          No recurring items. Add them via Telegram: "Rent is 85000 from Aki Gin on the 25th, it's autopay"
        </div>
      </div>
    );
  }

  return (
    <div className="recurring-manager card">
      <h3 className="chart-title">Recurring Expenses</h3>
      <div className="recurring-list">
        {recurring.map((item, i) => (
          <motion.div
            key={item.id}
            className="recurring-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <div className="recurring-item__icon">
              <RefreshCw size={16} />
            </div>
            <div className="recurring-item__info">
              <span className="recurring-item__name">{item.name}</span>
              <span className="recurring-item__meta">
                {item.frequency} · {item.category} · {item.account_name || 'Unknown'}
              </span>
            </div>
            <div className="recurring-item__right">
              <span className="recurring-item__amount mono">
                {currencySymbol}{Math.abs(item.amount).toLocaleString()}
              </span>
              <div className="recurring-item__badges">
                {item.is_autopay ? (
                  <span className="badge badge--autopay"><Zap size={10} /> Autopay</span>
                ) : (
                  <span className="badge badge--manual"><Clock size={10} /> Manual</span>
                )}
              </div>
            </div>
            <span className="recurring-item__due">
              Next: {item.next_due}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
