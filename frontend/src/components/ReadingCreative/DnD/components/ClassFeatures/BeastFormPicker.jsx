import { useState, useEffect } from 'react';
import { Plus, X, Edit3, Check, Trash2 } from 'lucide-react';

const EMPTY_FORM = {
  name: '', cr: '0', hp: 10, ac: 10,
  speeds: { walk: 30 },
  ability_scores: { STR: 10, DEX: 10, CON: 10 },
  attacks: [],
  special_abilities: [],
  senses: '',
};

const EMPTY_ATTACK = { name: '', toHit: '', damage: '', reach: '', attackRange: 'melee', notes: '' };

function BeastFormEditor({ form, onSave, onCancel, saveLabel }) {
  const [data, setData] = useState({ ...EMPTY_FORM, ...form });

  const updateAttack = (idx, field, value) => {
    const atks = [...data.attacks];
    atks[idx] = { ...atks[idx], [field]: value };
    setData({ ...data, attacks: atks });
  };

  const addAttack = () => setData({ ...data, attacks: [...data.attacks, { ...EMPTY_ATTACK }] });
  const removeAttack = (idx) => setData({ ...data, attacks: data.attacks.filter((_, i) => i !== idx) });

  const addAbility = () => setData({ ...data, special_abilities: [...data.special_abilities, ''] });
  const updateAbility = (idx, value) => {
    const abs = [...data.special_abilities];
    abs[idx] = value;
    setData({ ...data, special_abilities: abs });
  };
  const removeAbility = (idx) => setData({ ...data, special_abilities: data.special_abilities.filter((_, i) => i !== idx) });

  return (
    <div className="beast-picker__create">
      <input className="dnd-field" placeholder="Beast name" value={data.name}
        onChange={e => setData({ ...data, name: e.target.value })} autoFocus />
      <div className="beast-picker__create-row">
        <label>CR <input className="dnd-field dnd-field--sm" value={data.cr}
          onChange={e => setData({ ...data, cr: e.target.value })} /></label>
        <label>HP <input type="number" className="dnd-field dnd-field--sm" value={data.hp}
          onChange={e => setData({ ...data, hp: parseInt(e.target.value) || 1 })} /></label>
        <label>AC <input type="number" className="dnd-field dnd-field--sm" value={data.ac}
          onChange={e => setData({ ...data, ac: parseInt(e.target.value) || 10 })} /></label>
      </div>
      <div className="beast-picker__create-row">
        <label>STR <input type="number" className="dnd-field dnd-field--sm" value={data.ability_scores.STR}
          onChange={e => setData({ ...data, ability_scores: { ...data.ability_scores, STR: parseInt(e.target.value) || 10 } })} /></label>
        <label>DEX <input type="number" className="dnd-field dnd-field--sm" value={data.ability_scores.DEX}
          onChange={e => setData({ ...data, ability_scores: { ...data.ability_scores, DEX: parseInt(e.target.value) || 10 } })} /></label>
        <label>CON <input type="number" className="dnd-field dnd-field--sm" value={data.ability_scores.CON}
          onChange={e => setData({ ...data, ability_scores: { ...data.ability_scores, CON: parseInt(e.target.value) || 10 } })} /></label>
      </div>
      <div className="beast-picker__create-row">
        <label>Walk <input type="number" className="dnd-field dnd-field--sm" value={data.speeds.walk || ''}
          onChange={e => setData({ ...data, speeds: { ...data.speeds, walk: parseInt(e.target.value) || 0 } })} /></label>
        <label>Swim <input type="number" className="dnd-field dnd-field--sm" value={data.speeds.swim || ''}
          onChange={e => setData({ ...data, speeds: { ...data.speeds, swim: parseInt(e.target.value) || 0 } })} /></label>
        <label>Fly <input type="number" className="dnd-field dnd-field--sm" value={data.speeds.fly || ''}
          onChange={e => setData({ ...data, speeds: { ...data.speeds, fly: parseInt(e.target.value) || 0 } })} /></label>
      </div>
      <input className="dnd-field" placeholder="Senses (e.g., Darkvision 60 ft.)" value={data.senses || ''}
        onChange={e => setData({ ...data, senses: e.target.value })} />

      {/* Attacks */}
      <div className="beast-picker__section-label">Attacks</div>
      {data.attacks.map((atk, i) => (
        <div key={i} className="beast-picker__attack">
          <div className="beast-picker__create-row">
            <input className="dnd-field" placeholder="Name" value={atk.name}
              onChange={e => updateAttack(i, 'name', e.target.value)} />
            <select className="dnd-field" style={{ width: 80 }} value={atk.attackRange || 'melee'}
              onChange={e => updateAttack(i, 'attackRange', e.target.value)}>
              <option value="melee">Melee</option>
              <option value="ranged">Ranged</option>
            </select>
            <button className="beast-picker__atk-remove" onClick={() => removeAttack(i)}><X size={10} /></button>
          </div>
          <div className="beast-picker__create-row">
            <input className="dnd-field dnd-field--sm" placeholder="+Hit" value={atk.toHit}
              onChange={e => updateAttack(i, 'toHit', e.target.value)} />
            <input className="dnd-field" placeholder="Damage (e.g., 1d6+3 piercing)" value={atk.damage}
              onChange={e => updateAttack(i, 'damage', e.target.value)} />
            <input className="dnd-field dnd-field--sm" placeholder="Reach" value={atk.reach || ''}
              onChange={e => updateAttack(i, 'reach', e.target.value)} />
          </div>
          <input className="dnd-field" placeholder="Notes (e.g., grapple DC 11 on hit)" value={atk.notes || ''}
            onChange={e => updateAttack(i, 'notes', e.target.value)} />
        </div>
      ))}
      <button className="dnd-add-btn" onClick={addAttack} style={{ fontSize: '0.7rem' }}>
        <Plus size={10} /> Add Attack
      </button>

      {/* Special Abilities */}
      <div className="beast-picker__section-label">Special Abilities</div>
      {data.special_abilities.map((ab, i) => (
        <div key={i} className="beast-picker__create-row">
          <input className="dnd-field" placeholder="Ability description" value={ab}
            onChange={e => updateAbility(i, e.target.value)} />
          <button className="beast-picker__atk-remove" onClick={() => removeAbility(i)}><X size={10} /></button>
        </div>
      ))}
      <button className="dnd-add-btn" onClick={addAbility} style={{ fontSize: '0.7rem' }}>
        <Plus size={10} /> Add Ability
      </button>

      <div className="beast-picker__create-actions">
        <button className="dnd-add-btn" onClick={onCancel}>Cancel</button>
        <button className="beast-picker__save" onClick={() => onSave(data)} disabled={!data.name.trim()}>
          <Check size={12} /> {saveLabel || 'Create'}
        </button>
      </div>
    </div>
  );
}

