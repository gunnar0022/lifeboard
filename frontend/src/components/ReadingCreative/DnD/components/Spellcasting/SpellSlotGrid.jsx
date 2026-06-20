import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { classColor as resolveClassColor } from '../../dndUtils';

const LEVEL_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const RECHARGE_OPTIONS = ['Long Rest', 'Short Rest', 'Dawn', 'Custom'];

/**
 * Standard spell slots are DERIVED from class + level (maxSlots) — the base
 * numbers can't be hand-edited, they just recompute on level-up. Pips remain
 * clickable to expend/recover (the cast picker also expends them). Bonus slots
 * from items/feats live in the editable "Extra Sources" column.
 */
export default function SpellSlotGrid({
  maxSlots, slotsExpended, extraSlots, className, editMode,
  onExpendSlot, onUpdateExtra,
}) {
  const color = resolveClassColor(className);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: '', level: 1, max: 1, recharge: 'Long Rest' });

  const levels = Object.keys(maxSlots || {})
    .map(Number)
    .filter(l => maxSlots[String(l)] > 0)
    .sort((a, b) => a - b);

  const extras = extraSlots || [];

  const toggleBasePip = (lvl, pipIndex) => {
    const expended = slotsExpended?.[String(lvl)] || 0;
    const next = pipIndex >= expended ? pipIndex + 1 : pipIndex;
    onExpendSlot(lvl, next);
  };

  const toggleExtraPip = (idx, pipIndex) => {
    const updated = extras.map((e, i) => {
      if (i !== idx) return e;
      const next = pipIndex >= (e.expended || 0) ? pipIndex + 1 : pipIndex;
      return { ...e, expended: next };
    });
    onUpdateExtra(updated);
  };

  const addExtra = () => {
    if (!draft.label.trim()) return;
    onUpdateExtra([...extras, {
      id: `x-${Date.now()}`,
      label: draft.label.trim(),
      level: draft.level,
      max: draft.max,
      expended: 0,
      recharge: draft.recharge,
    }]);
    setDraft({ label: '', level: 1, max: 1, recharge: 'Long Rest' });
    setAdding(false);
  };

  const removeExtra = (idx) => onUpdateExtra(extras.filter((_, i) => i !== idx));

  if (levels.length === 0 && extras.length === 0 && !editMode) return null;

  return (
    <div className="spell-slots">
      <div className="spell-slots__two-col">
        {/* Derived standard slots */}
        <div className="spell-slots__standard">
          <h3 className="dnd-section-title">Spell Slots</h3>
          {levels.length === 0 ? (
            <div className="spell-slots__none">No slots at this level yet.</div>
          ) : (
            <div className="spell-slots__grid">
              {levels.map((lvl) => {
                const max = maxSlots[String(lvl)];
                const expended = slotsExpended?.[String(lvl)] || 0;
                return (
                  <div key={lvl} className="spell-slots__row">
                    <span className="spell-slots__label">{LEVEL_LABELS[lvl] || `${lvl}th`}</span>
                    <div className="spell-slots__pips">
                      {Array.from({ length: max }, (_, i) => {
                        const available = i >= expended;
                        return (
                          <button key={i}
                            className={`spell-slots__pip ${available ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                            style={available ? { background: color, borderColor: color } : {}}
                            onClick={() => toggleBasePip(lvl, i)}
                            title={available ? 'Expend slot' : 'Recover slot'}
                          />
                        );
                      })}
                    </div>
                    <span className="spell-slots__count">{max - expended}/{max}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Editable bonus sources (items / feats) */}
        {(extras.length > 0 || editMode) && (
          <div className="spell-slots__special">
            <h3 className="dnd-section-title">Extra Sources</h3>
            {extras.map((s, idx) => (
              <div key={s.id || idx} className="spell-slots__special-row">
                <div className="spell-slots__special-info">
                  <span className="spell-slots__special-label">{s.label}</span>
                  <span className="spell-slots__special-recharge">
                    {LEVEL_LABELS[s.level] || `${s.level}th`} · {s.recharge}
                  </span>
                </div>
                <div className="spell-slots__pips">
                  {Array.from({ length: s.max }, (_, i) => {
                    const available = i >= (s.expended || 0);
                    return (
                      <button key={i}
                        className={`spell-slots__pip ${available ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                        style={available ? { background: 'var(--dnd-accent)', borderColor: 'var(--dnd-accent)' } : {}}
                        onClick={() => toggleExtraPip(idx, i)}
                      />
                    );
                  })}
                </div>
                {editMode && (
                  <button className="spell-slots__adj spell-slots__adj--remove" onClick={() => removeExtra(idx)}>
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
            {extras.length === 0 && !adding && (
              <div className="spell-slots__none">None — items or feats granting bonus slots go here.</div>
            )}
          </div>
        )}
      </div>

      {editMode && (
        <div className="spell-slots__add-row">
          {!adding ? (
            <button className="dnd-add-btn" onClick={() => setAdding(true)}><Plus size={12} /> Bonus Slot Source</button>
          ) : (
            <div className="spell-slots__add-special">
              <input className="dnd-field" value={draft.label} placeholder="Source (e.g., Ring of Spell Storing)"
                onChange={e => setDraft({ ...draft, label: e.target.value })} />
              <div className="spell-slots__add-special-row">
                <label>Slot level: <input type="number" className="dnd-field dnd-field--sm" min={1} max={9} value={draft.level}
                  onChange={e => setDraft({ ...draft, level: parseInt(e.target.value) || 1 })} /></label>
                <label>Slots: <input type="number" className="dnd-field dnd-field--sm" min={1} value={draft.max}
                  onChange={e => setDraft({ ...draft, max: parseInt(e.target.value) || 1 })} /></label>
                <select className="dnd-field" value={draft.recharge}
                  onChange={e => setDraft({ ...draft, recharge: e.target.value })}>
                  {RECHARGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="spell-slots__add-special-row">
                <button className="dnd-add-btn" onClick={addExtra}>Add</button>
                <button className="dnd-add-btn" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
