import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Lightbulb, PieChart,
  ChevronDown, ChevronRight, BarChart3,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import './InsightsSection.css';

function formatAmount(amount, symbol) {
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

// --- Donut / Pie Chart ---
function AveragePieChart({ averages, currencySymbol }) {
  const total = Object.values(averages).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sorted = Object.entries(averages).sort((a, b) => b[1] - a[1]);
  const COLORS = [
    '#0EA5A0', '#F59E0B', '#F97066', '#8B5CF6',
    '#3B82F6', '#10B981', '#EC4899', '#6366F1',
  ];

  const radius = 70;
  const cx = 90;
  const cy = 90;
  const innerRadius = 45;
  let cumulativeAngle = -90; // start at top

  const slices = sorted.map(([cat, amount], i) => {
    const pct = amount / total;
    const angle = pct * 360;
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);
    const largeArc = angle > 180 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { cat, amount, pct, d, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="insights-pie">
      <h4 className="insights-pie__title">
        <PieChart size={14} />
        Average Spending per Cycle
      </h4>
      <div className="insights-pie__content">
        <svg viewBox="0 0 180 180" className="insights-pie__svg">
          {slices.map((s, i) => (
            <motion.path
              key={s.cat}
              d={s.d}
              fill={s.color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" className="insights-pie__center-label">
            {formatAmount(total, currencySymbol)}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="insights-pie__center-sub">
            avg/cycle
          </text>
        </svg>
        <div className="insights-pie__legend">
          {slices.map(s => (
            <div key={s.cat} className="insights-pie__legend-item">
              <span className="insights-pie__dot" style={{ background: s.color }} />
              <span className="insights-pie__legend-cat">{s.cat}</span>
              <span className="insights-pie__legend-amt mono">
                {formatAmount(s.amount, currencySymbol)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Category Sparklines ---
function CategorySparklines({ trends, trending, currencySymbol }) {
  if (!trends || Object.keys(trends).length === 0) return null;

  const sorted = Object.entries(trends).sort((a, b) => {
    const aTotal = a[1].reduce((s, v) => s + v, 0);
    const bTotal = b[1].reduce((s, v) => s + v, 0);
    return bTotal - aTotal;
  });

  return (
    <div className="insights-sparklines">
      <h4 className="insights-sparklines__title">
        <BarChart3 size={14} />
        Category Trends
        <span className="insights-sparklines__subtitle">Last {sorted[0]?.[1]?.length || 0} cycles</span>
      </h4>
      <div className="insights-sparklines__grid">
        {sorted.map(([cat, values]) => {
          const max = Math.max(...values, 1);
          const latest = values[values.length - 1] || 0;
          const direction = trending?.[cat] || 'flat';
          const isFlagged = direction !== 'flat';

          return (
            <div key={cat} className={`sparkline-row${isFlagged ? ' sparkline-row--flagged' : ''}`}>
              <div className="sparkline-row__label">
                <span className="sparkline-row__cat">{cat}</span>
                <span className="sparkline-row__amount mono">
                  {formatAmount(latest, currencySymbol)}
                </span>
              </div>
              <div className="sparkline-row__chart">
                <svg viewBox={`0 0 ${values.length * 20} 24`} className="sparkline-row__svg">
                  {values.map((v, i) => {
                    const h = (v / max) * 20;
                    return (
                      <rect
                        key={i}
                        x={i * 20 + 3}
                        y={22 - h}
                        width={14}
                        height={h}
                        rx={2}
                        fill={i === values.length - 1 ? 'var(--color-finance)' : 'var(--bg-hover)'}
                        opacity={i === values.length - 1 ? 1 : 0.6}
                      />
                    );
                  })}
                </svg>
              </div>
              <div className={`sparkline-row__direction sparkline-row__direction--${direction}`}>
                {direction === 'up' && <TrendingUp size={12} />}
                {direction === 'down' && <TrendingDown size={12} />}
                {direction === 'flat' && <Minus size={12} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Current vs Average Comparison ---
function ComparisonStrip({ comparisons, currencySymbol }) {
  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div className="insights-comparison">
      <h4 className="insights-comparison__title">Current Cycle vs Average</h4>
      <div className="insights-comparison__grid">
        {comparisons.map(c => (
          <div key={c.category} className="comparison-item">
            <div className="comparison-item__header">
              <span className="comparison-item__cat">{c.category}</span>
              <span className={`comparison-item__pct comparison-item__pct--${c.status}`}>
                {c.percentage}%
              </span>
            </div>
            <div className="comparison-item__bar-bg">
              <motion.div
                className={`comparison-item__bar comparison-item__bar--${c.status}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(c.percentage, 150)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              <div className="comparison-item__avg-mark" style={{ left: '100%' }} />
            </div>
            <div className="comparison-item__amounts">
              <span className="mono">{formatAmount(c.current, currencySymbol)}</span>
              <span className="comparison-item__of">/ {formatAmount(c.expected_at_pace, currencySymbol)} pace</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Insight Cards ---
function InsightCards({ insights, cycleLabel }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="insights-cards">
      <h4 className="insights-cards__title">
        <Lightbulb size={14} />
        Cycle Insights
        <span className="insights-cards__label">{cycleLabel}</span>
      </h4>
      <div className="insights-cards__list">
        {insights.map((text, i) => (
          <motion.div
            key={i}
            className="insight-card"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="insight-card__num">{i + 1}</span>
            <p className="insight-card__text">{text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function InsightsSection({ currencySymbol }) {
  const { data, loading } = useApi('/api/finance/insights');
  const [expanded, setExpanded] = useState(true);

  if (loading || !data || !data.has_data) return null;

  return (
    <div className="insights-section card">
      <button
        className="insights-section__header"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="chart-title">
          <Lightbulb size={16} />
          Cycle Insights & Trends
          <span className="insights-section__badge">{data.completed_cycles} cycles</span>
        </h3>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {expanded && (
        <div className="insights-section__body">
          <div className="insights-section__top-row">
            <AveragePieChart
              averages={data.averages}
              currencySymbol={currencySymbol}
            />
            <CategorySparklines
              trends={data.trends}
              trending={data.trending}
              currencySymbol={currencySymbol}
            />
          </div>

          <ComparisonStrip
            comparisons={data.comparisons}
            currencySymbol={currencySymbol}
          />

          <InsightCards
            insights={data.latest_insights}
            cycleLabel={data.latest_cycle_label}
          />
        </div>
      )}
    </div>
  );
}
