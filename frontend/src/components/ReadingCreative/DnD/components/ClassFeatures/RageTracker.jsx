import { motion } from 'framer-motion';

export default function RageTracker({ classFeature, editMode, onUpdate }) {
  const { maxUses, currentUses, active, bonusDamage, resistances, extraWhileActive } = classFeature;

  const toggleRage = () => {
    if (active) {
      onUpdate({ classFeature: { ...classFeature, active: false } });
    } else if (currentUses > 0) {
      onUpdate({ classFeature: { ...classFeature, active: true, currentUses: currentUses - 1 } });
    }
  };

  return (
    <motion.div
      className={`dnd-rage ${active ? 'dnd-rage--active' : ''}`}
      animate={active ? { boxShadow: '0 0 20px rgba(180,20,20,var(--dnd-glow-opacity, 0.3))' } : { boxShadow: '0 0 0px rgba(180,20,20,0)' }}
    >
      <div className="dnd-rage__header">
        <h4 className="dnd-rage__title">RAGE</h4>
        {active ? (
          <span className="dnd-rage__status dnd-rage__status--active">ACTIVE</span>
        ) : (
          <span className="dnd-rage__uses">{currentUses} of {maxUses}</span>
        )}
      </div>

      <button
        className={`dnd-rage__toggle ${active ? 'dnd-rage__toggle--end' : ''}`}
        onClick={toggleRage}
        disabled={!active && currentUses === 0}
      >
        {active ? 'END RAGE' : 'RAGE'}
      </button>

      {active && (
        <motion.div
          className="dnd-rage__effects"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p>+{bonusDamage} damage &middot; Resist {(resistances || []).join('/')}</p>
          <p>ADV on STR checks & saves</p>
          {extraWhileActive && <p className="dnd-rage__extra">{extraWhileActive}</p>}
        </motion.div>
      )}

      {editMode && (
        <div className="dnd-rage__edit">
          <div className="dnd-rage__edit-row">
            <label>Max Uses</label>
            <input type="number" className="dnd-field dnd-field--sm" value={maxUses}
              onChange={e => onUpdate({ classFeature: { ...classFeature, maxUses: parseInt(e.target.value) || 1 } })} />
          </div>
          <div className="dnd-rage__edit-row">
            <label>Bonus Damage</label>
            <input type="number" className="dnd-field dnd-field--sm" value={bonusDamage}
              onChange={e => onUpdate({ classFeature: { ...classFeature, bonusDamage: parseInt(e.target.value) || 0 } })} />
          </div>
          <div className="dnd-rage__edit-row">
            <label>Resistances</label>
            <input className="dnd-field" value={(resistances || []).join(', ')}
              onChange={e => onUpdate({ classFeature: { ...classFeature, resistances: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
          </div>
          <div className="dnd-rage__edit-row">
            <label>Extra while active</label>
            <textarea className="dnd-field dnd-field--textarea" value={extraWhileActive || ''} rows={2}
              onChange={e => onUpdate({ classFeature: { ...classFeature, extraWhileActive: e.target.value } })} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
