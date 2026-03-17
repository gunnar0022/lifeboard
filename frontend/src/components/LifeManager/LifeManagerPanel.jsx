import { useCallback } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import TimelineStrip from './TimelineStrip';
import BillsTracker from './BillsTracker';
import TaskBoard from './TaskBoard';
import DocumentRegistry from './DocumentRegistry';
import QuickAddBar from './QuickAddBar';
import './LifeManagerPanel.css';

export default function LifeManagerPanel() {
  const { data: timeline, refetch: refetchTimeline } = useApi('/api/life/timeline');
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useApi('/api/life/tasks?limit=50');
  const { data: bills, loading: billsLoading, refetch: refetchBills } = useApi('/api/life/bills');
  const { data: documents, refetch: refetchDocs } = useApi('/api/life/documents');
  const { data: config } = useApi('/api/config');

  const refetchAll = useCallback(() => {
    refetchTimeline();
    refetchTasks();
    refetchBills();
    refetchDocs();
  }, [refetchTimeline, refetchTasks, refetchBills, refetchDocs]);

  const currencySymbol = config?.currency_symbol || '$';

  const hasData = (tasks && tasks.length > 0) || (bills && bills.length > 0) || (documents && documents.length > 0);
  const isLoading = tasksLoading || billsLoading || (!tasks && !bills && !documents);

  if (isLoading) {
    return (
      <div className="life-panel">
        <div className="life-panel__header">
          <div className="life-panel__title-group">
            <span className="life-panel__icon"><CalendarCheck size={24} /></span>
            <h2 className="life-panel__title">Life Manager</h2>
          </div>
        </div>
        <div className="life-panel__loading">
          <div className="skeleton" style={{ height: 80, width: '100%', borderRadius: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="skeleton" style={{ height: 250, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 250, borderRadius: 12 }} />
          </div>
          <div className="skeleton" style={{ height: 120, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="life-panel">
        <div className="life-panel__header">
          <div className="life-panel__title-group">
            <span className="life-panel__icon"><CalendarCheck size={24} /></span>
            <h2 className="life-panel__title">Life Manager</h2>
          </div>
          <p className="life-panel__subtitle">
            Calendar, bills, tasks, insurance, documents
          </p>
        </div>

        <div className="life-panel__empty">
          <div className="life-panel__empty-icon">
            <CalendarCheck size={40} />
          </div>
          <h3>No items tracked yet</h3>
          <p>
            Get started by adding a task, bill, or document below, or message
            the Telegram bot with <code>/l</code>.
          </p>
        </div>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <QuickAddBar
            currencySymbol={currencySymbol}
            onSuccess={refetchAll}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="life-panel">
      <div className="life-panel__header">
        <div className="life-panel__title-group">
          <span className="life-panel__icon"><CalendarCheck size={24} /></span>
          <h2 className="life-panel__title">Life Manager</h2>
        </div>
      </div>

      {/* Section A — Timeline */}
      <TimelineStrip timeline={timeline || []} />

      {/* Section B — Bills & Tasks (2-column grid) */}
      <div className="life-panel__grid">
        <BillsTracker
          bills={bills || []}
          currencySymbol={currencySymbol}
          onRefresh={refetchAll}
        />
        <TaskBoard
          tasks={tasks || []}
          onRefresh={refetchAll}
        />
      </div>

      {/* Section C — Quick Add & Documents */}
      <QuickAddBar
        currencySymbol={currencySymbol}
        onSuccess={refetchAll}
      />

      <DocumentRegistry
        documents={documents || []}
      />
    </div>
  );
}
