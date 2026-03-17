import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import './CycleOverview.css';

export default function CycleOverview({ cycle, cycleInfo, budgetStatus, currencySymbol }) {
  if (!cycle || !cycleInfo) return null;

  const income = cycle.income || 0;
  const expenses = cycle.expenses || 0;
  const net = cycle.net || 0;
  const budgetPct = budgetStatus?.percentage || 0;
  const totalBudget = budgetStatus?.total_budget || 0;

  return (
    <div className="cycle-overview">
      <div className="cycle-overview__stats">
        <div className="cycle-stat cycle-stat--income">
          <div className="cycle-stat__icon">
            <TrendingUp size={18} />
          </div>
          <div className="cycle-stat__info">
            <span className="cycle-stat__label">Income</span>
            <span className="cycle-stat__value mono">
              {currencySymbol}{income.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="cycle-stat cycle-stat--expense">
          <div className="cycle-stat__icon">
            <TrendingDown size={18} />
          </div>
          <div className="cycle-stat__info">
            <span className="cycle-stat__label">Expenses</span>
            <span className="cycle-stat__value mono">
              {currencySymbol}{expenses.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={`cycle-stat ${net >= 0 ? 'cycle-stat--positive' : 'cycle-stat--negative'}`}>
          <div className="cycle-stat__info">
            <span className="cycle-stat__label">Net</span>
            <span className="cycle-stat__value mono">
              {net >= 0 ? '+' : ''}{currencySymbol}{net.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="cycle-stat cycle-stat--days">
          <div className="cycle-stat__icon">
            <Calendar size={18} />
          </div>
          <div className="cycle-stat__info">
            <span className="cycle-stat__label">Day {cycleInfo.current_day} of {cycleInfo.total_days}</span>
            <span className="cycle-stat__value mono">
              {cycleInfo.days_to_payday} days to payday
            </span>
          </div>
        </div>
      </div>

      {totalBudget > 0 && (
        <div className="cycle-overview__budget-bar">
          <div className="budget-bar__header">
            <span className="budget-bar__label">Budget Usage</span>
            <span className="budget-bar__pct mono">{budgetPct}%</span>
          </div>
          <div className="budget-bar__track">
            <motion.div
              className={`budget-bar__fill ${budgetPct >= 90 ? 'budget-bar__fill--alert' : budgetPct >= 70 ? 'budget-bar__fill--warning' : ''}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPct, 100)}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <div className="budget-bar__footer">
            <span>{currencySymbol}{(budgetStatus?.total_spent || 0).toLocaleString()} spent</span>
            <span>of {currencySymbol}{totalBudget.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
