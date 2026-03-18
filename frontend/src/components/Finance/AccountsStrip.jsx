import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Wallet, TrendingUp, Banknote, ArrowLeftRight, Plus, X } from 'lucide-react';
import { useApi, apiPost } from '../../hooks/useApi';
import './AccountsStrip.css';

const TYPE_ICONS = {
  bank: Landmark,
  wallet: Wallet,
  investment: TrendingUp,
  cash: Banknote,
  transfer_service: ArrowLeftRight,
};

function formatBalance(amount, currency) {
  if (currency === 'JPY') return `¥${amount.toLocaleString()}`;
  return `$${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function NetWorth({ byCurrency, fxRate, investingSnapshot }) {
  if (!investingSnapshot || !investingSnapshot.total_value) return null;
  if (!byCurrency || byCurrency.length === 0) return null;

  // Calculate bank total in JPY
  let bankTotalJpy = 0;
  for (const g of byCurrency) {
    if (g.currency === 'JPY') {
      bankTotalJpy += g.total;
    } else if (g.currency === 'USD' && fxRate) {
      bankTotalJpy += Math.round((g.total / 100) * fxRate.usd_to_jpy);
    }
  }

  // Investing snapshot total_value is already in smallest unit of its currency
  let investTotalJpy = investingSnapshot.total_value;
  if (investingSnapshot.currency === 'USD' && fxRate) {
    investTotalJpy = Math.round((investingSnapshot.total_value / 100) * fxRate.usd_to_jpy);
  }

  const netWorth = bankTotalJpy + investTotalJpy;

  return (
    <div className="accounts-strip__total accounts-strip__total--net-worth">
      <span className="accounts-strip__total-label">Net Worth</span>
      <span className="accounts-strip__total-value accounts-strip__total-value--net mono">
        {formatBalance(netWorth, 'JPY')}
      </span>
    </div>
  );
}

function CombinedTotal({ byCurrency, fxRate }) {
  const [targetCurrency, setTargetCurrency] = useState('JPY');

  if (!fxRate || !byCurrency || byCurrency.length < 2) return null;

  const jpyGroup = byCurrency.find(g => g.currency === 'JPY');
  const usdGroup = byCurrency.find(g => g.currency === 'USD');
  if (!jpyGroup || !usdGroup) return null;

  let combined;
  if (targetCurrency === 'JPY') {
    // Convert USD (stored in cents) to JPY
    const usdInJpy = Math.round((usdGroup.total / 100) * fxRate.usd_to_jpy);
    combined = jpyGroup.total + usdInJpy;
  } else {
    // Convert JPY to USD cents
    const jpyInUsdCents = Math.round(jpyGroup.total * fxRate.jpy_to_usd * 100);
    combined = usdGroup.total + jpyInUsdCents;
  }

  return (
    <div className="accounts-strip__total accounts-strip__total--combined">
      <span className="accounts-strip__total-label">Combined</span>
      <span className="accounts-strip__total-value mono">
        {formatBalance(combined, targetCurrency)}
      </span>
      <button
        className="accounts-strip__fx-toggle"
        onClick={() => setTargetCurrency(t => t === 'JPY' ? 'USD' : 'JPY')}
        title={`1 USD = ¥${fxRate.usd_to_jpy?.toLocaleString()} (${fxRate.date})`}
      >
        {targetCurrency}
      </button>
    </div>
  );
}

export default function AccountsStrip({ overview, currency, currencySymbol, onRefresh, accounts, categories }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: fxRate } = useApi('/api/finance/exchange-rate');
  const { data: investingSnapshot } = useApi('/api/investing/latest-snapshot');

  if (!overview) return null;

  return (
    <div className="accounts-strip">
      <div className="accounts-strip__cards">
        {overview.accounts?.map((acc, i) => {
          const Icon = TYPE_ICONS[acc.account_type] || Landmark;
          return (
            <motion.div
              key={acc.id}
              className="account-card card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div className="account-card__icon">
                <Icon size={18} />
              </div>
              <div className="account-card__info">
                <span className="account-card__name">{acc.name}</span>
                <span className="account-card__balance mono">
                  {formatBalance(acc.current_balance, acc.currency)}
                </span>
              </div>
              <span className="account-card__type">{acc.account_type}</span>
            </motion.div>
          );
        })}

        <button
          className="account-card account-card--add"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={20} />
          <span>Add account</span>
        </button>
      </div>

      {/* Currency totals */}
      <div className="accounts-strip__totals">
        {overview.by_currency?.map((group) => (
          <div key={group.currency} className="accounts-strip__total">
            <span className="accounts-strip__total-label">Total {group.currency}</span>
            <span className="accounts-strip__total-value mono">
              {formatBalance(group.total, group.currency)}
            </span>
          </div>
        ))}
        <CombinedTotal byCurrency={overview.by_currency} fxRate={fxRate} />
        <NetWorth byCurrency={overview.by_currency} fxRate={fxRate} investingSnapshot={investingSnapshot} />
      </div>

      {/* Add account modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddAccountModal
            onClose={() => setShowAddForm(false)}
            onSuccess={() => { setShowAddForm(false); onRefresh(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddAccountModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const balVal = balance ? parseInt(balance, 10) : 0;
      await apiPost('/api/finance/accounts', {
        name: name.trim(),
        currency,
        account_type: type,
        initial_balance: currency === 'USD' ? Math.round(balVal * 100) : balVal,
        notes: notes.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Add Account</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Aki Gin" autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="JPY">JPY (¥)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="wallet">Wallet</option>
                <option value="investment">Investment</option>
                <option value="transfer_service">Transfer Service</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Initial Balance ({currency === 'JPY' ? '¥' : '$'})</label>
            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Main bank for salary" />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
