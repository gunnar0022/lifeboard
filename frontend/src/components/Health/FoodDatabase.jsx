import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useApi, apiPost, apiPut, apiDelete } from '../../hooks/useApi';
import './FoodDatabase.css';

const blankEdit = { name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' };

export default function FoodDatabase() {
  const { data: foods, refetch } = useApi('/api/health_body/foods');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState(blankEdit);
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (f) => {
    setEditId(f.id);
    setEditDraft({
      name: f.name, calories: String(f.calories ?? ''),
      protein_g: String(f.protein_g ?? ''), carbs_g: String(f.carbs_g ?? ''), fat_g: String(f.fat_g ?? ''),
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editDraft.name.trim()) return;
    setSavingEdit(true);
    try {
      await apiPut(`/api/health_body/foods/${id}`, {
        name: editDraft.name.trim(),
        calories: parseInt(editDraft.calories) || 0,
        protein_g: parseInt(editDraft.protein_g) || 0,
        carbs_g: parseInt(editDraft.carbs_g) || 0,
        fat_g: parseInt(editDraft.fat_g) || 0,
      });
      setEditId(null);
      refetch();
    } catch (err) {
      console.error('Failed to edit food:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !calories) return;
    setAdding(true);
    try {
      await apiPost('/api/health_body/foods', {
        name: name.trim(),
        calories: parseInt(calories) || 0,
        protein_g: parseInt(protein) || 0,
        carbs_g: parseInt(carbs) || 0,
        fat_g: parseInt(fat) || 0,
      });
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      refetch();
    } catch (err) {
      console.error('Failed to add food:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await apiDelete(`/api/health_body/foods/${id}`);
      refetch();
    } catch (err) {
      console.error('Failed to delete food:', err);
    } finally {
      setDeleting(null);
    }
  };

  const count = foods?.length || 0;

  return (
    <div className="food-db card">
      <button className="food-db__toggle" onClick={() => setOpen(!open)}>
        <Apple size={16} />
        <span className="chart-title" style={{ margin: 0 }}>Food Database</span>
        {count > 0 && <span className="food-db__count">{count}</span>}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="food-db__content"
          >
            <form className="food-db__add-form" onSubmit={handleAdd}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Food name"
                className="food-db__input food-db__input--name"
                disabled={adding}
              />
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="kcal"
                className="food-db__input food-db__input--num"
                disabled={adding}
              />
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="P (g)"
                className="food-db__input food-db__input--num"
                disabled={adding}
              />
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="C (g)"
                className="food-db__input food-db__input--num"
                disabled={adding}
              />
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="F (g)"
                className="food-db__input food-db__input--num"
                disabled={adding}
              />
              <button type="submit" className="food-db__add-btn" disabled={adding || !name.trim() || !calories}>
                <Plus size={14} />
              </button>
            </form>

            {foods && foods.length > 0 && (
              <div className="food-db__list">
                {foods.map(f => (
                  editId === f.id ? (
                    <div key={f.id} className="food-db__item food-db__item--editing">
                      <input
                        className="food-db__input food-db__input--name"
                        value={editDraft.name}
                        onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                        placeholder="Food name"
                      />
                      <input className="food-db__input food-db__input--num" type="number" value={editDraft.calories}
                        onChange={e => setEditDraft(d => ({ ...d, calories: e.target.value }))} placeholder="kcal" />
                      <input className="food-db__input food-db__input--num" type="number" value={editDraft.protein_g}
                        onChange={e => setEditDraft(d => ({ ...d, protein_g: e.target.value }))} placeholder="P" />
                      <input className="food-db__input food-db__input--num" type="number" value={editDraft.carbs_g}
                        onChange={e => setEditDraft(d => ({ ...d, carbs_g: e.target.value }))} placeholder="C" />
                      <input className="food-db__input food-db__input--num" type="number" value={editDraft.fat_g}
                        onChange={e => setEditDraft(d => ({ ...d, fat_g: e.target.value }))} placeholder="F" />
                      <button className="food-db__icon-btn food-db__icon-btn--save" onClick={() => handleSaveEdit(f.id)} disabled={savingEdit || !editDraft.name.trim()} title="Save">
                        <Check size={13} />
                      </button>
                      <button className="food-db__icon-btn" onClick={() => setEditId(null)} disabled={savingEdit} title="Cancel">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div key={f.id} className="food-db__item">
                      <span className="food-db__item-name">{f.name}</span>
                      <span className="food-db__item-macros mono">
                        {f.calories} kcal · P:{f.protein_g}g C:{f.carbs_g}g F:{f.fat_g}g
                      </span>
                      <button
                        className="food-db__edit-btn"
                        onClick={() => startEdit(f)}
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="food-db__delete-btn"
                        onClick={() => handleDelete(f.id)}
                        disabled={deleting === f.id}
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                ))}
              </div>
            )}

            {(!foods || foods.length === 0) && (
              <p className="food-db__empty">No saved foods yet. Add items above or via Telegram.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
