import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './PortfolioTrend.css';

const CHART_W = 700;
const CHART_H = 180;
const PAD = { top: 10, right: 20, bottom: 24, left: 60 };

const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 99999 },
];

function formatCompact(value, symbol) {
  if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`;
  return `${symbol}${value.toLocaleString()}`;
}

export default function PortfolioTrend({ snapshots, portfolio, currencySymbol }) {
  const [range, setRange] = useState('3M');
  const [hover, setHover] = useState(null);

  const sym = currencySymbol || '¥';

  const data = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    const rangeDays = RANGES.find(r => r.label === range)?.days || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return snapshots
      .filter(s => range === 'ALL' || s.date >= cutoffStr)
      .map(s => ({ date: s.date, value: s.total_value }));
  }, [snapshots, range]);

  if (data.length < 2) {
    return (
      <div className="portfolio-trend card">
        <div className="portfolio-trend__header">
          <h3 className="portfolio-trend__title">Portfolio Value</h3>
        </div>
        <p className="portfolio-trend__no-data">Not enough data for chart yet</p>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minV = Math.min(...values) * 0.98;
  const maxV = Math.max(...values) * 1.02;
  const rangeV = maxV - minV || 1;

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * plotW,
    y: PAD.top + (1 - (d.value - minV) / rangeV) * plotH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`;

  // Trend
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const diff = last - first;
  const diffPct = first > 0 ? ((diff / first) * 100).toFixed(1) : 0;
  const isUp = diff > 0;
  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = isUp ? 'var(--color-success)' : diff < 0 ? 'var(--color-alert)' : 'var(--text-tertiary)';

  // Y-axis ticks
  const ticks = [];
  const step = rangeV / 4;
  for (let i = 0; i <= 4; i++) {
    ticks.push(minV + step * i);
  }

  // Total gain/loss from portfolio
  const totalGain = portfolio?.gain_loss || 0;
  const totalGainPct = portfolio?.gain_loss_pct || 0;

  return (
    <div className="portfolio-trend card">
      <div className="portfolio-trend__header">
        <div className="portfolio-trend__left">
          <h3 className="portfolio-trend__title">Portfolio Value</h3>
          <div className="portfolio-trend__value mono">
            {sym}{(portfolio?.total_value || last).toLocaleString()}
          </div>
          <div className="portfolio-trend__gain" style={{ color: trendColor }}>
            <TrendIcon size={14} />
            <span className="mono">
              {isUp ? '+' : ''}{sym}{totalGain.toLocaleString()} ({isUp ? '+' : ''}{totalGainPct}%)
            </span>
            <span className="portfolio-trend__gain-label">total return</span>
          </div>
        </div>
        <div className="portfolio-trend__ranges">
          {RANGES.map(r => (
            <button
              key={r.label}
              className={`portfolio-trend__range-btn ${range === r.label ? 'active' : ''}`}
              onClick={() => setRange(r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="portfolio-trend__svg"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-investing)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-investing)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis ticks */}
        {ticks.map((v, i) => {
          const y = PAD.top + (1 - (v - minV) / rangeV) * plotH;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
                stroke="var(--border-subtle)" strokeDasharray="3,3"
              />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" className="portfolio-trend__tick">
                {formatCompact(Math.round(v), sym)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#portfolioGrad)" />

        {/* Line */}
        <path
          d={linePath} fill="none"
          stroke="var(--color-investing)" strokeWidth="2" strokeLinejoin="round"
        />

        {/* Data points (only on hover) */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={hover === i ? 5 : 2}
            fill={hover === i ? 'var(--color-investing)' : 'transparent'}
            stroke={hover === i ? 'var(--color-investing)' : 'transparent'}
            strokeWidth="2"
            onMouseEnter={() => setHover(i)}
            style={{ cursor: 'default' }}
          />
        ))}

        {/* X-axis date labels */}
        {[0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1].map(i => {
          if (i >= points.length) return null;
          return (
            <text
              key={i}
              x={points[i].x}
              y={CHART_H - 4}
              textAnchor="middle"
              className="portfolio-trend__date-label"
            >
              {data[i].date.slice(5)}
            </text>
          );
        })}

        {/* Hover tooltip */}
        {hover !== null && (
          <g>
            <line
              x1={points[hover].x} y1={PAD.top}
              x2={points[hover].x} y2={PAD.top + plotH}
              stroke="var(--color-investing)" strokeOpacity="0.3" strokeDasharray="3,3"
            />
            <text
              x={points[hover].x}
              y={points[hover].y - 12}
              textAnchor="middle"
              className="portfolio-trend__hover-label"
            >
              {sym}{points[hover].value.toLocaleString()}
            </text>
            <text
              x={points[hover].x}
              y={PAD.top + plotH + 16}
              textAnchor="middle"
              className="portfolio-trend__hover-date"
            >
              {points[hover].date}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