export default function BeastFormPicker({ onSelect, onCancel }) {
  const [forms, setForms] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch('/api/dnd/beast-forms').then(r => r.json()).then(setForms).catch(() => {});
  }, []);

  const handleCreate = async (data) => {
    const res = await fetch('/api/dnd/beast-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const form = await res.json();
    setForms(prev => [...prev, form]);
    setCreating(false);
  };

  const handleUpdate = async (data) => {
    const res = await fetch(`/api/dnd/beast-forms/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setForms(prev => prev.map(f => f.id === editingId ? updated : f));
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/dnd/beast-forms/${id}`, { method: 'DELETE' });
    setForms(prev => prev.filter(f => f.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="beast-picker">
      <div className="beast-picker__header">
        <h4>Select Beast Form</h4>
        <button className="beast-picker__close" onClick={onCancel}><X size={14} /></button>
      </div>

      <div className="beast-picker__list">
        {forms.map(form => (
          editingId === form.id ? (
            <BeastFormEditor key={form.id} form={form} saveLabel="Save"
              onSave={handleUpdate} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={form.id} className="beast-picker__card-wrapper">
              <button className="beast-picker__card" onClick={() => onSelect(form)}>
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
                {(form.attacks || []).length > 0 && (
                  <div className="beast-picker__card-attacks">
                    {form.attacks.map((a, i) => (
                      <span key={i} className="beast-picker__card-atk">
                        {a.name} ({a.attackRange === 'ranged' ? 'R' : 'M'})
                      </span>
                    ))}
                  </div>
                )}
              </button>
              <div className="beast-picker__card-actions">
                <button onClick={() => setEditingId(form.id)} title="Edit"><Edit3 size={11} /></button>
                <button onClick={() => handleDelete(form.id)} title="Delete"><Trash2 size={11} /></button>
              </div>
            </div>
          )
        ))}

        {forms.length === 0 && !creating && (
          <div className="beast-picker__empty">No beast forms yet. Create one to get started.</div>
        )}
      </div>

      {creating ? (
        <BeastFormEditor form={EMPTY_FORM} saveLabel="Create"
          onSave={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <button className="dnd-add-btn" onClick={() => setCreating(true)} style={{ marginTop: '0.5rem' }}>
          <Plus size={12} /> New Beast Form
        </button>
      )}
    </div>
  );
}
