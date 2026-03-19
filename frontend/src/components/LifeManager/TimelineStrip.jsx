import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, Receipt, AlertCircle, X,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import './TimelineStrip.css';

function formatItemTitle(item) {
  return item.title || item.name || item.description || 'Untitled';
}

function getItemType(item) {
  if (item.due_date !== undefined && item.is_completed !== undefined) return 'task';
  if (item.next_due !== undefined || item.is_autopay !== undefined) return 'bill';
  return 'event';
}

function DayPopup({ day, onClose }) {
  if (!day) return null;
  const items = day.items || [];
  const dateObj = new Date(day.date + 'T00:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <motion.div
      className="day-popup"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      <div className="day-popup__header">
        <span className="day-popup__date">{formatted}</span>
        <button className="day-popup__close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="day-popup__empty">Nothing scheduled</div>
      ) : (
        <div className="day-popup__items">
          {items.map((item, i) => {
            const type = getItemType(item);
            return (
              <div key={i} className={`day-popup__item day-popup__item--${type}`}>
                <span className="day-popup__item-icon">
                  {type === 'event' && <Calendar size={12} />}
                  {type === 'task' && <CheckCircle2 size={12} />}
                  {type === 'bill' && <Receipt size={12} />}
                </span>
                <span className="day-popup__item-title">{formatItemTitle(item)}</span>
                <span className="day-popup__item-type">{type}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function TimelineStrip({ timeline }) {
  const scrollRef = useRef(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('strip'); // 'strip' or 'month'

  // Build 8-week grid (56 days), aligned to Monday start
  const weeksGrid = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    const todayDate = new Date(timeline[0].date + 'T00:00:00');
    const dayMap = {};
    for (const d of timeline) {
      dayMap[d.date] = d;
    }

    // Rewind to previous Monday so grid columns align with Mon-Sun header
    const todayDow = todayDate.getDay(); // 0=Sun
    const mondayOffset = todayDow === 0 ? 6 : todayDow - 1;
    const gridStart = new Date(todayDate);
    gridStart.setDate(gridStart.getDate() - mondayOffset);

    const toDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const weeks = [];
    // 8 full weeks from grid start
    const totalDays = 56 + mondayOffset; // extra days to fill 8 full weeks
    let currentWeek = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);
      const existing = dayMap[dateStr];
      const dayData = existing || {
        date: dateStr,
        day_name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        day_num: d.getDate(),
        is_today: false,
        events: 0,
        tasks: 0,
        bills: 0,
        has_overdue: false,
        items: [],
      };

      dayData.is_month_start = d.getDate() === 1;
      dayData.month_label = d.toLocaleDateString('en-US', { month: 'short' });
      dayData.is_before_today = d < todayDate;

      currentWeek.push(dayData);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        if (weeks.length >= 8) break;
      }
    }
    if (currentWeek.length > 0 && weeks.length < 8) weeks.push(currentWeek);
    return weeks;
  }, [timeline]);

  if (!timeline || timeline.length === 0) return null;

  const handleDayClick = (day) => {
    setSelectedDay(selectedDay?.date === day.date ? null : day);
  };

  const hasActivity = (day) => day.events > 0 || day.tasks > 0 || day.bills > 0 || day.has_overdue;

  return (
    <div className="timeline-strip card">
      <div className="timeline-strip__header">
        <h3 className="chart-title">
          {viewMode === 'strip' ? 'Next 14 Days' : 'Next 8 Weeks'}
        </h3>
        <button
          className="timeline-strip__view-toggle"
          onClick={() => {
            setViewMode(viewMode === 'strip' ? 'month' : 'strip');
            setSelectedDay(null);
          }}
          title={viewMode === 'strip' ? 'Show 8-week view' : 'Show strip view'}
        >
          {viewMode === 'strip' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {viewMode === 'strip' ? '8 weeks' : 'Compact'}
        </button>
      </div>

      {/* Strip view (14-day horizontal scroll) */}
      {viewMode === 'strip' && (
        <div className="timeline-strip__scroll" ref={scrollRef}>
          {timeline.map((day, i) => (
            <motion.button
              key={day.date}
              className={`timeline-day${day.is_today ? ' timeline-day--today' : ''}${day.has_overdue ? ' timeline-day--overdue' : ''}${selectedDay?.date === day.date ? ' timeline-day--selected' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              onClick={() => handleDayClick(day)}
            >
              <span className="timeline-day__name">{day.is_today ? 'Today' : day.day_name}</span>
              <span className="timeline-day__num">{day.day_num}</span>
              <div className="timeline-day__dots">
                {day.events > 0 && (
                  <span className="timeline-dot timeline-dot--event">
                    <Calendar size={10} />
                  </span>
                )}
                {day.tasks > 0 && (
                  <span className="timeline-dot timeline-dot--task">
                    <CheckCircle2 size={10} />
                  </span>
                )}
                {day.bills > 0 && (
                  <span className="timeline-dot timeline-dot--bill">
                    <Receipt size={10} />
                  </span>
                )}
                {day.has_overdue && (
                  <span className="timeline-dot timeline-dot--overdue">
                    <AlertCircle size={10} />
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* 8-week grid view */}
      {viewMode === 'month' && (
        <div className="timeline-grid">
          <div className="timeline-grid__header">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <span key={d} className="timeline-grid__day-label">{d}</span>
            ))}
          </div>
          <div className="timeline-grid__body">
            {weeksGrid.map((week, wi) => (
              <div key={wi} className="timeline-grid__row">
                {week.map(day => (
                  <button
                    key={day.date}
                    className={`timeline-grid__cell${day.is_today ? ' timeline-grid__cell--today' : ''}${hasActivity(day) ? ' timeline-grid__cell--has-items' : ''}${selectedDay?.date === day.date ? ' timeline-grid__cell--selected' : ''}${day.has_overdue ? ' timeline-grid__cell--overdue' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day.is_month_start && (
                      <span className="timeline-grid__month-tag">{day.month_label}</span>
                    )}
                    <span className="timeline-grid__cell-num">{day.day_num}</span>
                    {hasActivity(day) && (
                      <div className="timeline-grid__cell-dots">
                        {day.events > 0 && <span className="grid-dot grid-dot--event" />}
                        {day.tasks > 0 && <span className="grid-dot grid-dot--task" />}
                        {day.bills > 0 && <span className="grid-dot grid-dot--bill" />}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day detail popup */}
      <AnimatePresence>
        {selectedDay && (
          <DayPopup day={selectedDay} onClose={() => setSelectedDay(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
