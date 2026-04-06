import { useState } from 'react';
import { Plus, Check, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../../hooks/useApi';
import './QuickAddForm.css';

export default function QuickAddForm({ mode, accounts, categories, currency, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [txType, setTxType] = useState('expense'); // 'expense' | 'income' | 'transfer'
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Account form fields
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('JPY');
  const [accType, setAccType] = useState('bank');
  const [accBalance, setAccBalance] = useState('');

  const isTransfer = txType === 'transfer';
  const isIncome = txType === 'income';

  // Determine currency from selected account, not global config
  const selectedAccount = accounts.find(a => String(a.id) === String(isTransfer ? fromAccountId : accountId));
  const accountCurrency = selectedAccount?.currency || currency;
  const sym = accountCurrency === 'JPY' ? '¥' : '$';

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      setError('Amount is required');
      return;
    }

    if (isTransfer) {
      if (!fromAccountId || !accountId) {
        setError('Select both From and To accounts');
        return;
      }
      if (fromAccountId === accountId) {
        setError('From and To accounts must be different');
        return;
      }
    } else {
      if (!accountId || !category) {
        setError('Amount, account, and category are required');
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      if (isTransfer) {
        const fromAccount = accounts.find(a => String(a.id) === String(fromAccountId));
        const fromCurrency = fromAccount?.currency || currency;
        let amountInt = parseInt(amount, 10);
        if (fromCurrency === 'USD') amountInt = Math.round(parseFloat(amount) * 100);

        await apiPost('/api/finance/transfers', {
          from_account_id: parseInt(fromAccountId, 10),
          to_account_id: parseInt(accountId, 10),
          from_amount: amountInt,
          description: description.trim() || null,
          date: dateVal,
        });
        setSuccessMsg('Transfer recorded!');
      } else {
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
        setSuccessMsg('Transaction added!');
      }
      // Reset
      setAmount('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess();
    } catch (err) {
      setError(isTransfer ? 'Failed to record transfer' : 'Failed to add transaction');
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
      <div className="quick-add__type-row">
        <button
          type="button"
          className={`quick-add__type-btn ${txType === 'expense' ? 'quick-add__type-btn--active quick-add__type-btn--expense' : ''}`}
          onClick={() => setTxType('expense')}
        >-</button>
        <button
          type="button"
          className={`quick-add__type-btn ${txType === 'income' ? 'quick-add__type-btn--active quick-add__type-btn--income' : ''}`}
          onClick={() => setTxType('income')}
        >+</button>
        <button
          type="button"
          className={`quick-add__type-btn ${txType === 'transfer' ? 'quick-add__type-btn--active quick-add__type-btn--transfer' : ''}`}
          onClick={() => setTxType('transfer')}
        ><ArrowLeftRight size={14} /></button>
      </div>
      <div className="quick-add__row">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Amount (${sym})`}
          className="quick-add__input quick-add__input--num"
          step={accountCurrency === 'USD' ? '0.01' : '1'}
        />
        {isTransfer ? (
          <>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="quick-add__select"
            >
              <option value="">From</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <span className="quick-add__arrow">→</span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="quick-add__select"
            >
              <option value="">To</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </>
        ) : (
          <>
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
          </>
        )}
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
            <Check size={16} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
