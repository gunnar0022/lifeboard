import { useState } from 'react';
import { motion } from 'framer-motion';
import BeastFormPicker from './BeastFormPicker';

/**
 * WildShapeTracker — handles Wild Shape resource (uses) and Beast Form only.
 * Subclass-specific forms (Symbiotic Entity, Starry Form) are activated from
 * their respective SubclassBlock components, which consume uses from here.
 */
export default function WildShapeTracker({ classFeature, editMode, onUpdate, character }) {
  const { maxUses, currentUses, active, rechargeOn } = classFeature;
  const [showBeastPicker, setShowBeastPicker] = useState(false);

  const activeForm = classFeature.activeForm || null;
  const monsterForm = classFeature.monsterForm || null;

  const activateBeastForm = (beast) => {
    if (currentUses <= 0) return;
    onUpdate({
      classFeature: {
        ...classFeature,
        active: true,
        currentUses: currentUses - 1,
        activeForm: 'monster',
        monsterForm: beast,
        _beastTransform: beast,
      },
    });
    setShowBeastPicker(false);
  };

  const dismissForm = () => {
    onUpdate({
      classFeature: {
        ...classFeature,
        active: false,
        activeForm: null,
        symbioticEntity: false,
        starryConstellation: null,
        monsterForm: null,
      },
    });
  };

  const handleToggle = () => {
    if (active) {
      dismissForm();
    } else if (currentUses > 0) {
      setShowBeastPicker(true);
    }
  };

  // If a subclass form is active (spores/starry), show that status but let their
  // blocks handle the details. Only show beast form effects here.
  const isSubclassForm = active && (activeForm === 'spores' || activeForm === 'starry');

  return (
    <motion.div
      className={`dnd-wildshape ${active ? 'dnd-wildshape--active' : ''}`}
      animate={active
        ? { boxShadow: `0 0 20px rgba(42,106,42,var(--dnd-glow-opacity, 0.3))` }
        : { boxShadow: '0 0 0px rgba(42,106,42,0)' }}
    >
      <div className="dnd-wildshape__header">
        <h4 className="dnd-wildshape__title">WILD SHAPE</h4>
        {active ? (
          <span className="dnd-wildshape__status dnd-wildshape__status--active">
            {activeForm === 'spores' ? 'SYMBIOTIC ENTITY' :
             activeForm === 'starry' ? `STARRY FORM` :
             activeForm === 'monster' ? (monsterForm?.name || 'TRANSFORMED') :
             'ACTIVE'}
          </span>
        ) : (
          <span className="dnd-wildshape__uses">{currentUses} of {maxUses}</span>
        )}
      </div>

      {/* Beast form picker */}
      {showBeastPicker && !active && (
        <div className="dnd-wildshape__picker">
          <BeastFormPicker
            onSelect={activateBeastForm}
            onCancel={() => setShowBeastPicker(false)}
          />
          <button className="dnd-wildshape__cancel" onClick={() => setShowBeastPicker(false)}>Cancel</button>
        </div>
      )}

      {/* Toggle button (when not picking) */}
      {!showBeastPicker && (
        <button
          className={`dnd-wildshape__toggle ${active ? 'dnd-wildshape__toggle--end' : ''}`}
          onClick={handleToggle}
          disabled={!active && currentUses === 0}
        >
          {active ? 'END WILD SHAPE' : 'BEAST FORM'}
        </button>
      )}

      {/* Beast form effects */}
      {active && activeForm === 'monster' && monsterForm && (
        <motion.div className="dnd-wildshape__effects"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <p><strong>{monsterForm.name}</strong> (CR {monsterForm.cr})</p>
          <p>HP {monsterForm.hp} | AC {monsterForm.ac}</p>
          {monsterForm.speeds && (
            <p>{Object.entries(monsterForm.speeds).filter(([,v]) => v > 0).map(([k,v]) => `${k} ${v}ft`).join(', ')}</p>
          )}
          {monsterForm.senses && <p>Senses: {monsterForm.senses}</p>}
          <p className="dnd-wildshape__auto-note">Overflow damage carries to real HP when beast drops to 0</p>
        </motion.div>
      )}

      {/* Subclass form note — details shown in SubclassBlock */}
      {isSubclassForm && (
        <p className="dnd-wildshape__auto-note" style={{ marginTop: '0.3rem' }}>
          See subclass section below for details
        </p>
      )}

      {rechargeOn && !active && !showBeastPicker && (
        <span className="dnd-wildshape__recharge">
          {rechargeOn === 'short' ? 'SHORT REST' : 'LONG REST'}
        </span>
      )}

      {editMode && (
        <div className="dnd-wildshape__edit">
          <div className="dnd-wildshape__edit-row">
            <label>Max Uses</label>
            <input type="number" className="dnd-field dnd-field--sm" value={maxUses}
              onChange={e => onUpdate({ classFeature: { ...classFeature, maxUses: parseInt(e.target.value) || 1 } })} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
