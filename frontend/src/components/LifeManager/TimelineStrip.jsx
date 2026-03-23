import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, Receipt, AlertCircle, X,
  ChevronDown, ChevronUp, MapPin, Clock, Star, Pencil, Bell, Save,
} from 'lucide-react';
import './TimelineStrip.css';

const REMINDER_OPTIONS = [
  { label: 'None', value: null },
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '12 hours after', value: -720 },
  { label: '1 day after', value: -1440 },
];

function EventEditModal({ event, onClose, onSave }) {
  const [form, setForm] = useState({
    title: event.title || '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    all_day: event.all_day || false,
    location: event.location || '',
    description: event.description || '',
    reminder_offset: event.reminder_offset,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.end_time) delete body.end_time;
      if (!body.location) delete body.location;
      if (!body.description) delete body.description;

      const res = await fetch(`/api/life/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSave();
        onClose();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // Format datetime-local value for input
  const toInputValue = (iso) => {
    if (!iso) return '';
    return iso.slice(0, 16); // "2026-03-25T14:00"
  };

  return (
    <div className="event-modal__overlay" onClick={onClose}>
      <motion.div
        className="event-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="event-modal__header">
          <h3>Edit Event</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="event-modal__form">
          <label>
            <span>Title</span>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>

          <div className="event-modal__row">
            <label className="event-modal__check">
              <input
                type="checkbox"
                checked={form.all_day}
                onChange={e => setForm({ ...form, all_day: e.target.checked })}
              />
              All day
            </label>
          </div>

          {!form.all_day ? (
            <div className="event-modal__row">
              <label>
                <span>Start</span>
                <input
                  type="datetime-local"
                  value={toInputValue(form.start_time)}
                  onChange={e => setForm({ ...form, start_time: e.target.value + ':00' })}
                  required
                />
              </label>
              <label>
                <span>End</span>
                <input
                  type="datetime-local"
                  value={toInputValue(form.end_time)}
                  onChange={e => setForm({ ...form, end_time: e.target.value + ':00' })}
                />
              </label>
            </div>
          ) : (
            <label>
              <span>Date</span>
              <input
                type="date"
                value={form.start_time?.slice(0, 10) || ''}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </label>
          )}

          <label>
            <span>Location</span>
            <input
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Notes, details..."
            />
          </label>

          <label>
            <span><Bell size={12} /> Reminder</span>
            <select
              value={form.reminder_offset ?? 'none'}
              onChange={e => setForm({ ...form, reminder_offset: e.target.value === 'none' ? null : Number(e.target.value) })}
            >
              {REMINDER_OPTIONS.map(opt => (
                <option key={opt.label} value={opt.value ?? 'none'}>{opt.label}</option>
              ))}
            </select>
          </label>

          <div className="event-modal__actions">
            <button type="button" className="event-modal__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="event-modal__save" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function formatItemTitle(item) {
  return item.title || item.name || item.description || 'Untitled';
}

function getItemType(item) {
  if (item.due_date !== undefined && item.is_completed !== undefined) return 'task';
  if (item.next_due !== undefined || item.is_autopay !== undefined) return 'bill';
  return 'event';
}

function formatEventTime(item) {
  if (!item.start_time) return '';
  if (item.all_day) return 'All day';
  const t = item.start_time;
  if (t.includes('T')) {
    const time = t.split('T')[1]?.slice(0, 5);
    if (item.end_time && item.end_time.includes('T')) {
      return `${time} - ${item.end_time.split('T')[1]?.slice(0, 5)}`;
    }
    return time;
  }
  return '';
}

function DayPopup({ day, onClose, onEditEvent }) {
  const [expandedItem, setExpandedItem] = useState(null);

  if (!day) return null;
  const items = day.items || [];
  const holidays = day.holidays || [];
  const dateObj = new Date(day.date + 'T00:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const hasContent = items.length > 0 || holidays.length > 0;

  return (
    <div className="day-popup">
      <div className="day-popup__header">
        <span className="day-popup__date">{formatted}</span>
        <button className="day-popup__close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {holidays.length > 0 && (
        <div className="day-popup__holidays">
          {holidays.map((h, i) => (
            <div key={i} className={`day-popup__holiday day-popup__holiday--${h.country || 'other'} ${h.type === 'observance' ? 'day-popup__holiday--obs' : ''}`}>
              <Star size={11} />
              <span>{typeof h === 'string' ? h : h.title}</span>
              {h.country && <span className="day-popup__holiday-flag">{h.country === 'jp' ? '🇯🇵' : h.country === 'us' ? '🇺🇸' : ''}</span>}
              {h.type === 'observance' && <span className="day-popup__holiday-type">obs</span>}
            </div>
          ))}
        </div>
      )}

      {!hasContent ? (
        <div className="day-popup__empty">Nothing scheduled</div>
      ) : (
        <div className="day-popup__items">
          {items.map((item, i) => {
            const type = getItemType(item);
            const isExpanded = expandedItem === i;
            const timeStr = type === 'event' ? formatEventTime(item) : '';

            return (
              <div key={i}>
                <button
                  className={`day-popup__item day-popup__item--${type}`}
                  onClick={() => setExpandedItem(isExpanded ? null : i)}
                >
                  <span className="day-popup__item-icon">
                    {type === 'event' && <Calendar size={12} />}
                    {type === 'task' && <CheckCircle2 size={12} />}
                    {type === 'bill' && <Receipt size={12} />}
                  </span>
                  <span className="day-popup__item-title">{formatItemTitle(item)}</span>
                  {timeStr && <span className="day-popup__item-time mono">{timeStr}</span>}
                </button>

                <AnimatePresence>
                  {isExpanded && type === 'event' && (
                    <motion.div
                      className="day-popup__detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {item.location && (
                        <div className="day-popup__detail-row">
                          <MapPin size={11} /> {item.location}
                        </div>
                      )}
                      {item.description && (
                        <div className="day-popup__detail-row day-popup__detail-desc">
                          {item.description}
                        </div>
                      )}
                      {item.source_calendar && item.source_calendar !== 'personal' && (
                        <div className="day-popup__detail-row day-popup__detail-cal">
                          Calendar: {item.source_calendar}
                        </div>
                      )}
                      {item.reminder_offset != null && (
                        <div className="day-popup__detail-row">
                          <Bell size={11} /> Reminder: {REMINDER_OPTIONS.find(o => o.value === item.reminder_offset)?.label || `${item.reminder_offset} min`}
                        </div>
                      )}
                      <button
                        className="day-popup__edit-btn"
                        onClick={(e) => { e.stopPropagation(); if (onEditEvent) onEditEvent(item); }}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default function TimelineStrip({ timeline, onRefresh }) {
  const scrollRef = useRef(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('strip'); // 'strip' or 'month'
  const [editingEvent, setEditingEvent] = useState(null);

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

  const hasActivity = (day) => day.events > 0 || day.tasks > 0 || day.bills > 0 || day.has_overdue || (day.holidays && day.holidays.length > 0);

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
              className={`timeline-day${day.is_today ? ' timeline-day--today' : ''}${day.has_overdue ? ' timeline-day--overdue' : ''}${selectedDay?.date === day.date ? ' timeline-day--selected' : ''}${day.holidays?.length > 0 ? ' timeline-day--holiday' : ''}`}
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
              {day.holidays?.length > 0 && (
                <span className={`timeline-day__holiday timeline-day__holiday--${day.holidays[0]?.country || 'other'}`}>
                  {typeof day.holidays[0] === 'string' ? day.holidays[0] : day.holidays[0]?.title}
                </span>
              )}
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
                    className={`timeline-grid__cell${day.is_today ? ' timeline-grid__cell--today' : ''}${hasActivity(day) ? ' timeline-grid__cell--has-items' : ''}${selectedDay?.date === day.date ? ' timeline-grid__cell--selected' : ''}${day.has_overdue ? ' timeline-grid__cell--overdue' : ''}${day.holidays?.length > 0 ? ' timeline-grid__cell--holiday' : ''}${day.is_before_today ? ' timeline-grid__cell--past' : ''}`}
                    onClick={() => handleDayClick(day)}
                    title={day.holidays?.length > 0 ? (typeof day.holidays[0] === 'string' ? day.holidays[0] : day.holidays[0]?.title) : ''}
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
                        {day.holidays?.length > 0 && <span className="grid-dot grid-dot--holiday" />}
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
      {selectedDay && (
        <DayPopup day={selectedDay} onClose={() => setSelectedDay(null)} onEditEvent={setEditingEvent} />
      )}

      {/* Edit modal — rendered at top level to avoid stacking context issues */}
      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={() => { setEditingEvent(null); if (onRefresh) onRefresh(); }}
        />
      )}
    </div>
  );
}
