import { useState, useEffect } from 'react';
import { Plus, X, Edit3, Check } from 'lucide-react';

const EMPTY_FORM = {
  name: '', cr: '0', hp: 10, ac: 10,
  speeds: { walk: 30 },
  ability_scores: { STR: 10, DEX: 10, CON: 10 },
  attacks: [],
  special_abilities: [],
  senses: '',
};

export default function BeastFormPicker({ onSelect, onCancel }) {
  const [forms, setForms] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetch('/api/dnd/beast-forms').then(r => r.json()).then(setForms).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!editForm?.name?.trim()) return;
    const res = await fetch('/api/dnd/beast-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const form = await res.json();
    setForms(prev => [...prev, form]);
    setCreating(false);
    setEditForm(null);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/dnd/beast-forms/${id}`, { method: 'DELETE' });
    setForms(prev => prev.filter(f => f.id !== id));
  };

  const startCreate = () => {
    setEditForm({ ...EMPTY_FORM });
    setCreating(true);
  };

  return (
    <div className="beast-picker">
      <div className="beast-picker__header">
        <h4>Select Beast Form</h4>
        <button className="beast-picker__close" onClick={onCancel}><X size={14} /></button>
      </div>

      <div className="beast-picker__list">
        {forms.map(form => (
          <button key={form.id} className="beast-picker__card" onClick={() => onSelect(form)}>
            <div className="beast-picker__card-header">
              <strong>{form.name}</strong>
              <span className="beast-picker__cr">CR {form.cr}</span>
            </div>
            <div className="beast-picker__card-stats">
              <span>HP {form.hp}</span>
              <span>AC {form.ac}</span>
              <span>STR {form.ability_scores?.STR}</span>
              <span>DEX {form.ability_scores?.DEX}</span>
              <span>CON {form.ability_scores?.CON}</span>
            </div>
            <span className="beast-picker__delete" onClick={e => { e.stopPropagation(); handleDelete(form.id); }}>
              <X size={10} />
            </span>
          </button>
        ))}

        {forms.length === 0 && !creating && (
          <div className="beast-picker__empty">No beast forms yet. Create one to get started.</div>
        )}
      </div>

      {creating && editForm && (
        <div className="beast-picker__create">
          <input className="dnd-field" placeholder="Beast name" value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
          <div className="beast-picker__create-row">
            <label>CR <input className="dnd-field dnd-field--sm" value={editForm.cr}
              onChange={e => setEditForm({ ...editForm, cr: e.target.value })} /></label>
            <label>HP <input type="number" className="dnd-field dnd-field--sm" value={editForm.hp}
              onChange={e => setEditForm({ ...editForm, hp: parseInt(e.target.value) || 1 })} /></label>
            <label>AC <input type="number" className="dnd-field dnd-field--sm" value={editForm.ac}
              onChange={e => setEditForm({ ...editForm, ac: parseInt(e.target.value) || 10 })} /></label>
          </div>
          <div className="beast-picker__create-row">
            <label>STR <input type="number" className="dnd-field dnd-field--sm" value={editForm.ability_scores.STR}
              onChange={e => setEditForm({ ...editForm, ability_scores: { ...editForm.ability_scores, STR: parseInt(e.target.value) || 10 } })} /></label>
            <label>DEX <input type="number" className="dnd-field dnd-field--sm" value={editForm.ability_scores.DEX}
              onChange={e => setEditForm({ ...editForm, ability_scores: { ...editForm.ability_scores, DEX: parseInt(e.target.value) || 10 } })} /></label>
            <label>CON <input type="number" className="dnd-field dnd-field--sm" value={editForm.ability_scores.CON}
              onChange={e => setEditForm({ ...editForm, ability_scores: { ...editForm.ability_scores, CON: parseInt(e.target.value) || 10 } })} /></label>
          </div>
          <div className="beast-picker__create-row">
            <label>Walk <input type="number" className="dnd-field dnd-field--sm" value={editForm.speeds.walk || ''}
              onChange={e => setEditForm({ ...editForm, speeds: { ...editForm.speeds, walk: parseInt(e.target.value) || 0 } })} /></label>
            <label>Swim <input type="number" className="dnd-field dnd-field--sm" value={editForm.speeds.swim || ''}
              onChange={e => setEditForm({ ...editForm, speeds: { ...editForm.speeds, swim: parseInt(e.target.value) || 0 } })} /></label>
            <label>Fly <input type="number" className="dnd-field dnd-field--sm" value={editForm.speeds.fly || ''}
              onChange={e => setEditForm({ ...editForm, speeds: { ...editForm.speeds, fly: parseInt(e.target.value) || 0 } })} /></label>
          </div>
          <input className="dnd-field" placeholder="Senses (e.g., Darkvision 60 ft.)" value={editForm.senses || ''}
            onChange={e => setEditForm({ ...editForm, senses: e.target.value })} />
          <div className="beast-picker__create-actions">
            <button className="dnd-add-btn" onClick={() => { setCreating(false); setEditForm(null); }}>Cancel</button>
            <button className="beast-picker__save" onClick={handleCreate} disabled={!editForm.name.trim()}>
              <Check size={12} /> Create
            </button>
          </div>
        </div>
      )}

      {!creating && (
        <button className="dnd-add-btn" onClick={startCreate} style={{ marginTop: '0.5rem' }}>
          <Plus size={12} /> New Beast Form
        </button>
      )}
    </div>
  );
}
