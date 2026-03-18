import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import './AllocationChart.css';

const CLASS_COLORS = {
  stock: '#7C5CFC',
  etf: '#3B82F6',
  crypto: '#F59E0B',
  bond: '#10B981',
  other: '#6B7280',
};

const CLASS_LABELS = {
  stock: 'Stocks',
  etf: 'ETFs',
  crypto: 'Crypto',
  bond: 'Bonds',
  other: 'Other',
};

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

function formatAmount(value, currency) {
  if (currency === 'USD') {
    return `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `¥${Math.round(value).toLocaleString()}`;
}

export default function AllocationChart({ breakdown, totalValue, currencySymbol, displayCurrency, fxRate }) {
  if (!breakdown || totalValue <= 0) return null;

  const dc = displayCurrency || 'JPY';
  const nativeCurrency = 'JPY'; // snapshots/portfolio store in JPY

  const entries = Object.entries(breakdown)
    .filter(([, data]) => data.value > 0)
    .sort((a, b) => b[1].value - a[1].value);

  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, data]) => sum + data.value, 0);
  const displayTotal = convertValue(total, nativeCurrency, dc, fxRate);

  // Donut chart math — 50% bigger than original (radius 70->105, cx/cy 90->135, inner 45->67)
  const radius = 105;
  const cx = 135;
  const cy = 135;
  const innerRadius = 67;
  let cumulativeAngle = -90;

  const slices = entries.map(([cls, data]) => {
    const pct = data.value / total;
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

    const displayValue = convertValue(data.value, nativeCurrency, dc, fxRate);

    return {
      cls,
      label: CLASS_LABELS[cls] || cls,
      value: displayValue,
      count: data.count,
      pct,
      d,
      color: CLASS_COLORS[cls] || CLASS_COLORS.other,
    };
  });

  return (
    <div className="allocation-chart card">
      <h4 className="allocation-chart__title">
        <PieChart size={16} />
        Asset Allocation
      </h4>
      <div className="allocation-chart__content">
        <svg viewBox="0 0 270 270" className="allocation-chart__svg">
          {slices.map((s, i) => (
            <motion.path
              key={s.cls}
              d={s.d}
              fill={s.color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" className="allocation-chart__center-label">
            {formatAmount(displayTotal, dc)}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="allocation-chart__center-sub">
            total
          </text>
        </svg>
        <div className="allocation-chart__legend">
          {slices.map(s => (
            <div key={s.cls} className="allocation-chart__legend-item">
              <span className="allocation-chart__dot" style={{ background: s.color }} />
              <span className="allocation-chart__legend-label">{s.label}</span>
              <span className="allocation-chart__legend-pct mono">{(s.pct * 100).toFixed(1)}%</span>
              <span className="allocation-chart__legend-amt mono">
                {formatAmount(s.value, dc)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
