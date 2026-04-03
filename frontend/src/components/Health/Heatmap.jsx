import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, Dumbbell } from 'lucide-react';
import './Heatmap.css';

const CELL_SIZE = 15;
const CELL_GAP = 3;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

function getColor(day) {
  if (!day) {
    return { bg: 'var(--bg-skeleton)', text: 'var(--text-tertiary)' };
  }

  const cal = day.total_calories || 0;
  const exMin = day.total_exercise_minutes || 0;
  const hasMood = day.mood != null;
  const hasAnyData = cal > 0 || exMin > 0 || hasMood;

  // No data at all — skeleton
  if (!hasAnyData) {
    return { bg: 'var(--bg-skeleton)', text: 'var(--text-tertiary)' };
  }

  const goal = day.calorie_goal || 2000;

  // Saturation based on exercise intensity
  let sat;
  if (exMin === 0) sat = 15;
  else if (exMin < 30) sat = 40;
  else if (exMin <= 60) sat = 65;
  else sat = 90;

  // If only mood/exercise data (no calories), use a neutral warm tone
  if (cal === 0) {
    const hue = exMin > 0 ? 142 : 200; // green if exercised, blue-gray if mood only
    return {
      bg: `hsl(${hue}, ${sat}%, 55%)`,
      text: 'rgba(255,255,255,0.85)',
    };
  }

  const ratio = cal / goal;

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

function DayDetailModal({ date, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/health_body/day/${date}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [date]);

  return (
    <motion.div
      className="heatmap-detail__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="heatmap-detail__modal"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="heatmap-detail__header">
          <h3 className="heatmap-detail__title">{formatDate(date)}</h3>
          <button className="heatmap-detail__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading && <p className="heatmap-detail__loading">Loading...</p>}

        {!loading && detail && (
          <>
            <div className="heatmap-detail__summary">
              <span>{detail.total_calories?.toLocaleString() || 0} kcal</span>
              <span>P:{detail.total_protein_g || 0}g C:{detail.total_carbs_g || 0}g F:{detail.total_fat_g || 0}g</span>
              {detail.total_exercise_minutes > 0 && <span>{detail.total_exercise_minutes} min exercise</span>}
              {detail.mood && <span>Mood: {detail.mood}/5</span>}
              {detail.energy && <span>Energy: {detail.energy}/5</span>}
            </div>

            {detail.meals?.length > 0 && (
              <div className="heatmap-detail__section">
                <h4 className="heatmap-detail__section-title"><Utensils size={14} /> Meals</h4>
                {detail.meals.map(m => (
                  <div key={m.id} className="heatmap-detail__item">
                    <div className="heatmap-detail__item-main">
                      {m.time && <span className="heatmap-detail__time">{m.time}</span>}
                      <span className="heatmap-detail__desc">{m.description}</span>
                    </div>
                    <div className="heatmap-detail__item-meta">
                      <span className="heatmap-detail__cal">{m.calories} kcal</span>
                      <span className="heatmap-detail__macros">
                        P:{m.protein_g}g C:{m.carbs_g}g F:{m.fat_g}g
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detail.exercises?.length > 0 && (
              <div className="heatmap-detail__section">
                <h4 className="heatmap-detail__section-title"><Dumbbell size={14} /> Exercise</h4>
                {detail.exercises.map(e => (
                  <div key={e.id} className="heatmap-detail__item">
                    <div className="heatmap-detail__item-main">
                      {e.time && <span className="heatmap-detail__time">{e.time}</span>}
                      <span className="heatmap-detail__desc">{e.description}</span>
                    </div>
                    <div className="heatmap-detail__item-meta">
                      <span>{e.duration_minutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!detail.meals?.length && !detail.exercises?.length) && (
              <p className="heatmap-detail__empty">No individual records for this day.</p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Heatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Arrange data into a 7-row grid (Mon=0 ... Sun=6)
  const { grid, weekCount, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) return { grid: [], weekCount: 0, monthLabels: [] };

    const dayMap = {};
    data.forEach(d => { dayMap[d.date] = d; });

    // Build grid: each column is a week, rows are Mon-Sun
    // Use T00:00:00 to avoid timezone shifts in date comparisons
    const firstDateStr = data[0].date;
    const lastDateStr = data[data.length - 1].date;
    const firstDate = new Date(firstDateStr + 'T00:00:00');
    const lastDate = new Date(lastDateStr + 'T00:00:00');

    // Align to Monday
    const startDay = firstDate.getDay(); // 0=Sun
    const mondayOffset = startDay === 0 ? 6 : startDay - 1;
    const gridStart = new Date(firstDate);
    gridStart.setDate(gridStart.getDate() - mondayOffset);

    const weeks = [];
    const months = [];
    let current = new Date(gridStart);
    let lastMonth = -1;

    // Use string comparison to avoid timezone issues cutting off today
    const toDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    while (toDateStr(current) <= lastDateStr) {
      const week = [];
      for (let row = 0; row < 7; row++) {
        const dateStr = toDateStr(current);
        const inRange = dateStr >= firstDateStr && dateStr <= lastDateStr;
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
                  onClick={() => setSelectedDate(day.date)}
                  style={{ cursor: 'pointer' }}
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

      {/* Day detail modal */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailModal
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
