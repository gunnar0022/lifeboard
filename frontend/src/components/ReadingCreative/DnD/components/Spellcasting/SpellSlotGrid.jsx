import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { CLASS_COLORS } from '../../dndUtils';

const LEVEL_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const RECHARGE_OPTIONS = ['Long Rest', 'Short Rest', 'Dawn', 'Custom'];

export default function SpellSlotGrid({ slots, specialSlots, className, editMode, onUpdate, onUpdateSpecial }) {
  const classColor = CLASS_COLORS[className] || 'var(--dnd-accent)';
  const [addingType, setAddingType] = useState(null); // null | 'standard' | 'special'
  const [newSpecial, setNewSpecial] = useState({ source_label: '', charges: 1, recharge_condition: 'Long Rest', spell_name: '' });

  const togglePip = (lvl, pipIndex) => {
    const slot = slots[lvl];
    const isAvailable = pipIndex >= slot.expended;
    if (isAvailable) {
      onUpdate({ [lvl]: { ...slot, expended: pipIndex + 1 } });
    } else {
      onUpdate({ [lvl]: { ...slot, expended: pipIndex } });
    }
  };

  const adjustMax = (lvl, delta) => {
    const slot = slots[lvl];
    const newMax = Math.max(0, (slot.max || 0) + delta);
    onUpdate({ [lvl]: { ...slot, max: newMax, expended: Math.min(slot.expended, newMax) } });
  };

  const removeLevel = (lvl) => {
    onUpdate({ [lvl]: { max: 0, expended: 0 } });
  };

  const addLevel = () => {
    for (let i = 1; i <= 9; i++) {
      const k = String(i);
      if (!slots[k] || slots[k].max === 0) {
        onUpdate({ [k]: { max: 1, expended: 0 } });
        return;
      }
    }
  };

  const handleAddSpecial = () => {
    if (!newSpecial.source_label.trim()) return;
    const updated = [...(specialSlots || []), {
      source_label: newSpecial.source_label.trim(),
      charges: newSpecial.charges,
      charges_used: 0,
      recharge_condition: newSpecial.recharge_condition,
      spell_name: newSpecial.spell_name.trim() || null,
    }];
    onUpdateSpecial(updated);
    setNewSpecial({ source_label: '', charges: 1, recharge_condition: 'Long Rest', spell_name: '' });
    setAddingType(null);
  };

  const toggleSpecialPip = (idx, pipIdx) => {
    const updated = [...(specialSlots || [])];
    const s = { ...updated[idx] };
    const isAvailable = pipIdx >= s.charges_used;
    s.charges_used = isAvailable ? pipIdx + 1 : pipIdx;
    updated[idx] = s;
    onUpdateSpecial(updated);
  };

  const removeSpecial = (idx) => {
    onUpdateSpecial((specialSlots || []).filter((_, i) => i !== idx));
  };

  const levels = Object.entries(slots || {})
    .filter(([, s]) => s.max > 0)
    .sort(([a], [b]) => Number(a) - Number(b));

  const specials = specialSlots || [];

  if (levels.length === 0 && specials.length === 0 && !editMode) return null;

  return (
    <div className="spell-slots">
      <div className="spell-slots__two-col">
        {/* Left: Standard slots */}
        <div className="spell-slots__standard">
          <h3 className="dnd-section-title">Spell Slots</h3>
          <div className="spell-slots__grid">
            {levels.map(([lvl, slot]) => (
              <div key={lvl} className="spell-slots__row">
                <span className="spell-slots__label">{LEVEL_LABELS[Number(lvl)] || `${lvl}th`}</span>
                <div className="spell-slots__pips">
                  {Array.from({ length: slot.max }, (_, i) => {
                    const isAvailable = i >= slot.expended;
                    return (
                      <button key={i}
                        className={`spell-slots__pip ${isAvailable ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                        style={isAvailable ? { background: classColor, borderColor: classColor } : {}}
                        onClick={() => togglePip(lvl, i)}
                        title={isAvailable ? 'Expend slot' : 'Recover slot'}
                      />
                    );
                  })}
                </div>
                {editMode && (
                  <div className="spell-slots__edit">
                    <button className="spell-slots__adj" onClick={() => adjustMax(lvl, -1)}>-</button>
                    <button className="spell-slots__adj" onClick={() => adjustMax(lvl, 1)}>+</button>
                    <button className="spell-slots__adj spell-slots__adj--remove" onClick={() => removeLevel(lvl)} title="Remove level">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Special / racial slots */}
        {(specials.length > 0 || editMode) && (
          <div className="spell-slots__special">
            <h3 className="dnd-section-title">Special Sources</h3>
            {specials.map((s, idx) => (
              <div key={idx} className="spell-slots__special-row">
                <div className="spell-slots__special-info">
                  <span className="spell-slots__special-label">{s.source_label}</span>
                  {s.spell_name && <span className="spell-slots__special-spell">{s.spell_name}</span>}
                  <span className="spell-slots__special-recharge">{s.recharge_condition}</span>
                </div>
                <div className="spell-slots__pips">
                  {Array.from({ length: s.charges }, (_, i) => {
                    const isAvailable = i >= (s.charges_used || 0);
                    return (
                      <button key={i}
                        className={`spell-slots__pip ${isAvailable ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                        style={isAvailable ? { background: 'var(--dnd-accent)', borderColor: 'var(--dnd-accent)' } : {}}
                        onClick={() => toggleSpecialPip(idx, i)}
                      />
                    );
                  })}
                </div>
                {editMode && (
                  <button className="spell-slots__adj spell-slots__adj--remove" onClick={() => removeSpecial(idx)}>
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add buttons */}
      {editMode && (
        <div className="spell-slots__add-row">
          {addingType === null && (
            <>
              <button className="dnd-add-btn" onClick={addLevel}><Plus size={12} /> Slot Level</button>
              <button className="dnd-add-btn" onClick={() => setAddingType('special')}><Plus size={12} /> Special Source</button>
            </>
          )}
          {addingType === 'special' && (
            <div className="spell-slots__add-special">
              <input className="dnd-field" value={newSpecial.source_label} placeholder="Source (e.g., Drow Magic)"
                onChange={e => setNewSpecial({ ...newSpecial, source_label: e.target.value })} />
              <input className="dnd-field" value={newSpecial.spell_name} placeholder="Spell name (optional)"
                onChange={e => setNewSpecial({ ...newSpecial, spell_name: e.target.value })} />
              <div className="spell-slots__add-special-row">
                <label>Charges: <input type="number" className="dnd-field dnd-field--sm" min={1} value={newSpecial.charges}
                  onChange={e => setNewSpecial({ ...newSpecial, charges: parseInt(e.target.value) || 1 })} /></label>
                <select className="dnd-field" value={newSpecial.recharge_condition}
                  onChange={e => setNewSpecial({ ...newSpecial, recharge_condition: e.target.value })}>
                  {RECHARGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="spell-slots__add-special-row">
                <button className="dnd-add-btn" onClick={handleAddSpecial}>Add</button>
                <button className="dnd-add-btn" onClick={() => setAddingType(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
