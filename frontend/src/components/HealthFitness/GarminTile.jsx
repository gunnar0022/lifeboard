import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Moon, Footprints, Activity, AlertTriangle, Dumbbell } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import './GarminTile.css';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return 'never';
  const diff = (Date.now() - new Date(isoStr).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function SleepDots({ score }) {
  if (!score) return null;
  const filled = Math.round(score / 20);
  return (
    <span className="garmin-tile__dots">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`garmin-tile__dot ${i <= filled ? 'garmin-tile__dot--filled' : ''}`} />
      ))}
    </span>
  );
}

export default function GarminTile() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState('compact');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/garmin/summary?range=${range}`).then(r => r.ok ? r.json() : null),
      fetch('/api/garmin/status').then(r => r.ok ? r.json() : null),
    ]).then(([summary, stat]) => {
      setData(summary);
      setStatus(stat);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [range]);

  if (loading) {
    return (
      <div className="garmin-tile card">
        <div className="garmin-tile__header">
          <Heart size={16} />
          <span className="chart-title" style={{ margin: 0 }}>Health</span>
        </div>
        <div className="garmin-tile__loading">
          <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 60, borderRadius: 8 }} />)}
          </div>
        </div>
      </div>
    );
  }

  const days = data?.days || [];
  const today = days[0] || {};
  const yesterday = days[1] || {};
  const isStale = status?.last_run && (Date.now() - new Date(status.last_run).getTime()) > 4 * 3600000;
  const hasFailed = status?.status === 'failure';

  const noData = days.length === 0;

  if (noData) {
    return (
      <div className="garmin-tile card">
        <div className="garmin-tile__header">
          <Heart size={16} />
          <span className="chart-title" style={{ margin: 0 }}>Health</span>
        </div>
        <div className="garmin-tile__empty">
          <Activity size={32} />
          <p>Waiting for first Garmin sync</p>
          <button className="garmin-tile__sync-btn" onClick={() => fetch('/api/garmin/ingest', { method: 'POST' }).then(fetchData)}>
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  // Chart data for multi-day views
  const chartData = [...days].reverse().map(d => ({
    date: d.date?.slice(5),
    bbMax: d.body_battery?.max,
    bbMin: d.body_battery?.min,
    sleep: d.sleep?.score,
    steps: d.steps,
    rhr: d.resting_hr,
    hrv: d.hrv?.avg_ms,
  }));

  const isCompact = range === 'compact';

  return (
    <div className="garmin-tile card">
      <div className="garmin-tile__header">
        <Heart size={16} />
        <span className="chart-title" style={{ margin: 0 }}>Health</span>
        <div className="garmin-tile__range-btns">
          {['compact', '7d', '30d'].map(r => (
            <button key={r} className={`garmin-tile__range-btn ${range === r ? 'garmin-tile__range-btn--active' : ''}`} onClick={() => setRange(r)}>
              {r === 'compact' ? 'Today' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isCompact ? (
        /* ─── Compact view: today + yesterday ─── */
        <>
          <div className="garmin-tile__hero">
            <div className="garmin-tile__bb-main">
              <span className="garmin-tile__bb-label">Body Battery</span>
              <span className="garmin-tile__bb-value">{today.body_battery?.max ?? '—'}</span>
              {yesterday.body_battery?.max != null && (
                <span className="garmin-tile__bb-yesterday">
                  ↑ {yesterday.body_battery.max} yesterday
                </span>
              )}
            </div>
          </div>

          <div className="garmin-tile__stats">
            <div className="garmin-tile__stat">
              <Moon size={14} />
              <span className="garmin-tile__stat-value">{formatDuration(today.sleep?.duration_seconds)}</span>
              <span className="garmin-tile__stat-label">Sleep</span>
              <SleepDots score={today.sleep?.score} />
            </div>
            <div className="garmin-tile__stat">
              <Footprints size={14} />
              <span className="garmin-tile__stat-value">{today.steps?.toLocaleString() || '—'}</span>
              <span className="garmin-tile__stat-label">Steps</span>
              {today.steps_goal && <span className="garmin-tile__stat-pct">{Math.round((today.steps / today.steps_goal) * 100)}%</span>}
            </div>
            <div className="garmin-tile__stat">
              <Heart size={14} />
              <span className="garmin-tile__stat-value">{today.resting_hr || '—'}</span>
              <span className="garmin-tile__stat-label">RHR</span>
            </div>
            <div className="garmin-tile__stat">
              <Activity size={14} />
              <span className="garmin-tile__stat-value">{today.hrv?.avg_ms || '—'}</span>
              <span className="garmin-tile__stat-label">HRV</span>
              {today.hrv?.status && <span className="garmin-tile__stat-sub">{today.hrv.status}</span>}
            </div>
          </div>

          {(yesterday.workouts?.count > 0 || today.workouts?.count > 0) && (
            <div className="garmin-tile__workouts">
              <Dumbbell size={12} />
              {today.workouts?.count > 0 && <span>Today: {today.workouts.count} · {formatDuration(today.workouts.total_seconds)}</span>}
              {yesterday.workouts?.count > 0 && <span>Yesterday: {yesterday.workouts.count} · {formatDuration(yesterday.workouts.total_seconds)}</span>}
            </div>
          )}
        </>
      ) : (
        /* ─── Multi-day view: charts ─── */
        <>
          <div className="garmin-tile__chart-section">
            <span className="garmin-tile__chart-label">Body Battery</span>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '0.75rem', borderRadius: 8, border: '1px solid var(--border-light)' }} />
                <Area type="monotone" dataKey="bbMax" stroke="#F59E0B" fill="url(#bbGrad)" strokeWidth={2} dot={false} name="Max" />
                <Area type="monotone" dataKey="bbMin" stroke="#D97706" fill="none" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Min" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="garmin-tile__mini-charts">
            {[
              { key: 'sleep', label: 'Sleep Score', color: '#818CF8' },
              { key: 'steps', label: 'Steps', color: '#34D399' },
              { key: 'rhr', label: 'RHR', color: '#F87171' },
              { key: 'hrv', label: 'HRV', color: '#60A5FA' },
            ].map(metric => (
              <div key={metric.key} className="garmin-tile__mini-chart">
                <span className="garmin-tile__mini-label">{metric.label}</span>
                <ResponsiveContainer width="100%" height={40}>
                  <AreaChart data={chartData}>
                    <Area type="monotone" dataKey={metric.key} stroke={metric.color} fill={metric.color} fillOpacity={0.1} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <span className="garmin-tile__mini-latest">{chartData[chartData.length - 1]?.[metric.key] ?? '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer: sync status */}
      <div className="garmin-tile__footer">
        {hasFailed && <AlertTriangle size={12} className="garmin-tile__warn" title={status.error_message} />}
        {isStale && <span className="garmin-tile__stale-dot" title="Data may be stale" />}
        <span className="garmin-tile__sync-time">Last synced {formatTimeAgo(status?.last_run)}</span>
      </div>
    </div>
  );
}
