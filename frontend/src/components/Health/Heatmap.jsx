import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, Dumbbell, Trash2 } from 'lucide-react';
import { apiDelete } from '../../hooks/useApi';
import './Heatmap.css';

const CELL_SIZE = 15;
const CELL_GAP = 3;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

// 30-block RGB color ramp: Red(0%) → Yellow(50%) → Green(100%) → Cyan(120%) → Blue(140%)
const COLOR_RAMP = (() => {
  const anchors = [
    { pct: 0, r: 255, g: 0, b: 0 },       // Red
    { pct: 50, r: 255, g: 255, b: 0 },     // Yellow
    { pct: 100, r: 0, g: 255, b: 0 },      // Green
    { pct: 120, r: 0, g: 255, b: 255 },    // Cyan
    { pct: 140, r: 0, g: 0, b: 255 },      // Blue
  ];
  const ramp = [];
  for (let block = 0; block < 30; block++) {
    const pct = (block / 29) * 140;
    let i = 0;
    while (i < anchors.length - 2 && anchors[i + 1].pct < pct) i++;
    const a = anchors[i], b = anchors[i + 1];
    const t = (pct - a.pct) / (b.pct - a.pct);
    ramp.push([
      Math.round(a.r + (b.r - a.r) * t),
      Math.round(a.g + (b.g - a.g) * t),
      Math.round(a.b + (b.b - a.b) * t),
    ]);
  }
  return ramp;
})();

function getColor(day) {
  if (!day) {
    return { bg: 'var(--bg-skeleton)', text: 'var(--text-tertiary)' };
  }

  const cal = day.total_calories || 0;
  const exMin = day.total_exercise_minutes || 0;
  const hasMood = day.mood != null;
  const hasAnyData = cal > 0 || exMin > 0 || hasMood;

  if (!hasAnyData) {
    return { bg: 'var(--bg-skeleton)', text: 'var(--text-tertiary)' };
  }

  const goal = day.calorie_goal || 2200;

  // No calories but has exercise/mood — use a neutral green/blue
  if (cal === 0) {
    const mult = exMin > 0 ? (exMin >= 30 ? 1.0 : 0.85) : 0.7;
    const base = exMin > 0 ? [0, 200, 100] : [100, 130, 180];
    return {
      bg: `rgb(${Math.round(base[0] * mult)}, ${Math.round(base[1] * mult)}, ${Math.round(base[2] * mult)})`,
      text: 'rgba(255,255,255,0.9)',
    };
  }

  // Map calories to block index (0-29)
  const pct = Math.min(cal / goal, 1.4);
  const blockIdx = Math.min(29, Math.max(0, Math.round((pct / 1.4) * 29)));
  let [r, g, b] = COLOR_RAMP[blockIdx];

  // Exercise brightness multiplier
  // None=0.7, light (<30min or single)=0.85, heavy (30+min or 2+ exercises)=1.0
  let mult = 0.7;
  if (exMin > 0) {
    mult = exMin >= 30 ? 1.0 : 0.85;
  }

  r = Math.round(r * mult);
  g = Math.round(g * mult);
  b = Math.round(b * mult);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

  return {
    bg: `rgb(${r}, ${g}, ${b})`,
    text: luminance < 140 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
  };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function DayDetailModal({ date, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDetail = () => {
    setLoading(true);
    fetch(`/api/health_body/day/${date}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [date]);

  const handleDeleteMeal = async (mealId) => {
    setDeletingId(mealId);
    try {
      await apiDelete(`/api/health_body/meals/${mealId}`);
      fetchDetail();
    } catch (e) {
      console.error('Failed to delete meal:', e);
    } finally {
      setDeletingId(null);
    }
  };

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
                      <button
                        className="heatmap-detail__delete-btn"
                        onClick={() => handleDeleteMeal(m.id)}
                        disabled={deletingId === m.id}
                        title="Delete meal"
                      >
                        <Trash2 size={12} />
                      </button>
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

      {/* Legend — uses actual ramp samples with 0.85x multiplier for visibility */}
      <div className="heatmap__legend">
        <div className="heatmap__legend-section">
          <span className="heatmap__legend-label">Calories:</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[3].map(c => Math.round(c * 0.85))})` }} />
          <span className="heatmap__legend-text">Low</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[7].map(c => Math.round(c * 0.85))})` }} />
          <span className="heatmap__legend-text">Half</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[14].map(c => Math.round(c * 0.85))})` }} />
          <span className="heatmap__legend-text">Target</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[21].map(c => Math.round(c * 0.85))})` }} />
          <span className="heatmap__legend-text">Over</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[28].map(c => Math.round(c * 0.85))})` }} />
          <span className="heatmap__legend-text">High</span>
        </div>
        <div className="heatmap__legend-section">
          <span className="heatmap__legend-label">Exercise:</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[14].map(c => Math.round(c * 0.7))})` }} />
          <span className="heatmap__legend-text">None</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[14].map(c => Math.round(c * 0.85))})` }} />
          <span className="heatmap__legend-text">Light</span>
          <span className="heatmap__legend-swatch" style={{ background: `rgb(${COLOR_RAMP[14]})` }} />
          <span className="heatmap__legend-text">Heavy</span>
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
