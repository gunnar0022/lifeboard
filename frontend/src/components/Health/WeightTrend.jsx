import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import './WeightTrend.css';

const CHART_W = 600;
const CHART_H = 140;
const PAD = { top: 10, right: 20, bottom: 24, left: 44 };

export default function WeightTrend({ measurements }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(() => {
    if (!measurements) return [];
    // Reverse to chronological order and convert to kg
    return [...measurements]
      .filter(m => m.weight_g)
      .reverse()
      .map(m => ({
        date: m.date,
        kg: m.weight_g / 1000,
      }));
  }, [measurements]);

  if (data.length < 2) return null;

  const weights = data.map(d => d.kg);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const rangeW = maxW - minW || 1;

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * plotW,
    y: PAD.top + (1 - (d.kg - minW) / rangeW) * plotH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`;

  // Trend direction
  const first = data[0].kg;
  const last = data[data.length - 1].kg;
  const diff = last - first;
  const TrendIcon = diff < -0.3 ? TrendingDown : diff > 0.3 ? TrendingUp : Minus;
  const trendColor = diff < -0.3 ? 'var(--color-success)' : diff > 0.3 ? 'var(--color-alert)' : 'var(--text-tertiary)';

  // Y-axis ticks
  const ticks = [];
  const step = rangeW > 3 ? 1 : 0.5;
  for (let v = Math.ceil(minW / step) * step; v <= maxW; v += step) {
    ticks.push(v);
  }

  return (
    <div className="weight-trend card">
      <div className="weight-trend__header">
        <h3 className="weight-trend__title">Weight Trend</h3>
        <div className="weight-trend__current" style={{ color: trendColor }}>
          <TrendIcon size={16} />
          <span className="mono">{last.toFixed(1)} kg</span>
          <span className="weight-trend__diff mono">
            ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="weight-trend__svg"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-health-body)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-health-body)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis ticks */}
        {ticks.map(v => {
          const y = PAD.top + (1 - (v - minW) / rangeW) * plotH;
          return (
            <g key={v}>
              <line
                x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
                stroke="var(--border-subtle)" strokeDasharray="3,3"
              />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" className="weight-trend__tick">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#weightGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--color-health-body)" strokeWidth="2" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={hover === i ? 5 : 3}
            fill={hover === i ? 'var(--color-health-body)' : 'var(--bg-card)'}
            stroke="var(--color-health-body)"
            strokeWidth="2"
            onMouseEnter={() => setHover(i)}
            style={{ cursor: 'default' }}
          />
        ))}

        {/* X-axis date labels (first, middle, last) */}
        {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
          <text
            key={i}
            x={points[i].x}
            y={CHART_H - 4}
            textAnchor="middle"
            className="weight-trend__date-label"
          >
            {data[i].date.slice(5)}
          </text>
        ))}

        {/* Hover label */}
        {hover !== null && (
          <g>
            <text
              x={points[hover].x}
              y={points[hover].y - 10}
              textAnchor="middle"
              className="weight-trend__hover-label"
            >
              {points[hover].kg.toFixed(1)} kg
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
