import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ExternalLink, Plus, Check } from 'lucide-react';
import { useApi, apiPost } from '../../hooks/useApi';
import TimelineStrip from '../LifeManager/TimelineStrip';
import './Organizer.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

function AddEventForm({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const startTime = allDay ? date : `${date}T${time || '09:00'}`;
      await apiPost('/api/life/events', {
        title: title.trim(),
        start_time: startTime,
        all_day: allDay,
      });
      setTitle('');
      setTime('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      onSuccess();
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <form className="organizer-add-event" onSubmit={handleSubmit}>
      <Plus size={16} className="organizer-add-event__icon" />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add an event..."
        className="organizer-add-event__input"
        disabled={saving}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="organizer-add-event__date"
        disabled={saving}
      />
      {!allDay && (
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="organizer-add-event__time"
          disabled={saving}
        />
      )}
      <label className="organizer-add-event__allday">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
        />
        All day
      </label>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check size={16} style={{ color: 'var(--color-success)' }} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

export default function OrganizerCalendar() {
  const { data: timeline, refetch: refetchTimeline } = useApi('/api/life/timeline?days=56', { panelKey: 'life_manager' });
  const { data: googleStatus } = useApi('/api/google/status');

  return (
    <motion.div
      className="organizer-tab"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {googleStatus && !googleStatus.connected && googleStatus.has_credentials && (
        <motion.a
          href="/api/google/auth"
          className="organizer-tab__google-connect card"
          target="_self"
          variants={fadeUp}
        >
          <Calendar size={18} />
          <div>
            <strong>Connect Google Calendar</strong>
            <span>Click to authorize — syncs events, holidays, and reminders</span>
          </div>
          <ExternalLink size={14} />
        </motion.a>
      )}

      <motion.div variants={fadeUp}>
        <AddEventForm onSuccess={refetchTimeline} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <TimelineStrip timeline={timeline || []} onRefresh={refetchTimeline} />
      </motion.div>
    </motion.div>
  );
}
