import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import PortfolioTrend from './PortfolioTrend';
import AllocationChart from './AllocationChart';
import HoldingsTable from './HoldingsTable';
import ProjectionCalculator from './ProjectionCalculator';
import './InvestingPanel.css';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function InvestingPanel() {
  const { data: portfolio, loading: portfolioLoading } = useApi('/api/investing/portfolio', { panelKey: 'investing' });
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
            Message the Telegram bot to add your first investment.
            Try: "I bought 10 shares of AAPL at $190"
          </p>
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
        />
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
