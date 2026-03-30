import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import AccountsStrip from './AccountsStrip';
import CycleOverview from './CycleOverview';
import SpendingChart from './SpendingChart';
import CycleTrend from './CycleTrend';
import BudgetBars from './BudgetBars';
import InsightsSection from './InsightsSection';
import TransactionList from './TransactionList';
import QuickAddForm from './QuickAddForm';
import RecurringManager from './RecurringManager';
import './FinancePanel.css';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function FinancePanel() {
  const { data: accounts, loading: accLoading, refetch: refetchAccounts } = useApi('/api/finance/accounts');
  const { data: overview, refetch: refetchOverview } = useApi('/api/finance/accounts/overview');
  const { data: cycle, refetch: refetchCycle } = useApi('/api/finance/cycle');
  const { data: cycleInfo } = useApi('/api/finance/cycle/info');
  const { data: budgetStatus, refetch: refetchBudget } = useApi('/api/finance/budget-status');
  const { data: spending, refetch: refetchSpending } = useApi('/api/finance/spending-by-category');
  const { data: trend } = useApi('/api/finance/cycle-trend');
  const { data: transactions, refetch: refetchTxns } = useApi('/api/finance/transactions?limit=25');
  const { data: transfers, refetch: refetchTransfers } = useApi('/api/finance/transfers?limit=10');
  const { data: recurring, refetch: refetchRecurring } = useApi('/api/finance/recurring');
  const { data: categories } = useApi('/api/finance/categories');
  const { data: config } = useApi('/api/config');

  const refetchAll = useCallback(() => {
    refetchAccounts();
    refetchOverview();
    refetchCycle();
    refetchBudget();
    refetchSpending();
    refetchTxns();
    refetchTransfers();
    refetchRecurring();
  }, [refetchAccounts, refetchOverview, refetchCycle, refetchBudget, refetchSpending, refetchTxns, refetchTransfers, refetchRecurring]);

  const hasAccounts = accounts && accounts.length > 0;
  // Determine display currency from accounts (most common), falling back to config
  const configCurrency = config?.primary_currency || 'JPY';
  const currency = hasAccounts
    ? (accounts.filter(a => a.currency === 'JPY').length >= accounts.filter(a => a.currency === 'USD').length ? 'JPY' : 'USD')
    : configCurrency;
  const currencySymbol = config?.currency_symbol || '$';

  if (accLoading) {
    return (
      <div className="finance-panel">
        <div className="finance-panel__header">
          <div className="finance-panel__title-group">
            <span className="finance-panel__icon"><DollarSign size={24} /></span>
            <h2 className="finance-panel__title">Finance</h2>
          </div>
        </div>
        <div className="finance-panel__loading">
          <div className="skeleton" style={{ height: 80, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 120, width: '100%', borderRadius: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="skeleton" style={{ height: 250, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 250, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccounts) {
    return (
      <motion.div
        className="finance-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="finance-panel__header">
          <div className="finance-panel__title-group">
            <span className="finance-panel__icon"><DollarSign size={24} /></span>
            <h2 className="finance-panel__title">Finance</h2>
          </div>
          <p className="finance-panel__subtitle">Budget, spending, income, recurring costs</p>
        </div>
        <div className="finance-panel__empty">
          <div className="finance-panel__empty-icon"><DollarSign size={40} /></div>
          <h3>No accounts set up yet</h3>
          <p>
            Start by adding an account below, or message the Telegram bot
            something like "add my bank account".
          </p>
          <QuickAddForm
            mode="account"
            accounts={[]}
            categories={categories || []}
            currency={currency}
            onSuccess={refetchAll}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="finance-panel"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="finance-panel__header">
        <div className="finance-panel__title-group">
          <span className="finance-panel__icon"><DollarSign size={24} /></span>
          <h2 className="finance-panel__title">Finance</h2>
        </div>
      </motion.div>

      {/* Section A — Accounts overview */}
      <motion.div variants={fadeUp}>
        <AccountsStrip
          overview={overview}
          currency={currency}
          currencySymbol={currencySymbol}
          onRefresh={refetchAll}
          accounts={accounts}
          categories={categories || []}
        />
      </motion.div>

      {/* Section B — Cycle overview */}
      <motion.div variants={fadeUp}>
        <CycleOverview
          cycle={cycle}
          cycleInfo={cycleInfo}
          budgetStatus={budgetStatus}
          currencySymbol={currencySymbol}
        />
      </motion.div>

      {/* Section C — Visualizations */}
      <motion.div variants={fadeUp} className="finance-panel__charts">
        <SpendingChart
          spending={spending}
          currencySymbol={currencySymbol}
        />
        <CycleTrend
          trend={trend}
          currencySymbol={currencySymbol}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <BudgetBars
          budgetStatus={budgetStatus}
          currencySymbol={currencySymbol}
        />
      </motion.div>

      {/* Section C.5 — Insights (historical trends & compressed cycle data) */}
      <motion.div variants={fadeUp}>
        <InsightsSection currencySymbol={currencySymbol} />
      </motion.div>

      {/* Section D — Data entry & transaction list */}
      <motion.div variants={fadeUp} className="finance-panel__section-break">
        <QuickAddForm
          mode="transaction"
          accounts={accounts || []}
          categories={categories || []}
          currency={currency}
          onSuccess={refetchAll}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <RecurringManager
          recurring={recurring || []}
          currencySymbol={currencySymbol}
          onRefresh={refetchAll}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <TransactionList
          transactions={transactions || []}
          transfers={transfers || []}
          currencySymbol={currencySymbol}
          currency={currency}
        />
      </motion.div>
    </motion.div>
  );
}
