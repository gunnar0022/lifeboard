import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Moon, Footprints, Activity, AlertTriangle, Dumbbell,
  TrendingUp, TrendingDown, Minus, BedDouble, Sunrise, Wind, Droplets,
  Battery, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, Cell, LineChart, Line, ReferenceLine, ReferenceArea, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import './GarminTile.css';

// ──────────────── Stage colors (used everywhere) ────────────────
const STAGE_COLORS = {
  deep:  '#1E3A8A',  // indigo-900
  light: '#60A5FA',  // sky-400
  rem:   '#A78BFA',  // violet-400
  awake: '#F87171',  // red-400
};
const STAGE_ORDER = ['deep', 'light', 'rem', 'awake'];
const STAGE_LABELS = { deep: 'Deep', light: 'Light', rem: 'REM', awake: 'Awake' };

// ──────────────── Formatters ────────────────
function fmtDur(seconds) {
  if (seconds == null || isNaN(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
function fmtMin(min) {
  if (min == null || isNaN(min)) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
function fmtClockDelta(deltaMin) {
  if (deltaMin == null || isNaN(deltaMin)) return null;
  const sign = deltaMin > 0 ? 'later' : 'earlier';
  const abs = Math.round(Math.abs(deltaMin));
  if (abs < 1) return 'same';
  if (abs >= 60) return `${Math.floor(abs / 60)}h ${abs % 60}m ${sign}`;
  return `${abs} min ${sign}`;
}
function fmtTimeAgo(iso) {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ──────────────── Sub-components ────────────────

function ScoreBadge({ score }) {
  if (score == null) return <span className="gt-score gt-score--na">—</span>;
  let band = 'fair';
  if (score >= 90) band = 'excellent';
  else if (score >= 80) band = 'good';
  else if (score >= 60) band = 'fair';
  else band = 'poor';
  return <span className={`gt-score gt-score--${band}`}>{score}</span>;
}

function HypnogramBar({ segments, bedtime, wake }) {
  if (!segments || segments.length === 0) return null;
  const start = segments[0].start_ts;
  const end = segments[segments.length - 1].end_ts;
  const total = end - start;
  if (total <= 0) return null;
  // Time labels: bedtime, midpoint, wake
  return (
    <div className="gt-hypno">
      <div className="gt-hypno__bar">
        {segments.map((s, i) => {
          const left = ((s.start_ts - start) / total) * 100;
          const width = ((s.end_ts - s.start_ts) / total) * 100;
          return (
            <div
              key={i}
              className="gt-hypno__seg"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: STAGE_COLORS[s.stage] || '#999',
              }}
              title={`${STAGE_LABELS[s.stage]} · ${Math.round((s.end_ts - s.start_ts) / 60000)}m`}
            />
          );
        })}
      </div>
      <div className="gt-hypno__axis">
        <span>{bedtime || '—'}</span>
        <span>{wake || '—'}</span>
      </div>
    </div>
  );
}

function DeltaPill({ comparison, meta, formatter }) {
  if (!comparison) return null;
  const { current, prior, delta, direction, lower_is_better } = comparison;
  const isImprovement =
    direction === 'flat' ? null : (lower_is_better ? direction === 'down' : direction === 'up');
  const Icon = direction === 'up' ? TrendingUp
             : direction === 'down' ? TrendingDown : Minus;
  const cls =
    isImprovement === null ? 'gt-delta--flat'
    : isImprovement ? 'gt-delta--good' : 'gt-delta--bad';
  const fmt = formatter || ((v) => Math.abs(v).toFixed(v < 1 && v > 0 ? 2 : 0));
  return (
    <span className={`gt-delta ${cls}`} title={`Prior period: ${prior}${meta?.unit ? ' ' + meta.unit : ''}`}>
      <Icon size={11} strokeWidth={2.5} />
      {direction !== 'flat' && fmt(delta)}
    </span>
  );
}

function StatBlock({ label, value, sub, delta, icon: Icon }) {
  return (
    <div className="gt-stat">
      <div className="gt-stat__head">
        {Icon && <Icon size={12} />}
        <span className="gt-stat__label">{label}</span>
        {delta}
      </div>
      <div className="gt-stat__value">{value}</div>
      {sub && <div className="gt-stat__sub">{sub}</div>}
    </div>
  );
}

function StagesStackedBar({ timeline }) {
  // One bar per night: deep + light + rem + awake (minutes)
  const data = timeline.map(t => ({
    date: t.date?.slice(5),
    deep:  (t.deep || 0) / 60,
    light: (t.light || 0) / 60,
    rem:   (t.rem || 0) / 60,
    awake: (t.awake || 0) / 60,
    score: t.score,
  }));
  return (
    <div className="gt-chart">
      <div className="gt-chart__title">Sleep stages per night (minutes)</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--border-light)" opacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: '0.75rem', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}
            formatter={(v, name) => [`${Math.round(v)}m`, STAGE_LABELS[name] || name]}
          />
          {STAGE_ORDER.map(stage => (
            <Bar key={stage} dataKey={stage} stackId="s" fill={STAGE_COLORS[stage]} radius={stage === 'awake' ? [3, 3, 0, 0] : 0} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="gt-legend">
        {STAGE_ORDER.map(s => (
          <span key={s} className="gt-legend__item">
            <span className="gt-legend__swatch" style={{ background: STAGE_COLORS[s] }} />
            {STAGE_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScheduleScatter({ timeline, bedtimeStats, wakeStats }) {
  // For each night, plot bedtime and wake as dots on a wall-clock y-axis.
  // Y values are minutes from 6pm so midnight-spanning bedtimes plot smoothly.
  const data = timeline
    .filter(t => t.bedtime_min_from_6pm != null && t.wake_min_from_6pm != null)
    .map((t, i) => ({
      idx: i,
      date: t.date?.slice(5),
      bed: t.bedtime_min_from_6pm,
      wake: t.wake_min_from_6pm,
    }));
  if (data.length === 0) return null;

  // Y-axis: ticks every 2h within the bedtime/wake range
  const allYs = data.flatMap(d => [d.bed, d.wake]);
  const yMin = Math.min(...allYs) - 30;
  const yMax = Math.max(...allYs) + 30;
  const yTickFmt = (v) => {
    const total = (Math.round(v) + 18 * 60) % (24 * 60);
    const h = Math.floor(total / 60), m = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Mean reference lines if available
  const bedMean = bedtimeStats?.mean_clock;
  const wakeMean = wakeStats?.mean_clock;
  const bedMeanY = bedMean ? clockToMinFrom6pm(bedMean) : null;
  const wakeMeanY = wakeMean ? clockToMinFrom6pm(wakeMean) : null;

  return (
    <div className="gt-chart">
      <div className="gt-chart__title">Bedtime &amp; wake consistency</div>
      <ResponsiveContainer width="100%" height={170}>
        <ScatterChart margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border-light)" opacity={0.5} />
          <XAxis dataKey="idx" type="number" domain={[-0.5, data.length - 0.5]} hide />
          <YAxis
            type="number"
            domain={[yMin, yMax]}
            ticks={makeTicks(yMin, yMax, 120)}
            tickFormatter={yTickFmt}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const p = payload[0].payload;
              return (
                <div style={{ fontSize: '0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '4px 8px' }}>
                  <div style={{ fontWeight: 600 }}>{p.date}</div>
                  <div>Bed: {yTickFmt(p.bed)}</div>
                  <div>Wake: {yTickFmt(p.wake)}</div>
                </div>
              );
            }}
          />
          {bedMeanY != null && (
            <ReferenceLine y={bedMeanY} stroke={STAGE_COLORS.deep} strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'avg bed', fontSize: 9, fill: STAGE_COLORS.deep, position: 'right' }} />
          )}
          {wakeMeanY != null && (
            <ReferenceLine y={wakeMeanY} stroke={STAGE_COLORS.rem} strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'avg wake', fontSize: 9, fill: STAGE_COLORS.rem, position: 'right' }} />
          )}
          <Scatter data={data} dataKey="bed" fill={STAGE_COLORS.deep} />
          <Scatter data={data} dataKey="wake" fill={STAGE_COLORS.rem} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="gt-schedule-meta">
        <span><BedDouble size={12} /> Bedtime <strong>{bedMean || '—'}</strong> {bedtimeStats?.stdev_min != null && <em>± {Math.round(bedtimeStats.stdev_min)}m</em>}</span>
        <span><Sunrise size={12} /> Wake <strong>{wakeMean || '—'}</strong> {wakeStats?.stdev_min != null && <em>± {Math.round(wakeStats.stdev_min)}m</em>}</span>
      </div>
    </div>
  );
}

function clockToMinFrom6pm(clock) {
  if (!clock) return null;
  const [h, m] = clock.split(':').map(Number);
  const anchor = 18 * 60;
  let rel = (h * 60 + m) - anchor;
  if (rel < 0) rel += 24 * 60;
  return rel;
}
function makeTicks(min, max, step) {
  const ticks = [];
  let t = Math.ceil(min / step) * step;
  while (t <= max) { ticks.push(t); t += step; }
  return ticks;
}

function MetricSparkline({ timeline, metric, label, color, unit, fmt = (v) => v }) {
  const data = timeline.map(t => ({ date: t.date?.slice(5), value: t[metric] }));
  const valid = data.filter(d => d.value != null);
  if (valid.length === 0) return null;
  const last = valid[valid.length - 1].value;
  return (
    <div className="gt-spark">
      <div className="gt-spark__head">
        <span className="gt-spark__label">{label}</span>
        <span className="gt-spark__last">{fmt(last)}{unit ? ` ${unit}` : ''}</span>
      </div>
      <ResponsiveContainer width="100%" height={42}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ fontSize: '0.7rem', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--bg-card)', padding: '2px 6px' }}
            formatter={(v) => [`${fmt(v)}${unit ? ' ' + unit : ''}`, label]}
            labelFormatter={(l) => l}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.6} fill={`url(#grad-${metric})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComparisonTable({ comparison, meta, stats }) {
  if (!comparison || Object.keys(comparison).length === 0) return null;
  // Group: sleep core, body
  const groups = {
    'Sleep': ['score', 'duration_min', 'deep_min', 'light_min', 'rem_min', 'awake_min', 'awake_count', 'bedtime', 'wake', 'avg_sleep_stress'],
    'Body':  ['rhr', 'stress_avg', 'steps', 'body_battery_max', 'avg_respiration', 'avg_spo2', 'lowest_spo2'],
  };
  const fmtVal = (key, v) => {
    if (v == null) return '—';
    if (key.endsWith('_min') || key === 'duration_min') return fmtMin(v);
    if (key === 'bedtime' || key === 'wake') return v;
    if (key === 'awake_count' || key === 'avg_sleep_stress' || key === 'avg_respiration' || key === 'avg_spo2') return Number(v).toFixed(1);
    return Math.round(v);
  };
  return (
    <div className="gt-cmp">
      {Object.entries(groups).map(([groupName, keys]) => {
        const present = keys.filter(k => comparison[k]);
        if (present.length === 0) return null;
        return (
          <div key={groupName} className="gt-cmp__group">
            <div className="gt-cmp__group-title">{groupName}</div>
            <table className="gt-cmp__table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current</th>
                  <th>Prior</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {present.map(k => {
                  const c = comparison[k];
                  const m = meta[k] || {};
                  let isGood = c.direction === 'flat' ? null : (m.lower_is_better ? c.direction === 'down' : c.direction === 'up');
                  // For bedtime/wake, "later" isn't intrinsically good or bad
                  if (k === 'bedtime' || k === 'wake') isGood = null;
                  let deltaStr;
                  if (k === 'bedtime' || k === 'wake') {
                    deltaStr = fmtClockDelta(c.delta_min);
                  } else if (k.endsWith('_min') || k === 'duration_min') {
                    deltaStr = `${c.delta > 0 ? '+' : ''}${Math.round(c.delta)}m`;
                  } else {
                    deltaStr = `${c.delta > 0 ? '+' : ''}${Number(c.delta).toFixed(c.delta < 1 && c.delta > -1 ? 2 : 0)}`;
                  }
                  return (
                    <tr key={k}>
                      <td className="gt-cmp__metric">{m.label || k}</td>
                      <td><strong>{fmtVal(k, c.current)}</strong></td>
                      <td className="gt-cmp__prior">{fmtVal(k, c.prior)}</td>
                      <td className={
                        isGood === null ? 'gt-cmp__delta gt-cmp__delta--flat'
                        : isGood ? 'gt-cmp__delta gt-cmp__delta--good'
                        : 'gt-cmp__delta gt-cmp__delta--bad'
                      }>
                        {isGood === true && <ArrowUpRight size={12} />}
                        {isGood === false && <ArrowDownRight size={12} />}
                        {deltaStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────── Main component ────────────────
export default function GarminTile() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/garmin/dashboard?days=${days}`).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch('/api/garmin/status').then(r => r.ok ? r.json() : null),
    ]).then(([dash, stat]) => {
      if (cancel) return;
      setData(dash);
      setStatus(stat);
      setLoading(false);
    }).catch(e => {
      if (cancel) return;
      setError(String(e));
      setLoading(false);
    });
    return () => { cancel = true; };
  }, [days]);

  if (loading) {
    return (
      <div className="gt card">
        <div className="gt__header">
          <Heart size={16} />
          <span className="chart-title" style={{ margin: 0 }}>Health</span>
        </div>
        <div className="gt__loading">
          <div className="skeleton" style={{ height: 140, borderRadius: 10 }} />
          <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="gt card">
        <div className="gt__header">
          <Heart size={16} />
          <span className="chart-title" style={{ margin: 0 }}>Health</span>
        </div>
        <div className="gt__empty">
          <Activity size={32} />
          <p>Couldn't load Garmin data{error ? `: ${error}` : ''}.</p>
        </div>
      </div>
    );
  }

  const { last_night: ln, timeline, stats, comparison, metric_meta } = data;

  if (!ln || timeline.length === 0) {
    return (
      <div className="gt card">
        <div className="gt__header">
          <Heart size={16} />
          <span className="chart-title" style={{ margin: 0 }}>Health</span>
        </div>
        <div className="gt__empty">
          <Activity size={32} />
          <p>No Garmin data yet.</p>
          <button className="gt__sync-btn" onClick={() => fetch('/api/garmin/ingest', { method: 'POST' }).then(() => window.location.reload())}>
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  // Stage % of total for last night
  const totals = ln.stages || {};
  const totalSec = (totals.deep || 0) + (totals.light || 0) + (totals.rem || 0) + (totals.awake || 0);
  const pct = (s) => totalSec > 0 ? Math.round(((totals[s] || 0) / totalSec) * 100) : 0;

  const isStale = status?.last_run && (Date.now() - new Date(status.last_run).getTime()) > 4 * 3600000;
  const hasFailed = status?.status === 'failure';

  // Build comparison delta pills for the key-stats grid
  const cmp = (key) => comparison?.[key];
  const meta = metric_meta || {};

  return (
    <div className="gt card">
      <div className="gt__header">
        <Heart size={16} />
        <span className="chart-title" style={{ margin: 0 }}>Health</span>
        <div className="gt__range-btns">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              className={`gt__range-btn ${days === d ? 'gt__range-btn--active' : ''}`}
              onClick={() => setDays(d)}
            >{d}d</button>
          ))}
        </div>
      </div>

      {/* ─── Last-night hero ─── */}
      <motion.div
        className="gt-hero"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <div className="gt-hero__top">
          <div className="gt-hero__times">
            <BedDouble size={14} />
            <strong>{ln.bedtime || '—'}</strong>
            <span className="gt-hero__arrow">→</span>
            <Sunrise size={14} />
            <strong>{ln.wake || '—'}</strong>
          </div>
          <div className="gt-hero__score">
            <ScoreBadge score={ln.score} />
            <span className="gt-hero__duration">{fmtDur(ln.duration_seconds)}</span>
          </div>
        </div>

        <HypnogramBar segments={ln.hypnogram} bedtime={ln.bedtime} wake={ln.wake} />

        <div className="gt-hero__stages">
          {STAGE_ORDER.map(s => (
            <div key={s} className="gt-hero__stage">
              <span className="gt-legend__swatch" style={{ background: STAGE_COLORS[s] }} />
              <span className="gt-hero__stage-label">{STAGE_LABELS[s]}</span>
              <span className="gt-hero__stage-val">{fmtDur(totals[s])}</span>
              <span className="gt-hero__stage-pct">{pct(s)}%</span>
            </div>
          ))}
        </div>

        <div className="gt-hero__quals">
          {ln.awake_count != null && <span><Activity size={12} /> {ln.awake_count} awakening{ln.awake_count === 1 ? '' : 's'}</span>}
          {ln.avg_respiration != null && <span><Wind size={12} /> {ln.avg_respiration} br/min</span>}
          {ln.avg_spo2 != null && <span><Droplets size={12} /> SpO₂ {Math.round(ln.avg_spo2)}%{ln.lowest_spo2 != null ? ` (low ${ln.lowest_spo2})` : ''}</span>}
          {ln.avg_sleep_stress != null && <span>stress {Math.round(ln.avg_sleep_stress)}</span>}
        </div>

        {ln.score_insight && (
          <p className="gt-hero__insight">{ln.score_insight}</p>
        )}
      </motion.div>

      {/* ─── Key averages grid ─── */}
      <div className="gt-grid">
        <StatBlock
          icon={Moon} label={`Avg sleep · ${days}d`}
          value={stats.duration_min ? fmtMin(stats.duration_min.mean) : '—'}
          sub={stats.duration_min ? `range ${fmtMin(stats.duration_min.min)}–${fmtMin(stats.duration_min.max)}` : null}
          delta={cmp('duration_min') && <DeltaPill comparison={cmp('duration_min')} meta={meta.duration_min} formatter={(v) => `${Math.abs(Math.round(v))}m`} />}
        />
        <StatBlock
          label={`Avg score`}
          value={stats.score?.mean ? Math.round(stats.score.mean) : '—'}
          sub={stats.score ? `± ${stats.score.stdev?.toFixed(1)}` : null}
          delta={cmp('score') && <DeltaPill comparison={cmp('score')} meta={meta.score} />}
        />
        <StatBlock
          icon={BedDouble} label="Bedtime"
          value={stats.bedtime?.mean_clock || '—'}
          sub={stats.bedtime ? `± ${Math.round(stats.bedtime.stdev_min)}m · ${stats.bedtime.earliest}–${stats.bedtime.latest}` : null}
        />
        <StatBlock
          icon={Sunrise} label="Wake"
          value={stats.wake?.mean_clock || '—'}
          sub={stats.wake ? `± ${Math.round(stats.wake.stdev_min)}m` : null}
        />
        <StatBlock
          label="Awakenings"
          value={stats.awake_count ? stats.awake_count.mean.toFixed(1) : '—'}
          sub={stats.awake_count ? `range ${stats.awake_count.min}–${stats.awake_count.max}` : null}
          delta={cmp('awake_count') && <DeltaPill comparison={cmp('awake_count')} meta={meta.awake_count} formatter={(v) => Math.abs(v).toFixed(1)} />}
        />
        <StatBlock
          label="Deep"
          value={stats.deep_min ? fmtMin(stats.deep_min.mean) : '—'}
          sub={stats.duration_min && stats.deep_min ? `${Math.round((stats.deep_min.mean / stats.duration_min.mean) * 100)}% of total` : null}
        />
        <StatBlock
          label="REM"
          value={stats.rem_min ? fmtMin(stats.rem_min.mean) : '—'}
          sub={stats.duration_min && stats.rem_min ? `${Math.round((stats.rem_min.mean / stats.duration_min.mean) * 100)}% of total` : null}
        />
        <StatBlock
          label="Light"
          value={stats.light_min ? fmtMin(stats.light_min.mean) : '—'}
          sub={stats.duration_min && stats.light_min ? `${Math.round((stats.light_min.mean / stats.duration_min.mean) * 100)}% of total` : null}
        />
        <StatBlock
          icon={Heart} label="Resting HR"
          value={stats.rhr ? `${Math.round(stats.rhr.mean)} bpm` : '—'}
          sub={stats.rhr ? `range ${stats.rhr.min}–${stats.rhr.max}` : null}
          delta={cmp('rhr') && <DeltaPill comparison={cmp('rhr')} meta={meta.rhr} />}
        />
        <StatBlock
          icon={Battery} label="Body Battery"
          value={stats.body_battery_max ? `${Math.round(stats.body_battery_max.mean)}` : '—'}
          sub={stats.body_battery_min ? `low ${Math.round(stats.body_battery_min.mean)}` : null}
          delta={cmp('body_battery_max') && <DeltaPill comparison={cmp('body_battery_max')} meta={meta.body_battery_max} />}
        />
        <StatBlock
          icon={Footprints} label="Steps"
          value={stats.steps ? Math.round(stats.steps.mean).toLocaleString() : '—'}
          sub={stats.steps ? `peak ${stats.steps.max.toLocaleString()}` : null}
          delta={cmp('steps') && <DeltaPill comparison={cmp('steps')} meta={meta.steps} formatter={(v) => Math.abs(Math.round(v)).toLocaleString()} />}
        />
        <StatBlock
          icon={Activity} label="Stress"
          value={stats.stress_avg ? Math.round(stats.stress_avg.mean) : '—'}
          sub={stats.stress_avg ? `peak ${stats.stress_avg.max}` : null}
          delta={cmp('stress_avg') && <DeltaPill comparison={cmp('stress_avg')} meta={meta.stress_avg} />}
        />
      </div>

      {/* ─── Charts ─── */}
      <StagesStackedBar timeline={timeline} />
      <ScheduleScatter timeline={timeline} bedtimeStats={stats.bedtime} wakeStats={stats.wake} />

      <div className="gt-sparks">
        <MetricSparkline timeline={timeline} metric="score" label="Sleep score" color={STAGE_COLORS.rem} />
        <MetricSparkline timeline={timeline} metric="rhr" label="Resting HR" color="#F87171" unit="bpm" />
        <MetricSparkline timeline={timeline} metric="steps" label="Steps" color="#34D399" fmt={(v) => v?.toLocaleString()} />
        <MetricSparkline timeline={timeline} metric="body_battery_max" label="Body Battery" color="#F59E0B" />
        <MetricSparkline timeline={timeline} metric="stress_avg" label="Stress" color="#FB923C" />
        <MetricSparkline timeline={timeline} metric="avg_sleep_stress" label="Sleep stress" color="#A78BFA" />
      </div>

      {/* ─── Period vs prior period ─── */}
      {comparison && Object.keys(comparison).length > 0 && (
        <div className="gt-section">
          <div className="gt-section__title">
            Last {days}d vs prior {data.prior_window_days}d
          </div>
          <ComparisonTable comparison={comparison} meta={meta} stats={stats} />
        </div>
      )}

      {/* Footer */}
      <div className="gt__footer">
        {hasFailed && <AlertTriangle size={12} className="gt__warn" title={status.error_message} />}
        {isStale && <span className="gt__stale-dot" title="Data may be stale" />}
        <span className="gt__sync-time">Last synced {fmtTimeAgo(status?.last_run)}</span>
      </div>
    </div>
  );
}
