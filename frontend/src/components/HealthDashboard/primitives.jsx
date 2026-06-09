/**
 * Shared primitives used across health-dashboard widgets.
 * Pure presentational; no data fetching here.
 */
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, BedDouble, Sunrise,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ──────────── Stage palette ────────────
export const STAGE_COLORS = {
  deep:  '#1E3A8A',
  light: '#60A5FA',
  rem:   '#A78BFA',
  awake: '#F87171',
};
export const STAGE_ORDER = ['deep', 'light', 'rem', 'awake'];
export const STAGE_LABELS = { deep: 'Deep', light: 'Light', rem: 'REM', awake: 'Awake' };

// ──────────── Formatters ────────────
export function fmtDur(seconds) {
  if (seconds == null || isNaN(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
export function fmtMin(min) {
  if (min == null || isNaN(min)) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
export function fmtClockDelta(deltaMin) {
  if (deltaMin == null || isNaN(deltaMin)) return null;
  const sign = deltaMin > 0 ? 'later' : 'earlier';
  const abs = Math.round(Math.abs(deltaMin));
  if (abs < 1) return 'same';
  if (abs >= 60) return `${Math.floor(abs / 60)}h ${abs % 60}m ${sign}`;
  return `${abs} min ${sign}`;
}
export function fmtTimeAgo(iso) {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ──────────── Helpers ────────────
export function clockToMinFrom6pm(clock) {
  if (!clock) return null;
  const [h, m] = clock.split(':').map(Number);
  const anchor = 18 * 60;
  let rel = (h * 60 + m) - anchor;
  if (rel < 0) rel += 24 * 60;
  return rel;
}
export function makeTicks(min, max, step) {
  const ticks = [];
  let t = Math.ceil(min / step) * step;
  while (t <= max) { ticks.push(t); t += step; }
  return ticks;
}
function clockFromMinFrom6pm(v) {
  const total = (Math.round(v) + 18 * 60) % (24 * 60);
  const h = Math.floor(total / 60), m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ──────────── ScoreBadge ────────────
export function ScoreBadge({ score }) {
  if (score == null) return <span className="hd-score hd-score--na">—</span>;
  let band = 'fair';
  if (score >= 90) band = 'excellent';
  else if (score >= 80) band = 'good';
  else if (score >= 60) band = 'fair';
  else band = 'poor';
  return <span className={`hd-score hd-score--${band}`}>{score}</span>;
}

// ──────────── HypnogramBar ────────────
export function HypnogramBar({ segments, bedtime, wake }) {
  if (!segments || segments.length === 0) return null;
  const start = segments[0].start_ts;
  const end = segments[segments.length - 1].end_ts;
  const total = end - start;
  if (total <= 0) return null;
  return (
    <div className="hd-hypno">
      <div className="hd-hypno__bar">
        {segments.map((s, i) => {
          const left = ((s.start_ts - start) / total) * 100;
          const width = ((s.end_ts - s.start_ts) / total) * 100;
          return (
            <div
              key={i}
              className="hd-hypno__seg"
              style={{ left: `${left}%`, width: `${width}%`, background: STAGE_COLORS[s.stage] || '#999' }}
              title={`${STAGE_LABELS[s.stage]} · ${Math.round((s.end_ts - s.start_ts) / 60000)}m`}
            />
          );
        })}
      </div>
      <div className="hd-hypno__axis">
        <span>{bedtime || '—'}</span>
        <span>{wake || '—'}</span>
      </div>
    </div>
  );
}

// ──────────── DeltaPill ────────────
export function DeltaPill({ comparison, formatter }) {
  if (!comparison) return null;
  const { direction, lower_is_better, delta, prior } = comparison;
  const isImprovement =
    direction === 'flat' ? null
    : (lower_is_better ? direction === 'down' : direction === 'up');
  const Icon = direction === 'up' ? TrendingUp
             : direction === 'down' ? TrendingDown : Minus;
  const cls =
    isImprovement === null ? 'hd-delta--flat'
    : isImprovement ? 'hd-delta--good' : 'hd-delta--bad';
  const fmt = formatter || ((v) => Math.abs(v).toFixed(v < 1 && v > 0 ? 2 : 0));
  return (
    <span className={`hd-delta ${cls}`} title={`Prior period: ${prior}`}>
      <Icon size={11} strokeWidth={2.5} />
      {direction !== 'flat' && fmt(delta)}
    </span>
  );
}

// ──────────── StatBlock ────────────
export function StatBlock({ label, value, sub, delta, icon: Icon }) {
  return (
    <div className="hd-stat">
      <div className="hd-stat__head">
        {Icon && <Icon size={12} />}
        <span className="hd-stat__label">{label}</span>
        {delta}
      </div>
      <div className="hd-stat__value">{value}</div>
      {sub && <div className="hd-stat__sub">{sub}</div>}
    </div>
  );
}

// ──────────── StagesStackedBar ────────────
export function StagesStackedBar({ timeline }) {
  const data = (timeline || []).map(t => ({
    date:  t.date?.slice(5),
    deep:  (t.deep || 0) / 60,
    light: (t.light || 0) / 60,
    rem:   (t.rem || 0) / 60,
    awake: (t.awake || 0) / 60,
  }));
  return (
    <div className="hd-chart">
      <ResponsiveContainer width="100%" height={170}>
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
      <div className="hd-legend">
        {STAGE_ORDER.map(s => (
          <span key={s} className="hd-legend__item">
            <span className="hd-legend__swatch" style={{ background: STAGE_COLORS[s] }} />
            {STAGE_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ──────────── ScheduleScatter ────────────
export function ScheduleScatter({ timeline, bedtimeStats, wakeStats }) {
  const data = (timeline || [])
    .filter(t => t.bedtime_min_from_6pm != null && t.wake_min_from_6pm != null)
    .map((t, i) => ({
      idx: i,
      date: t.date?.slice(5),
      bed: t.bedtime_min_from_6pm,
      wake: t.wake_min_from_6pm,
    }));
  if (data.length === 0) {
    return <div className="hd-empty-mini">No bedtime data yet.</div>;
  }
  const allYs = data.flatMap(d => [d.bed, d.wake]);
  const yMin = Math.min(...allYs) - 30;
  const yMax = Math.max(...allYs) + 30;
  const bedMeanY = bedtimeStats?.mean_clock ? clockToMinFrom6pm(bedtimeStats.mean_clock) : null;
  const wakeMeanY = wakeStats?.mean_clock ? clockToMinFrom6pm(wakeStats.mean_clock) : null;
  return (
    <div className="hd-chart">
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border-light)" opacity={0.5} />
          <XAxis dataKey="idx" type="number" domain={[-0.5, data.length - 0.5]} hide />
          <YAxis
            type="number"
            domain={[yMin, yMax]}
            ticks={makeTicks(yMin, yMax, 120)}
            tickFormatter={clockFromMinFrom6pm}
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
                  <div>Bed: {clockFromMinFrom6pm(p.bed)}</div>
                  <div>Wake: {clockFromMinFrom6pm(p.wake)}</div>
                </div>
              );
            }}
          />
          {bedMeanY != null && (
            <ReferenceLine y={bedMeanY} stroke={STAGE_COLORS.deep} strokeDasharray="3 3" strokeOpacity={0.6}
              label={{ value: 'avg bed', fontSize: 9, fill: STAGE_COLORS.deep, position: 'right' }} />
          )}
          {wakeMeanY != null && (
            <ReferenceLine y={wakeMeanY} stroke={STAGE_COLORS.rem} strokeDasharray="3 3" strokeOpacity={0.6}
              label={{ value: 'avg wake', fontSize: 9, fill: STAGE_COLORS.rem, position: 'right' }} />
          )}
          <Scatter data={data} dataKey="bed" fill={STAGE_COLORS.deep} />
          <Scatter data={data} dataKey="wake" fill={STAGE_COLORS.rem} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="hd-schedule-meta">
        <span><BedDouble size={12} /> Bedtime <strong>{bedtimeStats?.mean_clock || '—'}</strong> {bedtimeStats?.stdev_min != null && <em>± {Math.round(bedtimeStats.stdev_min)}m</em>}</span>
        <span><Sunrise size={12} /> Wake <strong>{wakeStats?.mean_clock || '—'}</strong> {wakeStats?.stdev_min != null && <em>± {Math.round(wakeStats.stdev_min)}m</em>}</span>
      </div>
    </div>
  );
}

// ──────────── MetricSparkline ────────────
export function MetricSparkline({ timeline, metric, color, unit, fmt = (v) => v }) {
  const data = (timeline || []).map(t => ({ date: t.date?.slice(5), value: t[metric] }));
  const valid = data.filter(d => d.value != null);
  if (valid.length === 0) return <div className="hd-empty-mini">No data yet.</div>;
  const last = valid[valid.length - 1].value;
  const id = `hd-grad-${metric.replace(/\./g, '-')}`;
  return (
    <div className="hd-spark">
      <div className="hd-spark__head">
        <span className="hd-spark__last">{fmt(last)}{unit ? ` ${unit}` : ''}</span>
      </div>
      <ResponsiveContainer width="100%" height={62}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ fontSize: '0.7rem', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--bg-card)', padding: '2px 6px' }}
            formatter={(v) => [`${fmt(v)}${unit ? ' ' + unit : ''}`, '']}
            labelFormatter={(l) => l}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.6} fill={`url(#${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ──────────── ComparisonTable ────────────
export function ComparisonTable({ comparison, meta }) {
  if (!comparison || Object.keys(comparison).length === 0) {
    return <div className="hd-empty-mini">Need more historical days for comparison.</div>;
  }
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
    <div className="hd-cmp">
      {Object.entries(groups).map(([groupName, keys]) => {
        const present = keys.filter(k => comparison[k]);
        if (present.length === 0) return null;
        return (
          <div key={groupName} className="hd-cmp__group">
            <div className="hd-cmp__group-title">{groupName}</div>
            <table className="hd-cmp__table">
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
                  const m = meta?.[k] || {};
                  let isGood = c.direction === 'flat' ? null : (m.lower_is_better ? c.direction === 'down' : c.direction === 'up');
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
                      <td className="hd-cmp__metric">{m.label || k}</td>
                      <td><strong>{fmtVal(k, c.current)}</strong></td>
                      <td className="hd-cmp__prior">{fmtVal(k, c.prior)}</td>
                      <td className={
                        isGood === null ? 'hd-cmp__delta hd-cmp__delta--flat'
                        : isGood ? 'hd-cmp__delta hd-cmp__delta--good'
                        : 'hd-cmp__delta hd-cmp__delta--bad'
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
