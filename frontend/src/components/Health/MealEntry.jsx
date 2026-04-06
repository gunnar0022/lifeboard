import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Plus, Check, ChevronDown, ChevronRight, X, Minus } from 'lucide-react';
import { useApi, apiPost } from '../../hooks/useApi';
import './MealEntry.css';

export default function MealEntry({ onSuccess }) {
  const { data: foods } = useApi('/api/health_body/foods');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('food'); // 'food' or 'manual'

  // Food database mode — cart of items
  const [cart, setCart] = useState([]); // [{food, servings}]

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

  const addToCart = (food) => {
    const existing = cart.find(c => c.food.id === food.id);
    if (existing) {
      setCart(cart.map(c => c.food.id === food.id ? { ...c, servings: c.servings + 1 } : c));
    } else {
      setCart([...cart, { food, servings: 1 }]);
    }
  };

  const updateServings = (foodId, servings) => {
    const val = parseFloat(servings);
    if (isNaN(val) || val <= 0) {
      setCart(cart.filter(c => c.food.id !== foodId));
    } else {
      setCart(cart.map(c => c.food.id === foodId ? { ...c, servings: val } : c));
    }
  };

  const removeFromCart = (foodId) => {
    setCart(cart.filter(c => c.food.id !== foodId));
  };

  // Calculate cart totals
  const cartTotals = cart.reduce((acc, item) => {
    const s = item.servings;
    return {
      calories: acc.calories + Math.round(item.food.calories * s),
      protein: acc.protein + Math.floor(item.food.protein_g * s),
      carbs: acc.carbs + Math.ceil(item.food.carbs_g * s),
      fat: acc.fat + Math.ceil(item.food.fat_g * s),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleFoodSubmit = async () => {
    if (cart.length === 0) return;
    const desc = cart.map(c => {
      const s = c.servings;
      return s === 1 ? c.food.name : `${s}x ${c.food.name}`;
    }).join(', ');

    await submitMeal({
      description: desc,
      calories: cartTotals.calories,
      protein_g: cartTotals.protein,
      carbs_g: cartTotals.carbs,
      fat_g: cartTotals.fat,
      date,
    });
    setCart([]);
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
                      className="meal-entry__food-item"
                      onClick={() => addToCart(f)}
                    >
                      <span className="meal-entry__food-name">{f.name}</span>
                      <span className="meal-entry__food-cal mono">{f.calories} kcal</span>
                      <Plus size={12} className="meal-entry__food-add" />
                    </button>
                  ))}
                  {foodList.length === 0 && (
                    <p className="meal-entry__no-foods">No foods in database. Add some in the Food Database section.</p>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="meal-entry__cart">
                    <div className="meal-entry__cart-label">Meal items:</div>
                    {cart.map(item => (
                      <div key={item.food.id} className="meal-entry__cart-item">
                        <span className="meal-entry__cart-name">{item.food.name}</span>
                        <div className="meal-entry__cart-controls">
                          <button onClick={() => updateServings(item.food.id, item.servings - 0.5)} className="meal-entry__cart-btn">
                            <Minus size={10} />
                          </button>
                          <input
                            type="number"
                            value={item.servings}
                            onChange={(e) => updateServings(item.food.id, e.target.value)}
                            step="0.5"
                            min="0.5"
                            className="meal-entry__cart-servings"
                          />
                          <button onClick={() => updateServings(item.food.id, item.servings + 0.5)} className="meal-entry__cart-btn">
                            <Plus size={10} />
                          </button>
                          <button onClick={() => removeFromCart(item.food.id)} className="meal-entry__cart-btn meal-entry__cart-btn--remove">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="meal-entry__cart-totals mono">
                      {cartTotals.calories} kcal · P:{cartTotals.protein}g C:{cartTotals.carbs}g F:{cartTotals.fat}g
                    </div>
                  </div>
                )}

                <button
                  className="meal-entry__submit"
                  onClick={handleFoodSubmit}
                  disabled={saving || cart.length === 0}
                >
                  {success ? <><Check size={14} /> Logged</> : <><Plus size={14} /> Log Meal ({cart.length} items)</>}
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
