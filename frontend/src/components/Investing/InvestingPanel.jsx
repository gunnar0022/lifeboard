import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Check } from 'lucide-react';
import { useApi, apiPost } from '../../hooks/useApi';
import PortfolioTrend from './PortfolioTrend';
import AllocationChart from './AllocationChart';
import HoldingsTable from './HoldingsTable';
import ProjectionCalculator from './ProjectionCalculator';
import './InvestingPanel.css';

function AddHoldingForm({ onSuccess }) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState('stock');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('JPY');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || !name.trim()) {
      setError('Symbol and name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const holding = await apiPost('/api/investing/holdings', {
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        asset_class: assetClass,
        currency,
      });

      if (shares && price && holding?.id) {
        const priceInt = currency === 'USD'
          ? Math.round(parseFloat(price) * 100)
          : Math.round(parseFloat(price));
        const totalAmount = Math.round(parseFloat(shares) * priceInt);
        await apiPost('/api/investing/transactions', {
          holding_id: holding.id,
          type: 'buy',
          shares: parseFloat(shares),
          price_per_share: priceInt,
          total_amount: totalAmount,
          currency,
          date: dateVal,
        });
      }

      setSymbol('');
      setName('');
      setShares('');
      setPrice('');
      setDateVal(new Date().toISOString().split('T')[0]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess();
    } catch (err) {
      setError('Failed to add holding');
    } finally {
      setSaving(false);
    }
  };

  const sym = currency === 'JPY' ? '¥' : '$';

  return (
    <form className="investing-add-form" onSubmit={handleSubmit}>
      <div className="investing-add-form__row">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Symbol (e.g. AAPL)"
          className="investing-add-form__input investing-add-form__input--symbol"
          disabled={saving}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Apple Inc.)"
          className="investing-add-form__input"
          disabled={saving}
        />
        <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} className="investing-add-form__select" disabled={saving}>
          <option value="stock">Stock</option>
          <option value="etf">ETF</option>
          <option value="crypto">Crypto</option>
          <option value="bond">Bond</option>
          <option value="other">Other</option>
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="investing-add-form__select" disabled={saving}>
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="investing-add-form__row">
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="Shares (optional)"
          className="investing-add-form__input investing-add-form__input--num"
          step="any"
          disabled={saving}
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={`Price per share ${sym} (optional)`}
          className="investing-add-form__input investing-add-form__input--num"
          step={currency === 'USD' ? '0.01' : '1'}
          disabled={saving}
        />
        <input
          type="date"
          value={dateVal}
          onChange={(e) => setDateVal(e.target.value)}
          className="investing-add-form__input investing-add-form__input--date"
          disabled={saving}
        />
        <button type="submit" className="btn btn--primary" disabled={saving || !symbol.trim() || !name.trim()}>
          {saving ? '...' : <><Plus size={16} /> Add</>}
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      <AnimatePresence>
        {success && (
          <motion.div
            className="investing-add-form__success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} /> Holding added!
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function InvestingPanel() {
  const { data: portfolio, loading: portfolioLoading, refetch: refetchPortfolio } = useApi('/api/investing/portfolio', { panelKey: 'investing' });
  const { data: snapshots } = useApi('/api/investing/snapshots?days=365', { panelKey: 'investing' });
  const { data: holdings, refetch: refetchHoldings } = useApi('/api/investing/holdings', { panelKey: 'investing' });
  const { data: config } = useApi('/api/config');
  const { data: fxRate } = useApi('/api/finance/exchange-rate');

  const [displayCurrency, setDisplayCurrency] = useState('JPY');

  const currencySymbol = displayCurrency === 'JPY' ? '¥' : '$';
  const hasData = portfolio && portfolio.holding_count > 0;

  if (portfolioLoading) {
    return (
      <div className="investing-panel">
        <div className="investing-panel__header">
          <div className="investing-panel__title-group">
            <span className="investing-panel__icon"><TrendingUp size={24} /></span>
            <h2 className="investing-panel__title">Investing</h2>
          </div>
        </div>
        <div className="investing-panel__loading">
          <div className="skeleton" style={{ height: 80, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 240, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <motion.div
        className="investing-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="investing-panel__header">
          <div className="investing-panel__title-group">
            <span className="investing-panel__icon"><TrendingUp size={24} /></span>
            <h2 className="investing-panel__title">Investing</h2>
          </div>
          <p className="investing-panel__subtitle">Portfolio tracking, allocation, and strategy</p>
        </div>
        <div className="investing-panel__empty">
          <div className="investing-panel__empty-icon"><TrendingUp size={40} /></div>
          <h3>No holdings yet</h3>
          <p>
            Add your first holding below, or message the Telegram bot
            something like "I bought 10 shares of AAPL at $190"
          </p>
          <AddHoldingForm onSuccess={() => { refetchHoldings(); refetchPortfolio(); }} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="investing-panel"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="investing-panel__header">
        <div className="investing-panel__title-group">
          <span className="investing-panel__icon"><TrendingUp size={24} /></span>
          <h2 className="investing-panel__title">Investing</h2>
        </div>
        <button
          className="investing-panel__currency-toggle"
          onClick={() => setDisplayCurrency(c => c === 'JPY' ? 'USD' : 'JPY')}
          title={fxRate ? `1 USD = ¥${fxRate.usd_to_jpy?.toLocaleString()}` : ''}
        >
          {displayCurrency}
        </button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <PortfolioTrend
          snapshots={snapshots || []}
          portfolio={portfolio}
          currencySymbol={currencySymbol}
          displayCurrency={displayCurrency}
          fxRate={fxRate}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <AllocationChart
          breakdown={portfolio.breakdown}
          totalValue={portfolio.total_value}
          currencySymbol={currencySymbol}
          displayCurrency={displayCurrency}
          fxRate={fxRate}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <HoldingsTable
          holdings={holdings || []}
          currencySymbol={currencySymbol}
          displayCurrency={displayCurrency}
          fxRate={fxRate}
          onRefresh={() => { refetchHoldings(); refetchPortfolio(); }}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="investing-panel__add-section card">
        <h3 className="chart-title">Add Holding</h3>
        <AddHoldingForm onSuccess={() => { refetchHoldings(); refetchPortfolio(); }} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <ProjectionCalculator
          currentValue={portfolio.total_value}
          currencySymbol={currencySymbol}
          displayCurrency={displayCurrency}
          fxRate={fxRate}
        />
      </motion.div>
    </motion.div>
  );
}
