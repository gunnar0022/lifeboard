import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Zap, Edit3, Trash2, Save, Sparkles, ArrowLeftRight, Pin, PinOff } from 'lucide-react';
import { classColor as resolveClassColor } from '../../dndUtils';
import { SCALING_KINDS } from '../../spellSlots';

const SAVE_OPTS = ['', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function SpellRow({
  spell, isConcentrating, className, onConcentrate, onRemove, onEditSpell, editMode,
  onCast, onMove, moveLabel, moveDisabled, isAlwaysPrepared, onToggleAlwaysPrepared,
  badge,
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const color = resolveClassColor(className);

  if (!spell) return null;

  const concBadge = !!spell.concentration;
  const isActive = isConcentrating;
  const scales = !!spell.scaling_kind || !!spell.upcast;

  const startEdit = () => { setEditForm({ ...spell }); setEditing(true); setExpanded(true); };
  const cancelEdit = () => { setEditing(false); setEditForm(null); };
  const saveEdit = () => {
    if (onEditSpell && editForm) {
      if (editForm.duration && /concentration/i.test(editForm.duration)) editForm.concentration = 1;
      onEditSpell(editForm);
    }
    setEditing(false); setEditForm(null);
  };
  const handleDeleteSpell = () => {
    fetch(`/api/dnd/spells/${spell.id}`, { method: 'DELETE' }).catch(() => {});
    if (onRemove) onRemove(spell.id);
  };

  return (
    <div className={`spell-row ${isActive ? 'spell-row--concentrating' : ''}`}
      style={isActive ? { borderColor: color, boxShadow: `0 0 8px ${color}33` } : {}}>
      <div className="spell-row__compact" onClick={() => !editing && setExpanded(!expanded)}>
        {concBadge && (
          <span className={`spell-row__conc-badge ${isActive ? 'spell-row__conc-badge--active' : ''}`}
            style={isActive ? { background: color, borderColor: color } : {}}>
            {isActive ? 'ACTIVE' : 'CONC'}
          </span>
        )}
        {badge && <span className="spell-row__source-badge">{badge}</span>}
        {isAlwaysPrepared && <Pin size={11} className="spell-row__pin" style={{ color }} />}

        <span className="spell-row__name">{spell.name}</span>

        {scales && (
          <span className="spell-row__scale-badge" title="Scales when upcast" style={{ color }}>
            <Sparkles size={11} />
          </span>
        )}

        {spell.damage && <span className="spell-row__damage">{spell.damage}</span>}
        <span className="spell-row__range">{spell.range}</span>
        {spell.casting_time && spell.casting_time !== '1 action' && (
          <span className="spell-row__tag">{spell.casting_time}</span>
        )}
        {spell.save_type && <span className="spell-row__tag">{spell.save_type} save</span>}
        {spell.ritual ? <span className="spell-row__tag spell-row__tag--ritual">Ritual</span> : null}

        <div className="spell-row__quick">
          {onCast && !editMode && (
            <button className="spell-row__cast-btn" style={{ borderColor: color, color }}
              onClick={(e) => { e.stopPropagation(); onCast(spell); }} title="Cast spell">
              <Zap size={12} /> Cast
            </button>
          )}
          <span className="spell-row__toggle">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </div>

      {expanded && !editing && (
        <div className="spell-row__details">
          <div className="spell-row__detail-grid">
            <div><strong>Casting Time:</strong> {spell.casting_time}</div>
            <div><strong>Range:</strong> {spell.range}{spell.aoe ? ` (${spell.aoe})` : ''}</div>
            <div><strong>Duration:</strong> {spell.duration}{spell.concentration ? ' (concentration)' : ''}</div>
            <div><strong>Components:</strong> {spell.components}</div>
            {spell.save_type && (
              <div><strong>Save:</strong> {spell.save_type}{spell.save_effect ? ` · ${spell.save_effect}` : ''}</div>
            )}
          </div>

          {spell.upcast && (
            <div className="spell-row__upcast"><strong>At Higher Levels:</strong> {spell.upcast}</div>
          )}

          <p className="spell-row__desc">{spell.description}</p>

          <div className="spell-row__actions">
            {onMove && (
              <button className="spell-row__move-btn" disabled={moveDisabled}
                title={moveDisabled ? 'Prepared list is full' : moveLabel}
                onClick={(e) => { e.stopPropagation(); !moveDisabled && onMove(spell.id); }}>
                <ArrowLeftRight size={12} /> {moveLabel}
              </button>
            )}
            {onToggleAlwaysPrepared && (
              <button className="spell-row__pin-btn" onClick={(e) => { e.stopPropagation(); onToggleAlwaysPrepared(spell.id); }}>
                {isAlwaysPrepared ? <><PinOff size={12} /> Unpin</> : <><Pin size={12} /> Always Prepared</>}
              </button>
            )}
            {spell.concentration && (
              <button className={`spell-row__concentrate-btn ${isActive ? 'spell-row__concentrate-btn--active' : ''}`}
                style={isActive ? { borderColor: color, color } : {}}
                onClick={(e) => { e.stopPropagation(); onConcentrate && onConcentrate(spell.id); }}>
                <Zap size={12} /> {isActive ? 'Drop Concentration' : 'Concentrate'}
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
            <label>Upcast (text)</label>
            <input className="dnd-field" value={editForm.upcast || ''} onChange={e => setEditForm({ ...editForm, upcast: e.target.value })} />
          </div>
          {/* Structured scaling — drives the computed upcast preview */}
          <div className="spell-row__edit-grid spell-row__edit-grid--scaling">
            <div className="spell-row__edit-field">
              <label>Scales by</label>
              <select className="dnd-field" value={editForm.scaling_kind || ''}
                onChange={e => setEditForm({ ...editForm, scaling_kind: e.target.value })}>
                {SCALING_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
            <div className="spell-row__edit-field">
              <label>Per slot level (e.g. 1d6, 1)</label>
              <input className="dnd-field" value={editForm.scaling_per_level || ''}
                placeholder="1d6"
                onChange={e => setEditForm({ ...editForm, scaling_per_level: e.target.value })} />
            </div>
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
