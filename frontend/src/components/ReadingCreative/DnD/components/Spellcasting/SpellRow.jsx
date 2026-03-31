import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Zap, Edit3, Trash2, Save } from 'lucide-react';
import { CLASS_COLORS } from '../../dndUtils';

const SPELL_TYPES = ['damage', 'healing', 'buff', 'debuff', 'utility', 'control'];
const SAVE_OPTS = ['', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function SpellRow({ spell, isConcentrating, className, onConcentrate, onRemove, onEditSpell, editMode, dragHandleProps }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const classColor = CLASS_COLORS[className] || 'var(--dnd-accent)';

  if (!spell) return null;

  const concBadge = !!spell.concentration;
  const isActive = isConcentrating;

  const startEdit = () => {
    setEditForm({ ...spell });
    setEditing(true);
    setExpanded(true);
  };

  const saveEdit = () => {
    if (onEditSpell && editForm) {
      // Auto-flag concentration if duration contains the word
      if (editForm.duration && /concentration/i.test(editForm.duration)) {
        editForm.concentration = 1;
      }
      onEditSpell(editForm);
    }
    setEditing(false);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
  };

  const handleDeleteSpell = () => {
    if (onEditSpell) {
      // Delete from library
      fetch(`/api/dnd/spells/${spell.id}`, { method: 'DELETE' }).catch(() => {});
      if (onRemove) onRemove(spell.id);
    }
  };

  return (
    <div className={`spell-row ${isActive ? 'spell-row--concentrating' : ''}`}
      style={isActive ? { borderColor: classColor, boxShadow: `0 0 8px ${classColor}33` } : {}}>
      <div className="spell-row__compact" onClick={() => !editing && setExpanded(!expanded)}>
        {dragHandleProps && (
          <span className="spell-row__drag" {...dragHandleProps} onClick={e => e.stopPropagation()}>&#x2261;</span>
        )}

        {concBadge && (
          <span className={`spell-row__conc-badge ${isActive ? 'spell-row__conc-badge--active' : ''}`}
            style={isActive ? { background: classColor, borderColor: classColor } : {}}>
            {isActive ? 'ACTIVE' : 'CONC'}
          </span>
        )}

        <span className="spell-row__name">{spell.name}</span>

        {spell.damage && (
          <span className="spell-row__damage">{spell.damage}</span>
        )}

        <span className="spell-row__range">{spell.range}</span>

        {spell.casting_time && spell.casting_time !== '1 action' && (
          <span className="spell-row__tag">{spell.casting_time}</span>
        )}

        {spell.save_type && (
          <span className="spell-row__tag">{spell.save_type} save</span>
        )}

        {spell.ritual ? <span className="spell-row__tag spell-row__tag--ritual">Ritual</span> : null}

        <span className="spell-row__toggle">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {expanded && !editing && (
        <div className="spell-row__details">
          <div className="spell-row__detail-grid">
            <div><strong>Casting Time:</strong> {spell.casting_time}</div>
            <div><strong>Range:</strong> {spell.range}{spell.aoe ? ` (${spell.aoe})` : ''}</div>
            <div><strong>Duration:</strong> {spell.duration}{spell.concentration ? ' (concentration)' : ''}</div>
            <div><strong>Components:</strong> {spell.components}</div>
            {spell.save_type && (
              <div><strong>Save:</strong> {spell.save_type}{spell.save_effect ? ` \u00B7 ${spell.save_effect}` : ''}</div>
            )}
          </div>

          {spell.upcast && (
            <div className="spell-row__upcast">
              <strong>At Higher Levels:</strong> {spell.upcast}
            </div>
          )}

          <p className="spell-row__desc">{spell.description}</p>

          <div className="spell-row__actions">
            {spell.concentration && (
              <button
                className={`spell-row__concentrate-btn ${isActive ? 'spell-row__concentrate-btn--active' : ''}`}
                style={isActive ? { borderColor: classColor, color: classColor } : {}}
                onClick={(e) => { e.stopPropagation(); onConcentrate && onConcentrate(spell.id); }}
              >
                <Zap size={12} />
                {isActive ? 'Drop Concentration' : 'Concentrate'}
              </button>
            )}
            <button className="spell-row__edit-btn" onClick={(e) => { e.stopPropagation(); startEdit(); }}>
              <Edit3 size={12} /> Edit
            </button>
            <button className="spell-row__remove-btn" onClick={(e) => { e.stopPropagation(); onRemove && onRemove(spell.id); }}>
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      )}

      {expanded && editing && editForm && (
        <div className="spell-row__edit-form">
          <div className="spell-row__edit-grid">
            <div className="spell-row__edit-field">
              <label>Name</label>
              <input className="dnd-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="spell-row__edit-field">
              <label>Level</label>
              <input type="number" className="dnd-field dnd-field--sm" min={0} max={9} value={editForm.level}
                onChange={e => setEditForm({ ...editForm, level: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="spell-row__edit-field">
              <label>Casting Time</label>
              <input className="dnd-field" value={editForm.casting_time || ''} onChange={e => setEditForm({ ...editForm, casting_time: e.target.value })} />
            </div>
            <div className="spell-row__edit-field">
              <label>Range</label>
              <input className="dnd-field" value={editForm.range || ''} onChange={e => setEditForm({ ...editForm, range: e.target.value })} />
            </div>
            <div className="spell-row__edit-field">
              <label>AOE</label>
              <input className="dnd-field" value={editForm.aoe || ''} onChange={e => setEditForm({ ...editForm, aoe: e.target.value })} />
            </div>
            <div className="spell-row__edit-field">
              <label>Duration</label>
              <input className="dnd-field" value={editForm.duration || ''} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} />
            </div>
            <div className="spell-row__edit-field">
              <label>Damage</label>
              <input className="dnd-field" value={editForm.damage || ''} onChange={e => setEditForm({ ...editForm, damage: e.target.value })} />
            </div>
            <div className="spell-row__edit-field">
              <label>Save</label>
              <select className="dnd-field" value={editForm.save_type || ''} onChange={e => setEditForm({ ...editForm, save_type: e.target.value })}>
                {SAVE_OPTS.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
              </select>
            </div>
            <div className="spell-row__edit-field">
              <label>Components</label>
              <input className="dnd-field" value={editForm.components || ''} onChange={e => setEditForm({ ...editForm, components: e.target.value })} />
            </div>
          </div>
          <div className="spell-row__edit-field" style={{ marginTop: '0.35rem' }}>
            <label>Description</label>
            <textarea className="dnd-field dnd-field--textarea" rows={2} value={editForm.description || ''}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div className="spell-row__edit-field">
            <label>Upcast</label>
            <input className="dnd-field" value={editForm.upcast || ''} onChange={e => setEditForm({ ...editForm, upcast: e.target.value })} />
          </div>
          <div className="spell-row__edit-row-actions">
            <label className="spell-row__edit-check">
              <input type="checkbox" checked={!!editForm.concentration} onChange={e => setEditForm({ ...editForm, concentration: e.target.checked ? 1 : 0 })} /> Concentration
            </label>
            <label className="spell-row__edit-check">
              <input type="checkbox" checked={!!editForm.ritual} onChange={e => setEditForm({ ...editForm, ritual: e.target.checked ? 1 : 0 })} /> Ritual
            </label>
            <div style={{ flex: 1 }} />
            <button className="spell-row__delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSpell(); }}>
              <Trash2 size={12} /> Delete Spell
            </button>
            <button className="spell-row__cancel-btn" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}>Cancel</button>
            <button className="spell-row__save-btn" onClick={(e) => { e.stopPropagation(); saveEdit(); }}>
              <Save size={12} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
