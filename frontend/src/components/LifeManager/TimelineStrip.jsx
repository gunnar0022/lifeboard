import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Receipt, AlertCircle } from 'lucide-react';
import './TimelineStrip.css';

export default function TimelineStrip({ timeline }) {
  const scrollRef = useRef(null);

  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="timeline-strip card">
      <h3 className="chart-title">Next 14 Days</h3>
      <div className="timeline-strip__scroll" ref={scrollRef}>
        {timeline.map((day, i) => (
          <motion.div
            key={day.date}
            className={`timeline-day${day.is_today ? ' timeline-day--today' : ''}${day.has_overdue ? ' timeline-day--overdue' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
          >
            <span className="timeline-day__name">{day.is_today ? 'Today' : day.day_name}</span>
            <span className="timeline-day__num">{day.day_num}</span>
            <div className="timeline-day__dots">
              {day.events > 0 && (
                <span className="timeline-dot timeline-dot--event" title={`${day.events} event${day.events > 1 ? 's' : ''}`}>
                  <Calendar size={10} />
                </span>
              )}
              {day.tasks > 0 && (
                <span className="timeline-dot timeline-dot--task" title={`${day.tasks} task${day.tasks > 1 ? 's' : ''}`}>
                  <CheckCircle2 size={10} />
                </span>
              )}
              {day.bills > 0 && (
                <span className="timeline-dot timeline-dot--bill" title={`${day.bills} bill${day.bills > 1 ? 's' : ''}`}>
                  <Receipt size={10} />
                </span>
              )}
              {day.has_overdue && (
                <span className="timeline-dot timeline-dot--overdue" title="Overdue items">
                  <AlertCircle size={10} />
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
