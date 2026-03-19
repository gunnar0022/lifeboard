import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  MessageSquare, Clock, Stethoscope,
} from 'lucide-react';
import './ConcernsTracker.css';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

function ConcernLog({ log }) {
  const isFleet = log.source === 'fleet_visit';
  return (
    <div className={`concern-log ${isFleet ? 'concern-log--fleet' : ''}`}>
      <div className="concern-log__meta">
        <span className="concern-log__source">
          {isFleet ? <Stethoscope size={11} /> : <MessageSquare size={11} />}
          {isFleet ? 'Fleet' : 'You'}
        </span>
        <span className="concern-log__date mono">{formatDate(log.created_at)}</span>
      </div>
      <p className="concern-log__content">{log.content}</p>
    </div>
  );
}

function ActiveConcern({ concern }) {
  const [expanded, setExpanded] = useState(false);
  const days = daysSince(concern.created_at);
  const logCount = concern.logs?.length || concern.log_count || 0;
  const lastLog = concern.last_log_at || (concern.logs?.[0]?.created_at);

  return (
    <div className="concern-item concern-item--active">
      <button className="concern-item__header" onClick={() => setExpanded(!expanded)}>
        <div className="concern-item__title-row">
          <AlertCircle size={14} className="concern-item__icon concern-item__icon--active" />
          <span className="concern-item__title">{concern.title}</span>
        </div>
        <div className="concern-item__meta">
          <span className="concern-item__stat">
            <Clock size={11} /> {days}d
          </span>
          <span className="concern-item__stat">
            <MessageSquare size={11} /> {logCount}
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="concern-item__detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {concern.description && (
              <p className="concern-item__description">{concern.description}</p>
            )}
            {concern.logs && concern.logs.length > 0 ? (
              <div className="concern-item__logs">
                {concern.logs.map(log => (
                  <ConcernLog key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <p className="concern-item__empty-logs">No log entries yet.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResolvedConcern({ concern }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="concern-item concern-item--resolved">
      <button className="concern-item__header" onClick={() => setExpanded(!expanded)}>
        <div className="concern-item__title-row">
          <CheckCircle2 size={14} className="concern-item__icon concern-item__icon--resolved" />
          <span className="concern-item__title">{concern.title}</span>
        </div>
        <div className="concern-item__meta">
          <span className="concern-item__dates mono">
            {formatDate(concern.created_at)} &rarr; {formatDate(concern.resolved_at)}
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="concern-item__detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {concern.resolution_summary && (
              <p className="concern-item__resolution">{concern.resolution_summary}</p>
            )}
            {concern.compressed_at && (
              <p className="concern-item__compressed">Logs archived {formatDate(concern.compressed_at)}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConcernsTracker({ concerns }) {
  const [showResolved, setShowResolved] = useState(false);

  const active = concerns?.active || [];
  const resolved = concerns?.resolved || [];
  const totalCount = active.length + resolved.length;

  if (totalCount === 0) return null;

  return (
    <div className="concerns-tracker card">
      <div className="concerns-tracker__header">
        <h3 className="chart-title">
          <Stethoscope size={16} />
          Health Concerns
          <span className="concerns-tracker__count">{active.length} active</span>
        </h3>
      </div>

      {active.length > 0 && (
        <div className="concerns-tracker__section">
          {active.map(c => (
            <ActiveConcern key={c.id} concern={c} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="concerns-tracker__resolved-section">
          <button
            className="concerns-tracker__resolved-toggle"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Resolved ({resolved.length})
          </button>

          <AnimatePresence>
            {showResolved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {resolved.map(c => (
                  <ResolvedConcern key={c.id} concern={c} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
