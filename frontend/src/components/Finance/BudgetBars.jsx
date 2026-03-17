import { motion } from 'framer-motion';
import './BudgetBars.css';

export default function BudgetBars({ budgetStatus, currencySymbol }) {
  const categories = budgetStatus?.categories || [];

  if (categories.length === 0) {
    return (
      <div className="budget-bars card">
        <h3 className="chart-title">Budget vs Actual</h3>
        <div className="chart-empty">
          No budgets set. Use Telegram to set category budgets.
        </div>
      </div>
    );
  }

  return (
    <div className="budget-bars card">
      <h3 className="chart-title">Budget vs Actual</h3>
      <div className="budget-bars__list">
        {categories.map((cat, i) => (
          <div key={cat.category} className="budget-bar-item">
            <div className="budget-bar-item__header">
              <span className="budget-bar-item__name">{cat.category}</span>
              <span className="budget-bar-item__values mono">
                {currencySymbol}{cat.spent.toLocaleString()} / {currencySymbol}{cat.budget.toLocaleString()}
              </span>
            </div>
            <div className="budget-bar-item__track">
              <motion.div
                className={`budget-bar-item__fill ${
                  cat.percentage >= 100 ? 'budget-bar-item__fill--over' :
                  cat.percentage >= 80 ? 'budget-bar-item__fill--warning' : ''
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(cat.percentage, 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <span className="budget-bar-item__pct mono">
              {cat.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
