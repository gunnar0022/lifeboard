import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Utensils, Dumbbell, Smile, Zap, Trash2, Pencil, Check, X, Plus,
} from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '../../hooks/useApi';
import './RecentDetail.css';

const emptyMeal = { description: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' };
const emptyEx = { description: '', duration_minutes: '', estimated_calories: '' };

export default function RecentDetail({ days, onRefresh }) {
  const [expanded, setExpanded] = useState(days?.[0]?.date || null);
  const [busyId, setBusyId] = useState(null);

  // Inline edit state (one at a time)
  const [editMealId, setEditMealId] = useState(null);
  const [mealDraft, setMealDraft] = useState(emptyMeal);
  const [editExId, setEditExId] = useState(null);
  const [exDraft, setExDraft] = useState(emptyEx);

  // Add-new state (keyed by day date)
  const [addMealDay, setAddMealDay] = useState(null);
  const [newMeal, setNewMeal] = useState(emptyMeal);
  const [addExDay, setAddExDay] = useState(null);
  const [newEx, setNewEx] = useState(emptyEx);

  const refresh = () => onRefresh?.();

  // ── Meals ──
  const startEditMeal = (m) => {
    setEditMealId(m.id);
    setMealDraft({
      description: m.description || '',
      calories: String(m.calories ?? ''),
      protein_g: String(m.protein_g ?? ''),
      carbs_g: String(m.carbs_g ?? ''),
      fat_g: String(m.fat_g ?? ''),
    });
  };

  const saveMeal = async (id) => {
    if (!mealDraft.description.trim()) return;
    setBusyId(`meal-${id}`);
    try {
      await apiPut(`/api/health_body/meals/${id}`, {
        description: mealDraft.description.trim(),
        calories: parseInt(mealDraft.calories) || 0,
        protein_g: parseInt(mealDraft.protein_g) || 0,
        carbs_g: parseInt(mealDraft.carbs_g) || 0,
        fat_g: parseInt(mealDraft.fat_g) || 0,
      });
      setEditMealId(null);
      refresh();
    } catch (e) { console.error('Failed to edit meal:', e); }
    finally { setBusyId(null); }
  };

  const deleteMeal = async (id) => {
    setBusyId(`meal-${id}`);
    try {
      await apiDelete(`/api/health_body/meals/${id}`);
      refresh();
    } catch (e) { console.error('Failed to delete meal:', e); }
    finally { setBusyId(null); }
  };

  const addMeal = async (date) => {
    if (!newMeal.description.trim()) return;
    setBusyId(`addmeal-${date}`);
    try {
      await apiPost('/api/health_body/meals', {
        description: newMeal.description.trim(),
        calories: parseInt(newMeal.calories) || 0,
        protein_g: parseInt(newMeal.protein_g) || 0,
        carbs_g: parseInt(newMeal.carbs_g) || 0,
        fat_g: parseInt(newMeal.fat_g) || 0,
        date,
      });
      setNewMeal(emptyMeal);
      setAddMealDay(null);
      refresh();
    } catch (e) { console.error('Failed to add meal:', e); }
    finally { setBusyId(null); }
  };

  // ── Exercises ──
  const startEditEx = (ex) => {
    setEditExId(ex.id);
    setExDraft({
      description: ex.description || '',
      duration_minutes: String(ex.duration_minutes ?? ''),
      estimated_calories: String(ex.estimated_calories ?? ''),
    });
  };

  const saveEx = async (id) => {
    if (!exDraft.description.trim()) return;
    setBusyId(`ex-${id}`);
    try {
      await apiPut(`/api/health_body/exercises/${id}`, {
        description: exDraft.description.trim(),
        duration_minutes: parseInt(exDraft.duration_minutes) || 0,
        estimated_calories: parseInt(exDraft.estimated_calories) || 0,
      });
      setEditExId(null);
      refresh();
    } catch (e) { console.error('Failed to edit exercise:', e); }
    finally { setBusyId(null); }
  };

  const deleteEx = async (id) => {
    setBusyId(`ex-${id}`);
    try {
      await apiDelete(`/api/health_body/exercises/${id}`);
      refresh();
    } catch (e) { console.error('Failed to delete exercise:', e); }
    finally { setBusyId(null); }
  };

  const addEx = async (date) => {
    if (!newEx.description.trim()) return;
    setBusyId(`addex-${date}`);
    try {
      await apiPost('/api/health_body/exercises', {
        description: newEx.description.trim(),
        duration_minutes: parseInt(newEx.duration_minutes) || 0,
        estimated_calories: parseInt(newEx.estimated_calories) || 0,
        date,
      });
      setNewEx(emptyEx);
      setAddExDay(null);
      refresh();
    } catch (e) { console.error('Failed to add exercise:', e); }
    finally { setBusyId(null); }
  };

  // ── Mood / energy ──
  const setMoodEnergy = async (date, field, value) => {
    setBusyId(`me-${date}`);
    try {
      await apiPost('/api/health_body/mood-energy', { date, [field]: value });
      refresh();
    } catch (e) { console.error('Failed to set mood/energy:', e); }
    finally { setBusyId(null); }
  };

  if (!days || days.length === 0) {
    return (
      <div className="recent-detail card">
        <h3 className="recent-detail__title">Recent Activity</h3>
        <p className="recent-detail__empty">No recent data — log a meal or exercise above to get started.</p>
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
                  <span className="recent-detail__day-name">{isToday ? 'Today' : day.day_name}</span>
                  <span className="recent-detail__day-date">{day.date}</span>
                </div>
                <div className="recent-detail__day-stats">
                  <span className="recent-detail__stat">
                    <Utensils size={13} />
                    <span className="mono">{day.total_calories?.toLocaleString() || 0}</span> kcal
                  </span>
                  {day.total_exercise_minutes > 0 && (
                    <span className="recent-detail__stat"><Dumbbell size={13} />{day.total_exercise_minutes} min</span>
                  )}
                  {day.mood && <span className="recent-detail__stat"><Smile size={13} />{day.mood}/5</span>}
                  {day.energy && <span className="recent-detail__stat"><Zap size={13} />{day.energy}/5</span>}
                </div>
                <ChevronDown size={16} className={`recent-detail__chevron ${isExpanded ? 'recent-detail__chevron--open' : ''}`} />
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
                    {/* Meals */}
                    <div className="recent-detail__section">
                      <h4 className="recent-detail__section-title">
                        <Utensils size={14} /> Meals
                        <button className="recent-detail__add-link" onClick={() => { setAddMealDay(day.date); setNewMeal(emptyMeal); }}>
                          <Plus size={12} /> Add
                        </button>
                      </h4>
                      {meals.map((m) => (
                        editMealId === m.id ? (
                          <div key={m.id} className="recent-detail__edit-row">
                            <input className="recent-detail__edit-desc" value={mealDraft.description}
                              onChange={e => setMealDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description" />
                            <input className="recent-detail__edit-num" type="number" value={mealDraft.calories}
                              onChange={e => setMealDraft(d => ({ ...d, calories: e.target.value }))} placeholder="kcal" />
                            <input className="recent-detail__edit-num" type="number" value={mealDraft.protein_g}
                              onChange={e => setMealDraft(d => ({ ...d, protein_g: e.target.value }))} placeholder="P" />
                            <input className="recent-detail__edit-num" type="number" value={mealDraft.carbs_g}
                              onChange={e => setMealDraft(d => ({ ...d, carbs_g: e.target.value }))} placeholder="C" />
                            <input className="recent-detail__edit-num" type="number" value={mealDraft.fat_g}
                              onChange={e => setMealDraft(d => ({ ...d, fat_g: e.target.value }))} placeholder="F" />
                            <button className="recent-detail__icon-btn recent-detail__icon-btn--save" onClick={() => saveMeal(m.id)} disabled={busyId === `meal-${m.id}`}><Check size={13} /></button>
                            <button className="recent-detail__icon-btn" onClick={() => setEditMealId(null)}><X size={13} /></button>
                          </div>
                        ) : (
                          <div key={m.id} className="recent-detail__item">
                            <span className="recent-detail__time mono">{m.time || '—'}</span>
                            <span className="recent-detail__desc">{m.description}</span>
                            <span className="recent-detail__macros mono">
                              {m.calories} kcal
                              <span className="recent-detail__macro-detail">P:{m.protein_g}g C:{m.carbs_g}g F:{m.fat_g}g</span>
                            </span>
                            <button className="recent-detail__edit-btn" onClick={(e) => { e.stopPropagation(); startEditMeal(m); }} title="Edit meal"><Pencil size={12} /></button>
                            <button className="recent-detail__delete-btn" onClick={(e) => { e.stopPropagation(); deleteMeal(m.id); }} disabled={busyId === `meal-${m.id}`} title="Delete meal"><Trash2 size={12} /></button>
                          </div>
                        )
                      ))}
                      {addMealDay === day.date && (
                        <div className="recent-detail__edit-row recent-detail__edit-row--add">
                          <input className="recent-detail__edit-desc" value={newMeal.description} autoFocus
                            onChange={e => setNewMeal(d => ({ ...d, description: e.target.value }))} placeholder="What did you eat?" />
                          <input className="recent-detail__edit-num" type="number" value={newMeal.calories}
                            onChange={e => setNewMeal(d => ({ ...d, calories: e.target.value }))} placeholder="kcal" />
                          <input className="recent-detail__edit-num" type="number" value={newMeal.protein_g}
                            onChange={e => setNewMeal(d => ({ ...d, protein_g: e.target.value }))} placeholder="P" />
                          <input className="recent-detail__edit-num" type="number" value={newMeal.carbs_g}
                            onChange={e => setNewMeal(d => ({ ...d, carbs_g: e.target.value }))} placeholder="C" />
                          <input className="recent-detail__edit-num" type="number" value={newMeal.fat_g}
                            onChange={e => setNewMeal(d => ({ ...d, fat_g: e.target.value }))} placeholder="F" />
                          <button className="recent-detail__icon-btn recent-detail__icon-btn--save" onClick={() => addMeal(day.date)} disabled={busyId === `addmeal-${day.date}` || !newMeal.description.trim()}><Check size={13} /></button>
                          <button className="recent-detail__icon-btn" onClick={() => setAddMealDay(null)}><X size={13} /></button>
                        </div>
                      )}
                      {meals.length === 0 && addMealDay !== day.date && (
                        <p className="recent-detail__no-data">No meals logged</p>
                      )}
                    </div>

                    {/* Exercise */}
                    <div className="recent-detail__section">
                      <h4 className="recent-detail__section-title">
                        <Dumbbell size={14} /> Exercise
                        <button className="recent-detail__add-link" onClick={() => { setAddExDay(day.date); setNewEx(emptyEx); }}>
                          <Plus size={12} /> Add
                        </button>
                      </h4>
                      {exercises.map((ex) => (
                        editExId === ex.id ? (
                          <div key={ex.id} className="recent-detail__edit-row">
                            <input className="recent-detail__edit-desc" value={exDraft.description}
                              onChange={e => setExDraft(d => ({ ...d, description: e.target.value }))} placeholder="Exercise" />
                            <input className="recent-detail__edit-num" type="number" value={exDraft.duration_minutes}
                              onChange={e => setExDraft(d => ({ ...d, duration_minutes: e.target.value }))} placeholder="min" />
                            <input className="recent-detail__edit-num" type="number" value={exDraft.estimated_calories}
                              onChange={e => setExDraft(d => ({ ...d, estimated_calories: e.target.value }))} placeholder="kcal" />
                            <button className="recent-detail__icon-btn recent-detail__icon-btn--save" onClick={() => saveEx(ex.id)} disabled={busyId === `ex-${ex.id}`}><Check size={13} /></button>
                            <button className="recent-detail__icon-btn" onClick={() => setEditExId(null)}><X size={13} /></button>
                          </div>
                        ) : (
                          <div key={ex.id} className="recent-detail__item">
                            <span className="recent-detail__time mono">{ex.time || '—'}</span>
                            <span className="recent-detail__desc">{ex.description}</span>
                            <span className="recent-detail__macros mono">
                              {ex.duration_minutes} min
                              {ex.estimated_calories ? <span className="recent-detail__macro-detail">{ex.estimated_calories} kcal</span> : null}
                            </span>
                            <button className="recent-detail__edit-btn" onClick={(e) => { e.stopPropagation(); startEditEx(ex); }} title="Edit exercise"><Pencil size={12} /></button>
                            <button className="recent-detail__delete-btn" onClick={(e) => { e.stopPropagation(); deleteEx(ex.id); }} disabled={busyId === `ex-${ex.id}`} title="Delete exercise"><Trash2 size={12} /></button>
                          </div>
                        )
                      ))}
                      {addExDay === day.date && (
                        <div className="recent-detail__edit-row recent-detail__edit-row--add">
                          <input className="recent-detail__edit-desc" value={newEx.description} autoFocus
                            onChange={e => setNewEx(d => ({ ...d, description: e.target.value }))} placeholder="What exercise?" />
                          <input className="recent-detail__edit-num" type="number" value={newEx.duration_minutes}
                            onChange={e => setNewEx(d => ({ ...d, duration_minutes: e.target.value }))} placeholder="min" />
                          <input className="recent-detail__edit-num" type="number" value={newEx.estimated_calories}
                            onChange={e => setNewEx(d => ({ ...d, estimated_calories: e.target.value }))} placeholder="kcal" />
                          <button className="recent-detail__icon-btn recent-detail__icon-btn--save" onClick={() => addEx(day.date)} disabled={busyId === `addex-${day.date}` || !newEx.description.trim()}><Check size={13} /></button>
                          <button className="recent-detail__icon-btn" onClick={() => setAddExDay(null)}><X size={13} /></button>
                        </div>
                      )}
                      {exercises.length === 0 && addExDay !== day.date && (
                        <p className="recent-detail__no-data">No exercise logged</p>
                      )}
                    </div>

                    {/* Mood & energy */}
                    <div className="recent-detail__section recent-detail__section--me">
                      <div className="recent-detail__me-row">
                        <span className="recent-detail__me-label"><Smile size={13} /> Mood</span>
                        <div className="recent-detail__me-scale">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n}
                              className={`recent-detail__me-dot ${day.mood === n ? 'recent-detail__me-dot--active' : ''}`}
                              onClick={() => setMoodEnergy(day.date, 'mood', n)}
                              disabled={busyId === `me-${day.date}`}
                            >{n}</button>
                          ))}
                        </div>
                      </div>
                      <div className="recent-detail__me-row">
                        <span className="recent-detail__me-label"><Zap size={13} /> Energy</span>
                        <div className="recent-detail__me-scale">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n}
                              className={`recent-detail__me-dot ${day.energy === n ? 'recent-detail__me-dot--active' : ''}`}
                              onClick={() => setMoodEnergy(day.date, 'energy', n)}
                              disabled={busyId === `me-${day.date}`}
                            >{n}</button>
                          ))}
                        </div>
                      </div>
                    </div>
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
