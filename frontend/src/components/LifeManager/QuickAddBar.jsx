import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { apiPost } from '../../hooks/useApi';
import './QuickAddBar.css';

const TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'event', label: 'Event' },
  { value: 'bill', label: 'Bill' },
  { value: 'document', label: 'Document' },
];

export default function QuickAddBar({ currencySymbol, onSuccess }) {
  const [type, setType] = useState('task');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      if (type === 'task') {
        await apiPost('/api/life/tasks', {
          title: title.trim(),
          due_date: date || undefined,
        });
      } else if (type === 'event') {
        await apiPost('/api/life/events', {
          title: title.trim(),
          date: date || new Date().toISOString().split('T')[0],
        });
      } else if (type === 'bill') {
        const amountInt = Math.round(parseFloat(amount) || 0);
        await apiPost('/api/life/bills', {
          name: title.trim(),
          amount: amountInt,
          due_date: date || undefined,
        });
      } else if (type === 'document') {
        await apiPost('/api/life/documents', {
          name: title.trim(),
          expiry_date: date || undefined,
        });
      }

      setTitle('');
      setDate('');
      setAmount('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      onSuccess();
    } catch (err) {
      setError('Failed to add. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quick-add-bar card">
      <h3 className="chart-title">Quick Add</h3>
      <form className="quick-add-bar__form" onSubmit={handleSubmit}>
        <div className="quick-add-bar__type-row">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`quick-add-bar__type-btn${type === t.value ? ' quick-add-bar__type-btn--active' : ''}`}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="quick-add-bar__inputs">
          <input
            type="text"
            placeholder={type === 'bill' ? 'Bill name...' : type === 'document' ? 'Document name...' : `${type === 'task' ? 'Task' : 'Event'} description...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="quick-add-bar__input"
            disabled={submitting}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="quick-add-bar__date"
            disabled={submitting}
          />
          {type === 'bill' && (
            <div className="quick-add-bar__amount-wrap">
              <span className="quick-add-bar__currency">{currencySymbol}</span>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="quick-add-bar__amount"
                disabled={submitting}
              />
            </div>
          )}
          <button
            type="submit"
            className="quick-add-bar__submit"
            disabled={submitting || !title.trim()}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={16} />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Plus size={16} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {error && <div className="quick-add-bar__error">{error}</div>}
      </form>
    </div>
  );
}
