import { CLASS_COLORS } from '../../dndUtils';

const LEVEL_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

export default function SpellSlotGrid({ slots, className, editMode, onUpdate }) {
  const classColor = CLASS_COLORS[className] || '#c9a96e';

  const togglePip = (lvl, pipIndex) => {
    const slot = slots[lvl];
    const isAvailable = pipIndex >= slot.expended;
    if (isAvailable) {
      // Expend: set expended to pipIndex + 1 (expend this pip and all to its left)
      onUpdate({ [lvl]: { ...slot, expended: pipIndex + 1 } });
    } else {
      // Recover: set expended to pipIndex (recover this pip and all to its right)
      onUpdate({ [lvl]: { ...slot, expended: pipIndex } });
    }
  };

  const adjustMax = (lvl, delta) => {
    const slot = slots[lvl];
    const newMax = Math.max(0, (slot.max || 0) + delta);
    onUpdate({
      [lvl]: { ...slot, max: newMax, expended: Math.min(slot.expended, newMax) }
    });
  };

  const addLevel = () => {
    // Find the next empty level
    for (let i = 1; i <= 9; i++) {
      const k = String(i);
      if (!slots[k] || slots[k].max === 0) {
        onUpdate({ [k]: { max: 1, expended: 0 } });
        return;
      }
    }
  };

  const levels = Object.entries(slots)
    .filter(([, s]) => s.max > 0)
    .sort(([a], [b]) => Number(a) - Number(b));

  if (levels.length === 0 && !editMode) return null;

  return (
    <div className="spell-slots">
      <h3 className="dnd-section-title">Spell Slots</h3>
      <div className="spell-slots__grid">
        {levels.map(([lvl, slot]) => (
          <div key={lvl} className="spell-slots__row">
            <span className="spell-slots__label">{LEVEL_LABELS[Number(lvl)] || `${lvl}th`}</span>
            <div className="spell-slots__pips">
              {Array.from({ length: slot.max }, (_, i) => {
                const isAvailable = i >= slot.expended;
                return (
                  <button
                    key={i}
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
              </div>
            )}
          </div>
        ))}
      </div>
      {editMode && (
        <button className="dnd-add-btn" onClick={addLevel} style={{ marginTop: '0.5rem' }}>+ Add Slot Level</button>
      )}
    </div>
  );
}
