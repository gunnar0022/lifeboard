import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './SpendingChart.css';

const COLORS = [
  '#0EA5A0', '#F97066', '#F59E0B', '#8B5CF6',
  '#3B82F6', '#EC4899', '#14B8A6', '#EF4444',
  '#6366F1', '#84CC16', '#F97316', '#06B6D4',
];

export default function SpendingChart({ spending, currencySymbol, onCategoryClick }) {
  const categories = spending?.[0]?.categories || [];

  if (categories.length === 0) {
    return (
      <div className="spending-chart card">
        <h3 className="chart-title">Spending by Category</h3>
        <div className="chart-empty">No spending data this cycle</div>
      </div>
    );
  }

  const data = categories.map((c) => ({
    name: c.category,
    value: c.total,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="spending-chart card">
      <h3 className="chart-title">Spending by Category</h3>
      <div className="spending-chart__container">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '0.8125rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="spending-chart__center mono">
          <span className="spending-chart__total">{currencySymbol}{total.toLocaleString()}</span>
          <span className="spending-chart__total-label">total</span>
        </div>
      </div>
      <div className="spending-chart__legend">
        {data.map((d, i) => (
          <div
            key={d.name}
            className={`legend-item ${onCategoryClick ? 'legend-item--clickable' : ''}`}
            onClick={() => onCategoryClick?.(d.name)}
          >
            <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="legend-label">{d.name}</span>
            <span className="legend-value mono">{currencySymbol}{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
