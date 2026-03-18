import { useState, useMemo } from 'react';
import './Heatmap.css';

const CELL_SIZE = 15;
const CELL_GAP = 3;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

function getColor(day) {
  if (!day || day.total_calories === 0) {
    return { bg: 'var(--bg-skeleton)', text: 'var(--text-tertiary)' };
  }

  const goal = day.calorie_goal || 2000;
  const ratio = day.total_calories / goal;
  const exMin = day.total_exercise_minutes || 0;

  // Saturation based on exercise intensity
  let sat;
  if (exMin === 0) sat = 15;
  else if (exMin < 30) sat = 40;
  else if (exMin <= 60) sat = 65;
  else sat = 90;

  // Hue based on calorie adherence
  let hue, lightness;
  if (ratio < 0.8) {
    // Under — amber/yellow
    hue = 45;
    lightness = 55 - (0.8 - ratio) * 20;
  } else if (ratio <= 1.2) {
    // On target — green
    hue = 142;
    lightness = 50;
  } else {
    // Over — blue
    hue = 220;
    lightness = 50 + (ratio - 1.2) * 15;
  }

  lightness = Math.max(30, Math.min(70, lightness));

  return {
    bg: `hsl(${hue}, ${sat}%, ${lightness}%)`,
    text: lightness < 50 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)',
  };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Heatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  // Arrange data into a 7-row grid (Mon=0 ... Sun=6)
  const { grid, weekCount, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) return { grid: [], weekCount: 0, monthLabels: [] };

    const dayMap = {};
    data.forEach(d => { dayMap[d.date] = d; });

    // Build grid: each column is a week, rows are Mon-Sun
    const firstDate = new Date(data[0].date + 'T00:00:00');
    const lastDate = new Date(data[data.length - 1].date + 'T00:00:00');

    // Align to Monday
    const startDay = firstDate.getDay(); // 0=Sun
    const mondayOffset = startDay === 0 ? 6 : startDay - 1;
    const gridStart = new Date(firstDate);
    gridStart.setDate(gridStart.getDate() - mondayOffset);

    const weeks = [];
    const months = [];
    let current = new Date(gridStart);
    let lastMonth = -1;

    while (current <= lastDate) {
      const week = [];
      for (let row = 0; row < 7; row++) {
        const dateStr = current.toISOString().split('T')[0];
        const inRange = current >= firstDate && current <= lastDate;
        week.push(inRange ? (dayMap[dateStr] || { date: dateStr, total_calories: 0 }) : null);

        // Track month labels
        if (row === 0 && current.getMonth() !== lastMonth && inRange) {
          lastMonth = current.getMonth();
          months.push({
            col: weeks.length,
            label: current.toLocaleDateString('en-US', { month: 'short' }),
          });
        }

        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    return { grid: weeks, weekCount: weeks.length, monthLabels: months };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="heatmap card">
        <h3 className="heatmap__title">Activity Heatmap</h3>
        <p className="heatmap__empty">No data yet — start logging meals and exercise via Telegram.</p>
      </div>
    );
  }

  const svgWidth = 36 + weekCount * (CELL_SIZE + CELL_GAP);
  const svgHeight = 20 + 7 * (CELL_SIZE + CELL_GAP) + 8;

  return (
    <div className="heatmap card">
      <h3 className="heatmap__title">Activity Heatmap</h3>

      <div className="heatmap__scroll">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="heatmap__svg"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={36 + m.col * (CELL_SIZE + CELL_GAP)}
              y={10}
              className="heatmap__month-label"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            label && (
              <text
                key={i}
                x={0}
                y={22 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE * 0.75}
                className="heatmap__day-label"
              >
                {label}
              </text>
            )
          ))}

          {/* Grid cells */}
          {grid.map((week, col) =>
            week.map((day, row) => {
              if (!day) return null;
              const x = 36 + col * (CELL_SIZE + CELL_GAP);
              const y = 18 + row * (CELL_SIZE + CELL_GAP);
              const colors = getColor(day);
              const mood = day.mood;

              return (
                <g
                  key={`${col}-${row}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      day,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'default' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={3}
                    fill={colors.bg}
                    className="heatmap__cell"
                  />
                  {mood && (
                    <text
                      x={x + CELL_SIZE / 2}
                      y={y + CELL_SIZE / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.text}
                      className="heatmap__mood"
                    >
                      {mood}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="heatmap__legend">
        <div className="heatmap__legend-section">
          <span className="heatmap__legend-label">Calories:</span>
          <span className="heatmap__legend-swatch" style={{ background: 'hsl(45, 50%, 55%)' }} />
          <span className="heatmap__legend-text">Under</span>
          <span className="heatmap__legend-swatch" style={{ background: 'hsl(142, 50%, 50%)' }} />
          <span className="heatmap__legend-text">On target</span>
          <span className="heatmap__legend-swatch" style={{ background: 'hsl(220, 50%, 50%)' }} />
          <span className="heatmap__legend-text">Over</span>
        </div>
        <div className="heatmap__legend-section">
          <span className="heatmap__legend-label">Exercise:</span>
          <span className="heatmap__legend-swatch" style={{ background: 'hsl(142, 15%, 50%)' }} />
          <span className="heatmap__legend-text">Rest</span>
          <span className="heatmap__legend-swatch" style={{ background: 'hsl(142, 90%, 50%)' }} />
          <span className="heatmap__legend-text">Active</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="heatmap__tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="heatmap__tooltip-date">{formatDate(tooltip.day.date)}</div>
          <div>{tooltip.day.total_calories?.toLocaleString() || 0} / {tooltip.day.calorie_goal?.toLocaleString() || '—'} kcal</div>
          <div>Exercise: {tooltip.day.total_exercise_minutes || 0} min</div>
          {tooltip.day.mood && <div>Mood: {tooltip.day.mood}/5</div>}
          {tooltip.day.energy && <div>Energy: {tooltip.day.energy}/5</div>}
        </div>
      )}
    </div>
  );
}
