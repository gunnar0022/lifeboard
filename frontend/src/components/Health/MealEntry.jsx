import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Plus, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useApi, apiPost } from '../../hooks/useApi';
import './MealEntry.css';

export default function MealEntry({ onSuccess }) {
  const { data: foods } = useApi('/api/health_body/foods');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('food'); // 'food' or 'manual'

  // Food database mode
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState('1');

  // Manual mode
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Shared
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFoodSubmit = async () => {
    if (!selectedFood || !servings) return;
    const s = parseFloat(servings) || 1;
    const meal = {
      description: s === 1 ? selectedFood.name : `${s}x ${selectedFood.name}`,
      calories: Math.round(selectedFood.calories * s),
      protein_g: Math.floor(selectedFood.protein_g * s),   // round down
      carbs_g: Math.ceil(selectedFood.carbs_g * s),         // round up
      fat_g: Math.ceil(selectedFood.fat_g * s),             // round up
      date,
    };
    await submitMeal(meal);
  };

  const handleManualSubmit = async () => {
    if (!description.trim() || !calories) return;
    await submitMeal({
      description: description.trim(),
      calories: parseInt(calories) || 0,
      protein_g: parseInt(protein) || 0,
      carbs_g: parseInt(carbs) || 0,
      fat_g: parseInt(fat) || 0,
      date,
    });
  };

  const submitMeal = async (meal) => {
    setSaving(true);
    try {
      await apiPost('/api/health_body/meals', meal);
      // Reset
      setSelectedFood(null);
      setServings('1');
      setDescription('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      onSuccess?.();
    } catch (e) {
      console.error('Failed to log meal:', e);
    } finally {
      setSaving(false);
    }
  };

  const foodList = foods || [];

  // Preview calculated macros for food mode
  const s = parseFloat(servings) || 0;
  const preview = selectedFood ? {
    calories: Math.round(selectedFood.calories * s),
    protein: Math.floor(selectedFood.protein_g * s),
    carbs: Math.ceil(selectedFood.carbs_g * s),
    fat: Math.ceil(selectedFood.fat_g * s),
  } : null;

  return (
    <div className="meal-entry card">
      <button className="meal-entry__toggle" onClick={() => setOpen(!open)}>
        <Utensils size={16} />
        <span className="chart-title" style={{ margin: 0 }}>Log Meal</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="meal-entry__content"
          >
            <div className="meal-entry__mode-tabs">
              <button
                className={`meal-entry__mode-tab ${mode === 'food' ? 'meal-entry__mode-tab--active' : ''}`}
                onClick={() => setMode('food')}
              >
                From Database
              </button>
              <button
                className={`meal-entry__mode-tab ${mode === 'manual' ? 'meal-entry__mode-tab--active' : ''}`}
                onClick={() => setMode('manual')}
              >
                Manual Entry
              </button>
            </div>

            <div className="meal-entry__date-row">
              <label className="meal-entry__date-label">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="meal-entry__date-input"
              />
            </div>

            {mode === 'food' && (
              <div className="meal-entry__food-mode">
                <div className="meal-entry__food-list">
                  {foodList.map(f => (
                    <button
                      key={f.id}
                      className={`meal-entry__food-item ${selectedFood?.id === f.id ? 'meal-entry__food-item--selected' : ''}`}
                      onClick={() => setSelectedFood(f)}
                    >
                      <span className="meal-entry__food-name">{f.name}</span>
                      <span className="meal-entry__food-cal mono">{f.calories} kcal</span>
                    </button>
                  ))}
                  {foodList.length === 0 && (
                    <p className="meal-entry__no-foods">No foods in database. Add some in the Food Database section.</p>
                  )}
                </div>

                {selectedFood && (
                  <div className="meal-entry__serving-row">
                    <label>Servings:</label>
                    <input
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      step="0.5"
                      min="0.5"
                      className="meal-entry__serving-input"
                    />
                    {preview && (
                      <span className="meal-entry__preview mono">
                        {preview.calories} kcal · P:{preview.protein}g C:{preview.carbs}g F:{preview.fat}g
                      </span>
                    )}
                  </div>
                )}

                <button
                  className="meal-entry__submit"
                  onClick={handleFoodSubmit}
                  disabled={saving || !selectedFood}
                >
                  {success ? <><Check size={14} /> Logged</> : <><Plus size={14} /> Log Meal</>}
                </button>
              </div>
            )}

            {mode === 'manual' && (
              <div className="meal-entry__manual-mode">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you eat?"
                  className="meal-entry__manual-desc"
                />
                <div className="meal-entry__manual-macros">
                  <div className="meal-entry__macro-field">
                    <label>Calories</label>
                    <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="kcal" />
                  </div>
                  <div className="meal-entry__macro-field">
                    <label>Protein</label>
                    <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="g" />
                  </div>
                  <div className="meal-entry__macro-field">
                    <label>Carbs</label>
                    <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="g" />
                  </div>
                  <div className="meal-entry__macro-field">
                    <label>Fat</label>
                    <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="g" />
                  </div>
                </div>

                <button
                  className="meal-entry__submit"
                  onClick={handleManualSubmit}
                  disabled={saving || !description.trim() || !calories}
                >
                  {success ? <><Check size={14} /> Logged</> : <><Plus size={14} /> Log Meal</>}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
