import { CLASS_COLORS } from '../../dndUtils';

const LEVEL_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th'];

export default function PactSlotDisplay({ pactSlots, editMode, onUpdate }) {
  const classColor = CLASS_COLORS['Warlock'] || '#5a2a5a';

  const toggleSlot = () => {
    const available = pactSlots.current;
    if (available > 0) {
      onUpdate({ current: pactSlots.current - 1 });
    } else {
      onUpdate({ current: Math.min(pactSlots.current + 1, pactSlots.max) });
    }
  };

  return (
    <div className="spell-pact">
      <h3 className="dnd-section-title">Pact Slots</h3>
      <div className="spell-pact__row">
        <span className="spell-pact__level">Level {LEVEL_LABELS[pactSlots.level] || pactSlots.level}</span>
        <div className="spell-slots__pips">
          {Array.from({ length: pactSlots.max }, (_, i) => {
            const isAvailable = i < pactSlots.current;
            return (
              <button
                key={i}
                className={`spell-slots__pip ${isAvailable ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                style={isAvailable ? { background: classColor, borderColor: classColor } : {}}
                onClick={toggleSlot}
              />
            );
          })}
        </div>
        <span className="spell-pact__recharge">Short Rest &#x21BA;</span>
      </div>
      {editMode && (
        <div className="spell-pact__edit">
          <label>Max: <input type="number" className="dnd-field dnd-field--sm" value={pactSlots.max}
            onChange={e => onUpdate({ max: parseInt(e.target.value) || 1, current: Math.min(pactSlots.current, parseInt(e.target.value) || 1) })} /></label>
          <label>Level: <input type="number" className="dnd-field dnd-field--sm" value={pactSlots.level} min={1} max={5}
            onChange={e => onUpdate({ level: parseInt(e.target.value) || 1 })} /></label>
        </div>
      )}
    </div>
  );
}
