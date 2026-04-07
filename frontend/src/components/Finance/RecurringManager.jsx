import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Clock, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '../../hooks/useApi';
import './RecurringManager.css';

function AddRecurringForm({ accounts, categories, currency, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDue, setNextDue] = useState('');
  const [isAutopay, setIsAutopay] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || !accountId || !category || !nextDue) return;
    setSaving(true);
    const acc = accounts.find(a => String(a.id) === String(accountId));
    const accCurrency = acc?.currency || currency;
    let amountInt = parseInt(amount);
    if (accCurrency === 'USD') amountInt = Math.round(parseFloat(amount) * 100);
    try {
      await apiPost('/api/finance/recurring', {
        name: name.trim(),
        amount: amountInt,
        account_id: parseInt(accountId),
        category,
        frequency,
        next_due: nextDue,
        is_autopay: isAutopay,
      });
      onSave();
    } catch (e) {
      console.error('Failed to add recurring:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="recurring-form" onSubmit={handleSubmit}>
      <div className="recurring-form__row">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Rent)" className="recurring-form__input" disabled={saving} />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="recurring-form__input recurring-form__input--num" step={currency === 'USD' ? '0.01' : '1'} disabled={saving} />
      </div>
      <div className="recurring-form__row">
        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="recurring-form__select" disabled={saving}>
          <option value="">Account</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="recurring-form__select" disabled={saving}>
          <option value="">Category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={frequency} onChange={e => setFrequency(e.target.value)} className="recurring-form__select" disabled={saving}>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="recurring-form__row">
        <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} className="recurring-form__input" disabled={saving} />
        <label className="recurring-form__checkbox">
          <input type="checkbox" checked={isAutopay} onChange={e => setIsAutopay(e.target.checked)} />
          Autopay
        </label>
        <button type="submit" className="recurring-form__submit" disabled={saving || !name.trim() || !amount || !accountId || !category || !nextDue}>
          <Check size={14} /> Add
        </button>
        <button type="button" className="recurring-form__cancel" onClick={onCancel}>
          <X size={14} />
        </button>
      </div>
    </form>
  );
}

function EditRow({ item, accounts, categories, currency, onSave, onCancel }) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.account_currency === 'USD' ? item.amount / 100 : item.amount));
  const [accountId, setAccountId] = useState(String(item.account_id));
  const [category, setCategory] = useState(item.category);
  const [frequency, setFrequency] = useState(item.frequency);
  const [nextDue, setNextDue] = useState(item.next_due);
  const [isAutopay, setIsAutopay] = useState(item.is_autopay);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const acc = accounts.find(a => String(a.id) === String(accountId));
    const accCurrency = acc?.currency || currency;
    let amountInt = parseInt(amount);
    if (accCurrency === 'USD') amountInt = Math.round(parseFloat(amount) * 100);
    try {
      await apiPut(`/api/finance/recurring/${item.id}`, {
        name: name.trim(),
        amount: amountInt,
        account_id: parseInt(accountId),
        category,
        frequency,
        next_due: nextDue,
        is_autopay: isAutopay,
      });
      onSave();
    } catch (e) {
      console.error('Failed to update recurring:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recurring-form recurring-form--inline">
      <div className="recurring-form__row">
        <input value={name} onChange={e => setName(e.target.value)} className="recurring-form__input" disabled={saving} />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="recurring-form__input recurring-form__input--num" step={currency === 'USD' ? '0.01' : '1'} disabled={saving} />
        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="recurring-form__select" disabled={saving}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="recurring-form__row">
        <select value={category} onChange={e => setCategory(e.target.value)} className="recurring-form__select" disabled={saving}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={frequency} onChange={e => setFrequency(e.target.value)} className="recurring-form__select" disabled={saving}>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} className="recurring-form__input" disabled={saving} />
        <label className="recurring-form__checkbox">
          <input type="checkbox" checked={isAutopay} onChange={e => setIsAutopay(e.target.checked)} />
          Autopay
        </label>
        <button className="recurring-form__submit" onClick={handleSave} disabled={saving}>
          <Check size={14} />
        </button>
        <button className="recurring-form__cancel" onClick={onCancel}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function RecurringManager({ recurring, accounts, categories, currencySymbol, currency, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/api/finance/recurring/${id}`);
      setDeletingId(null);
      onRefresh();
    } catch (e) {
      console.error('Failed to delete recurring:', e);
    }
  };

  return (
    <div className="recurring-manager card">
      <div className="recurring-manager__header">
        <h3 className="chart-title">Recurring Expenses</h3>
        <button className="recurring-manager__add-btn" onClick={() => setShowAdd(!showAdd)} title="Add recurring expense">
          <Plus size={14} />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <AddRecurringForm
              accounts={accounts || []}
              categories={categories || []}
              currency={currency}
              onSave={() => { setShowAdd(false); onRefresh(); }}
              onCancel={() => setShowAdd(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(!recurring || recurring.length === 0) && !showAdd && (
        <div className="chart-empty">No recurring expenses. Click + to add one.</div>
      )}

      <div className="recurring-list">
        {(recurring || []).map((item, i) => {
          if (editingId === item.id) {
            return (
              <EditRow
                key={item.id}
                item={item}
                accounts={accounts || []}
                categories={categories || []}
                currency={currency}
                onSave={() => { setEditingId(null); onRefresh(); }}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          return (
            <motion.div
              key={item.id}
              className={`recurring-item ${deletingId === item.id ? 'recurring-item--deleting' : ''}`}
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
              <div className="recurring-item__actions">
                {deletingId === item.id ? (
                  <>
                    <button className="recurring-item__action recurring-item__action--confirm" onClick={() => handleDelete(item.id)} title="Confirm delete">
                      <Trash2 size={12} />
                    </button>
                    <button className="recurring-item__action" onClick={() => setDeletingId(null)} title="Cancel">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="recurring-item__action" onClick={() => setEditingId(item.id)} title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button className="recurring-item__action recurring-item__action--delete" onClick={() => setDeletingId(item.id)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
