import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Utensils, Dumbbell, Smile, Zap } from 'lucide-react';
import './RecentDetail.css';

export default function RecentDetail({ days }) {
  const [expanded, setExpanded] = useState(days?.[0]?.date || null);

  if (!days || days.length === 0) {
    return (
      <div className="recent-detail card">
        <h3 className="recent-detail__title">Recent Activity</h3>
        <p className="recent-detail__empty">No recent data — log meals and exercise via Telegram.</p>
      </div>
    );
  }

  return (
    <div className="recent-detail card">
      <h3 className="recent-detail__title">Recent Activity</h3>

      <div className="recent-detail__days">
        {days.map((day) => {
          const isExpanded = expanded === day.date;
          const meals = day.meals || [];
          const exercises = day.exercises || [];
          const isToday = day.date === new Date().toISOString().split('T')[0];

          return (
            <div key={day.date} className="recent-detail__day">
              <button
                className={`recent-detail__day-header ${isExpanded ? 'recent-detail__day-header--active' : ''}`}
                onClick={() => setExpanded(isExpanded ? null : day.date)}
              >
                <div className="recent-detail__day-info">
                  <span className="recent-detail__day-name">
                    {isToday ? 'Today' : day.day_name}
                  </span>
                  <span className="recent-detail__day-date">{day.date}</span>
                </div>
                <div className="recent-detail__day-stats">
                  <span className="recent-detail__stat">
                    <Utensils size={13} />
                    <span className="mono">{day.total_calories?.toLocaleString() || 0}</span> kcal
                  </span>
                  {day.total_exercise_minutes > 0 && (
                    <span className="recent-detail__stat">
                      <Dumbbell size={13} />
                      {day.total_exercise_minutes} min
                    </span>
                  )}
                  {day.mood && (
                    <span className="recent-detail__stat">
                      <Smile size={13} />
                      {day.mood}/5
                    </span>
                  )}
                  {day.energy && (
                    <span className="recent-detail__stat">
                      <Zap size={13} />
                      {day.energy}/5
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`recent-detail__chevron ${isExpanded ? 'recent-detail__chevron--open' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="recent-detail__content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {meals.length > 0 && (
                      <div className="recent-detail__section">
                        <h4 className="recent-detail__section-title">
                          <Utensils size={14} /> Meals
                        </h4>
                        {meals.map((m) => (
                          <div key={m.id} className="recent-detail__item">
                            <span className="recent-detail__time mono">{m.time || '—'}</span>
                            <span className="recent-detail__desc">{m.description}</span>
                            <span className="recent-detail__macros mono">
                              {m.calories} kcal
                              <span className="recent-detail__macro-detail">
                                P:{m.protein_g}g C:{m.carbs_g}g F:{m.fat_g}g
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {exercises.length > 0 && (
                      <div className="recent-detail__section">
                        <h4 className="recent-detail__section-title">
                          <Dumbbell size={14} /> Exercise
                        </h4>
                        {exercises.map((e) => (
                          <div key={e.id} className="recent-detail__item">
                            <span className="recent-detail__time mono">{e.time || '—'}</span>
                            <span className="recent-detail__desc">{e.description}</span>
                            <span className="recent-detail__macros mono">
                              {e.duration_minutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {meals.length === 0 && exercises.length === 0 && (
                      <p className="recent-detail__no-data">No entries for this day</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
