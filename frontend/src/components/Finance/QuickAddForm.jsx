import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../../hooks/useApi';
import './QuickAddForm.css';

export default function QuickAddForm({ mode, accounts, categories, currency, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [isIncome, setIsIncome] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Account form fields
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('JPY');
  const [accType, setAccType] = useState('bank');
  const [accBalance, setAccBalance] = useState('');

  // Determine currency from selected account, not global config
  const selectedAccount = accounts.find(a => String(a.id) === String(accountId));
  const accountCurrency = selectedAccount?.currency || currency;
  const sym = accountCurrency === 'JPY' ? '¥' : '$';

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !accountId || !category) {
      setError('Amount, account, and category are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let amountInt = parseInt(amount, 10);
      if (accountCurrency === 'USD') amountInt = Math.round(parseFloat(amount) * 100);
      if (!isIncome) amountInt = -Math.abs(amountInt);
      else amountInt = Math.abs(amountInt);

      await apiPost('/api/finance/transactions', {
        amount: amountInt,
        account_id: parseInt(accountId, 10),
        category,
        description: description.trim() || null,
        date: dateVal,
      });
      // Reset
      setAmount('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess();
    } catch (err) {
      setError('Failed to add transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accName.trim()) { setError('Account name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const balVal = accBalance ? parseInt(accBalance, 10) : 0;
      await apiPost('/api/finance/accounts', {
        name: accName.trim(),
        currency: accCurrency,
        account_type: accType,
        initial_balance: accCurrency === 'USD' ? Math.round(balVal * 100) : balVal,
      });
      setAccName('');
      setAccBalance('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess();
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'account') {
    return (
      <form className="quick-add" onSubmit={handleAccountSubmit}>
        <h4 className="quick-add__title">Add Your First Account</h4>
        <div className="quick-add__row">
          <input
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
            placeholder="Account name (e.g., Aki Gin)"
            className="quick-add__input quick-add__input--wide"
          />
          <select value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} className="quick-add__select">
            <option value="JPY">JPY</option>
            <option value="USD">USD</option>
          </select>
          <select value={accType} onChange={(e) => setAccType(e.target.value)} className="quick-add__select">
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
            <option value="wallet">Wallet</option>
            <option value="investment">Investment</option>
            <option value="transfer_service">Transfer</option>
          </select>
          <input
            type="number"
            value={accBalance}
            onChange={(e) => setAccBalance(e.target.value)}
            placeholder="Balance"
            className="quick-add__input quick-add__input--num"
          />
          <button type="submit" className="btn btn--primary" disabled={saving}>
            <Plus size={16} /> Add
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
        <AnimatePresence>
          {success && (
            <motion.div
              className="quick-add__success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Check size={16} /> Account created!
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    );
  }

  return (
    <form className="quick-add card" onSubmit={handleTransactionSubmit}>
      <h4 className="quick-add__title">Quick Add Transaction</h4>
      <div className="quick-add__row">
        <button
          type="button"
          className={`quick-add__toggle ${isIncome ? 'quick-add__toggle--income' : 'quick-add__toggle--expense'}`}
          onClick={() => setIsIncome(!isIncome)}
        >
          {isIncome ? '+' : '-'}
        </button>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Amount (${sym})`}
          className="quick-add__input quick-add__input--num"
          step={accountCurrency === 'USD' ? '0.01' : '1'}
        />
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="quick-add__select"
        >
          <option value="">Account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="quick-add__select"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="quick-add__input"
        />
        <input
          type="date"
          value={dateVal}
          onChange={(e) => setDateVal(e.target.value)}
          className="quick-add__input quick-add__input--date"
        />
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? '...' : <><Plus size={16} /> Add</>}
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      <AnimatePresence>
        {success && (
          <motion.div
            className="quick-add__success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} /> Transaction added!
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
