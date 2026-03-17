import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './CycleTrend.css';

export default function CycleTrend({ trend, currencySymbol }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="cycle-trend card">
        <h3 className="chart-title">Pay Cycle Trend</h3>
        <div className="chart-empty">No cycle data yet</div>
      </div>
    );
  }

  // Filter out cycles with zero data
  const hasData = trend.some((t) => t.income > 0 || t.expenses > 0);
  if (!hasData) {
    return (
      <div className="cycle-trend card">
        <h3 className="chart-title">Pay Cycle Trend</h3>
        <div className="chart-empty">No cycle data yet</div>
      </div>
    );
  }

  return (
    <div className="cycle-trend card">
      <h3 className="chart-title">Pay Cycle Trend (Last 6)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0eb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value, name) => [
              `${currencySymbol}${value.toLocaleString()}`,
              name === 'income' ? 'Income' : 'Expenses',
            ]}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '0.8125rem',
            }}
          />
          <Bar
            dataKey="income"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="expenses"
            fill="#EF4444"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="cycle-trend__legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#10B981' }} />
          Income
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#EF4444' }} />
          Expenses
        </span>
      </div>
    </div>
  );
}
