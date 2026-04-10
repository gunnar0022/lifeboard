import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Barbarian rage scaling by level
function ragesForLevel(level) {
  if (level >= 20) return Infinity;
  if (level >= 17) return 6;
  if (level >= 12) return 5;
  if (level >= 6) return 4;
  if (level >= 3) return 3;
  return 2;
}

function rageDamageForLevel(level) {
  if (level >= 16) return 4;
  if (level >= 9) return 3;
  return 2;
}

export default function RageTracker({ classFeature, editMode, onUpdate, level = 1 }) {
  const { currentUses, active, resistances, extraWhileActive } = classFeature;
  const prevLevelRef = useRef(level);

  // Auto-scale max uses and bonus damage based on level
  const maxUses = ragesForLevel(level);
  const bonusDamage = rageDamageForLevel(level);
  const isUnlimited = level >= 20;

  // When level changes, update stored values and grant extra uses if max increased
  useEffect(() => {
    const prevLevel = prevLevelRef.current;
    prevLevelRef.current = level;
    if (prevLevel === level) return;

    const prevMax = ragesForLevel(prevLevel);
    const newMax = ragesForLevel(level);
    const newDamage = rageDamageForLevel(level);
    const updates = { ...classFeature, maxUses: newMax === Infinity ? 999 : newMax, bonusDamage: newDamage };

    if (newMax > prevMax && newMax !== Infinity) {
      updates.currentUses = Math.min(currentUses + (newMax - prevMax), newMax);
    }
    onUpdate({ classFeature: updates });
  }, [level]);

  const toggleRage = () => {
    if (active) {
      onUpdate({ classFeature: { ...classFeature, active: false } });
    } else if (isUnlimited || currentUses > 0) {
      onUpdate({
        classFeature: {
          ...classFeature,
          active: true,
          currentUses: isUnlimited ? currentUses : currentUses - 1,
        },
      });
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
          <span className="dnd-rage__uses">
            {isUnlimited ? '∞' : `${currentUses} of ${maxUses}`}
          </span>
        )}
      </div>

      <button
        className={`dnd-rage__toggle ${active ? 'dnd-rage__toggle--end' : ''}`}
        onClick={toggleRage}
        disabled={!active && !isUnlimited && currentUses === 0}
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
            <label>Rages (Lvl {level}): {isUnlimited ? 'Unlimited' : maxUses}</label>
          </div>
          <div className="dnd-rage__edit-row">
            <label>Rage Damage (Lvl {level}): +{bonusDamage}</label>
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
