import { useState, useMemo, useEffect, useRef } from 'react';
import { Calculator } from 'lucide-react';
import './ProjectionCalculator.css';

/**
 * Frontend-only projection calculator (LM-35: no backend endpoint).
 * Uses compound interest with monthly contributions.
 */

const CHART_W = 600;
const CHART_H = 140;
const PAD = { top: 10, right: 20, bottom: 24, left: 60 };

function formatCompact(value, symbol) {
  const abs = Math.abs(value);
  if (abs >= 1000000000) return `${symbol}${(value / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`;
  return `${symbol}${Math.round(value).toLocaleString()}`;
}

function convertToDisplay(jpyValue, currency, fxRate) {
  if (currency === 'USD' && fxRate) {
    return Math.round(jpyValue * fxRate.jpy_to_usd);
  }
  return jpyValue;
}

function calculateProjection(startingValue, monthlyContribution, annualReturn, years) {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;
  const points = [];
  let balance = startingValue;
  let balanceNoContrib = startingValue;

  for (let m = 0; m <= months; m++) {
    if (m % 12 === 0) {
      points.push({
        year: m / 12,
        withContrib: Math.round(balance),
        growthOnly: Math.round(balanceNoContrib),
      });
    }
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    balanceNoContrib = balanceNoContrib * (1 + monthlyRate);
  }
  return points;
}

export default function ProjectionCalculator({ currentValue, currencySymbol, displayCurrency, fxRate }) {
  const sym = currencySymbol || '¥';
  const dc = displayCurrency || 'JPY';
  const prevCurrency = useRef(dc);
  const [startValue, setStartValue] = useState(() => convertToDisplay(currentValue || 0, dc, fxRate));
  const [monthly, setMonthly] = useState(dc === 'USD' ? 350 : 50000);
  const [returnRate, setReturnRate] = useState(7);
  const [years, setYears] = useState(20);
  const [expanded, setExpanded] = useState(false);

  // Re-initialize values when currency changes
  useEffect(() => {
    if (prevCurrency.current !== dc) {
      setStartValue(convertToDisplay(currentValue || 0, dc, fxRate));
      setMonthly(dc === 'USD' ? 350 : 50000);
      prevCurrency.current = dc;
    }
  }, [dc, currentValue, fxRate]);

  const projection = useMemo(
    () => calculateProjection(startValue, monthly, returnRate, years),
    [startValue, monthly, returnRate, years]
  );

  const finalValue = projection.length > 0 ? projection[projection.length - 1].withContrib : 0;
  const totalContributions = startValue + monthly * years * 12;
  const totalGrowth = finalValue - totalContributions;

  if (!expanded) {
    return (
      <div className="projection card">
        <button className="projection__toggle" onClick={() => setExpanded(true)}>
          <Calculator size={16} />
          <span>Future Projection Calculator</span>
          <span className="projection__toggle-hint">Click to expand</span>
        </button>
      </div>
    );
  }

  // Chart math
  const allValues = projection.flatMap(p => [p.withContrib, p.growthOnly]);
  const maxV = Math.max(...allValues) * 1.05;
  const minV = 0;
  const rangeV = maxV - minV || 1;

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const withPoints = projection.map((p, i) => ({
    x: PAD.left + (i / (projection.length - 1)) * plotW,
    y: PAD.top + (1 - (p.withContrib - minV) / rangeV) * plotH,
    value: p.withContrib,
    year: p.year,
  }));

  const growthPoints = projection.map((p, i) => ({
    x: PAD.left + (i / (projection.length - 1)) * plotW,
    y: PAD.top + (1 - (p.growthOnly - minV) / rangeV) * plotH,
    value: p.growthOnly,
  }));

  const withPath = withPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const growthPath = growthPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Y-axis ticks
  const ticks = [];
  const step = rangeV / 4;
  for (let i = 0; i <= 4; i++) ticks.push(minV + step * i);

  return (
    <div className="projection card">
      <div className="projection__header">
        <h4 className="projection__title">
          <Calculator size={14} />
          Future Projection
        </h4>
        <button className="projection__collapse" onClick={() => setExpanded(false)}>
          Collapse
        </button>
      </div>

      <div className="projection__inputs">
        <label className="projection__field">
          <span className="projection__label">Starting Value</span>
          <input
            type="number"
            className="projection__input mono"
            value={startValue}
            onChange={(e) => setStartValue(Number(e.target.value))}
          />
        </label>
        <label className="projection__field">
          <span className="projection__label">Monthly Contribution</span>
          <input
            type="number"
            className="projection__input mono"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
          />
        </label>
        <label className="projection__field">
          <span className="projection__label">Annual Return (%)</span>
          <input
            type="number"
            className="projection__input mono"
            value={returnRate}
            step="0.5"
            min="0"
            max="25"
            onChange={(e) => setReturnRate(Number(e.target.value))}
          />
        </label>
        <label className="projection__field">
          <span className="projection__label">Time Horizon (years)</span>
          <select
            className="projection__input"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          >
            {[5, 10, 15, 20, 25, 30].map(y => (
              <option key={y} value={y}>{y} years</option>
            ))}
          </select>
        </label>
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="projection__svg"
      >
        {/* Y-axis ticks */}
        {ticks.map((v, i) => {
          const y = PAD.top + (1 - (v - minV) / rangeV) * plotH;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
                stroke="var(--border-subtle)" strokeDasharray="3,3"
              />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" className="projection__tick">
                {formatCompact(Math.round(v), sym)}
              </text>
            </g>
          );
        })}

        {/* Growth only line (dashed) */}
        <path
          d={growthPath} fill="none"
          stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="4,4"
        />

        {/* With contributions line (solid) */}
        <path
          d={withPath} fill="none"
          stroke="var(--color-investing)" strokeWidth="2" strokeLinejoin="round"
        />

        {/* X-axis year labels */}
        {withPoints.filter((_, i) => i % Math.max(1, Math.floor(projection.length / 5)) === 0 || i === projection.length - 1).map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={CHART_H - 4}
            textAnchor="middle"
            className="projection__date-label"
          >
            {p.year}y
          </text>
        ))}
      </svg>

      <div className="projection__legend">
        <div className="projection__legend-item">
          <span className="projection__legend-line solid" />
          <span>With contributions</span>
        </div>
        <div className="projection__legend-item">
          <span className="projection__legend-line dashed" />
          <span>Growth only</span>
        </div>
      </div>

      <div className="projection__result">
        <div className="projection__result-item">
          <span className="projection__result-label">Projected Value</span>
          <span className="projection__result-value mono">
            {sym}{finalValue.toLocaleString()}
          </span>
        </div>
        <div className="projection__result-item">
          <span className="projection__result-label">Total Contributions</span>
          <span className="projection__result-value mono">
            {sym}{totalContributions.toLocaleString()}
          </span>
        </div>
        <div className="projection__result-item">
          <span className="projection__result-label">Investment Growth</span>
          <span className="projection__result-value mono" style={{ color: 'var(--color-success)' }}>
            +{sym}{totalGrowth.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
