import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useApi, apiPost, apiDelete } from '../../hooks/useApi';
import './BudgetBars.css';

export default function BudgetBars({ budgetStatus, currencySymbol, onRefresh }) {
  const { data: budgets, refetch: refetchBudgets } = useApi('/api/finance/budgets');
  const { data: availableCategories } = useApi('/api/finance/categories');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [addLimit, setAddLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const statusCategories = budgetStatus?.categories || [];
  const budgetList = budgets || [];

  const handleAdd = async () => {
    if (!addCategory || !addLimit) return;
    setSaving(true);
    try {
      await apiPost('/api/finance/budgets', {
        category: addCategory,
        monthly_limit: parseInt(addLimit) || 0,
      });
      setAddCategory('');
      setAddLimit('');
      setShowAdd(false);
      refetchBudgets();
      onRefresh?.();
    } catch (e) {
      console.error('Failed to add budget:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (category) => {
    if (!editLimit) return;
    setSaving(true);
    try {
      await apiPost('/api/finance/budgets', {
        category,
        monthly_limit: parseInt(editLimit) || 0,
      });
      setEditingId(null);
      refetchBudgets();
      onRefresh?.();
    } catch (e) {
      console.error('Failed to update budget:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/api/finance/budgets/${id}`);
      refetchBudgets();
      onRefresh?.();
    } catch (e) {
      console.error('Failed to delete budget:', e);
    }
  };

  const startEdit = (cat) => {
    const budget = budgetList.find(b => b.category === cat.category);
    setEditingId(cat.category);
    setEditLimit(String(budget?.monthly_limit || cat.budget));
  };

  // Categories not yet budgeted
  const budgetedCategories = new Set(budgetList.map(b => b.category));
  const unbugeted = (availableCategories || []).filter(c => !budgetedCategories.has(c));

  return (
    <div className="budget-bars card">
      <div className="budget-bars__header">
        <h3 className="chart-title">Budget vs Actual</h3>
        <button
          className="budget-bars__add-btn"
          onClick={() => setShowAdd(!showAdd)}
          title="Add budget"
        >
          <Plus size={14} />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="budget-bars__add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              className="budget-bars__add-select"
            >
              <option value="">Category</option>
              {unbugeted.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              {/* Also allow typed categories */}
              {budgetedCategories.size > 0 && <option disabled>-- Already set --</option>}
            </select>
            <input
              type="number"
              value={addLimit}
              onChange={(e) => setAddLimit(e.target.value)}
              placeholder={`Limit (${currencySymbol})`}
              className="budget-bars__add-input"
            />
            <button
              className="budget-bars__add-submit"
              onClick={handleAdd}
              disabled={saving || !addCategory || !addLimit}
            >
              <Check size={14} />
            </button>
            <button
              className="budget-bars__add-cancel"
              onClick={() => setShowAdd(false)}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {statusCategories.length === 0 && !showAdd && (
        <div className="chart-empty">
          No budgets set. Click + to add a category budget.
        </div>
      )}

      <div className="budget-bars__list">
        {statusCategories.map((cat, i) => {
          const isEditing = editingId === cat.category;
          const budget = budgetList.find(b => b.category === cat.category);

          return (
            <div key={cat.category} className="budget-bar-item">
              <div className="budget-bar-item__header">
                <span className="budget-bar-item__name">{cat.category}</span>
                {isEditing ? (
                  <div className="budget-bar-item__edit-row">
                    <input
                      type="number"
                      value={editLimit}
                      onChange={(e) => setEditLimit(e.target.value)}
                      className="budget-bar-item__edit-input"
                      autoFocus
                    />
                    <button className="budget-bar-item__action" onClick={() => handleEdit(cat.category)} disabled={saving}>
                      <Check size={12} />
                    </button>
                    <button className="budget-bar-item__action" onClick={() => setEditingId(null)}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="budget-bar-item__actions">
                    <span className="budget-bar-item__values mono">
                      {currencySymbol}{cat.spent.toLocaleString()} / {currencySymbol}{cat.budget.toLocaleString()}
                    </span>
                    <button className="budget-bar-item__action" onClick={() => startEdit(cat)} title="Edit">
                      <Pencil size={12} />
                    </button>
                    {budget && (
                      <button className="budget-bar-item__action budget-bar-item__action--delete" onClick={() => handleDelete(budget.id)} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
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
          );
        })}
      </div>
    </div>
  );
}
