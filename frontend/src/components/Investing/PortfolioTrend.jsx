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

function formatCompactCurrency(rawValue, currency) {
  // Convert to display units first (USD cents -> dollars)
  const value = currency === 'USD' ? rawValue / 100 : rawValue;
  const sym = currency === 'USD' ? '$' : '¥';

  const abs = Math.abs(value);
  if (abs >= 1000000000) return `${sym}${(value / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${sym}${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
  if (currency === 'USD') return `${sym}${value.toFixed(0)}`;
  return `${sym}${Math.round(value).toLocaleString()}`;
}

function convertValue(value, fromCurrency, toCurrency, fxRate) {
  if (!fxRate || fromCurrency === toCurrency) return value;
  if (fromCurrency === 'JPY' && toCurrency === 'USD') {
    return Math.round(value * fxRate.jpy_to_usd * 100);
  }
  if (fromCurrency === 'USD' && toCurrency === 'JPY') {
    return Math.round((value / 100) * fxRate.usd_to_jpy);
  }
  return value;
}

function formatValue(value, currency) {
  if (currency === 'USD') {
    return `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `¥${Math.round(value).toLocaleString()}`;
}

export default function PortfolioTrend({ snapshots, portfolio, currencySymbol, displayCurrency, fxRate }) {
  const [range, setRange] = useState('3M');
  const [hoverIdx, setHoverIdx] = useState(null);

  const sym = currencySymbol || '¥';
  const dc = displayCurrency || 'JPY';

  const data = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    const rangeDays = RANGES.find(r => r.label === range)?.days || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return snapshots
      .filter(s => range === 'ALL' || s.date >= cutoffStr)
      .map(s => ({
        date: s.date,
        value: convertValue(s.total_value, s.currency || 'JPY', dc, fxRate),
      }));
  }, [snapshots, range, dc, fxRate]);

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

  // Converted portfolio values for display
  const snapshotCurrency = snapshots?.[0]?.currency || 'JPY';
  const displayTotal = convertValue(portfolio?.total_value || 0, snapshotCurrency, dc, fxRate);
  const displayGain = convertValue(portfolio?.gain_loss || 0, snapshotCurrency, dc, fxRate);
  const totalGainPct = portfolio?.gain_loss_pct || 0;

  // Trend direction
  const isUp = displayGain > 0;
  const TrendIcon = displayGain > 0 ? TrendingUp : displayGain < 0 ? TrendingDown : Minus;
  const trendColor = isUp ? 'var(--color-success)' : displayGain < 0 ? 'var(--color-alert)' : 'var(--text-tertiary)';

  // Y-axis ticks
  const ticks = [];
  const step = rangeV / 4;
  for (let i = 0; i <= 4; i++) {
    ticks.push(minV + step * i);
  }

  // Mouse move handler: find nearest point by X coordinate
  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * CHART_W;

    if (svgX < PAD.left || svgX > CHART_W - PAD.right) {
      setHoverIdx(null);
      return;
    }

    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
  };

  return (
    <div className="portfolio-trend card">
      <div className="portfolio-trend__header">
        <div className="portfolio-trend__left">
          <h3 className="portfolio-trend__title">Portfolio Value</h3>
          <div className="portfolio-trend__value mono">
            {formatValue(hoverIdx !== null ? points[hoverIdx].value : displayTotal, dc)}
          </div>
          {hoverIdx !== null ? (
            <div className="portfolio-trend__gain" style={{ color: 'var(--text-secondary)' }}>
              <span className="mono">{points[hoverIdx].date}</span>
            </div>
          ) : (
            <div className="portfolio-trend__gain" style={{ color: trendColor }}>
              <TrendIcon size={14} />
              <span className="mono">
                {isUp ? '+' : ''}{formatValue(displayGain, dc)} ({isUp ? '+' : ''}{totalGainPct}%)
              </span>
              <span className="portfolio-trend__gain-label">total return</span>
            </div>
          )}
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
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
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
                {formatCompactCurrency(Math.round(v), dc)}
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

        {/* Hover indicator dot */}
        {hoverIdx !== null && (
          <circle
            cx={points[hoverIdx].x} cy={points[hoverIdx].y} r={5}
            fill="var(--color-investing)" stroke="white" strokeWidth="2"
          />
        )}

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

        {/* Hover vertical line */}
        {hoverIdx !== null && (
          <line
            x1={points[hoverIdx].x} y1={PAD.top}
            x2={points[hoverIdx].x} y2={PAD.top + plotH}
            stroke="var(--color-investing)" strokeOpacity="0.3" strokeDasharray="3,3"
          />
        )}

        {/* Invisible overlay for mouse tracking */}
        <rect
          x={PAD.left} y={PAD.top}
          width={plotW} height={plotH}
          fill="transparent"
          style={{ cursor: 'crosshair' }}
        />
      </svg>
    </div>
  );
}
