import { useState } from 'react';
import { motion } from 'framer-motion';

const STARRY_FORMS = {
  Archer: 'Bonus action ranged spell attack. 1d8 + WIS mod radiant damage, 60 ft. range.',
  Chalice: 'When you cast a healing spell using a spell slot, you or a creature within 30 ft. regains 1d8 + WIS mod HP.',
  Dragon: 'Treat rolls of 9 or lower as 10 on INT/WIS checks and CON concentration saves.',
};

export default function WildShapeTracker({ classFeature, editMode, onUpdate, character }) {
  const { maxUses, currentUses, active, rechargeOn } = classFeature;
  const [showFormPicker, setShowFormPicker] = useState(false);
  const level = character?.meta?.level || 1;

  const activeForm = classFeature.activeForm || null; // 'spores' | 'monster' | 'starry' | null
  const starryConstellation = classFeature.starryConstellation || null;
  const monsterForm = classFeature.monsterForm || null;

  const activateForm = (formType, extra = {}) => {
    if (currentUses <= 0) return;
    const updates = {
      ...classFeature,
      active: true,
      currentUses: currentUses - 1,
      activeForm: formType,
      ...extra,
    };

    // Circle of Spores: auto-grant temp HP = 4 * druid level
    if (formType === 'spores') {
      updates.symbioticEntity = true;
      // Set temp HP on the character's combat
      if (character?.combat) {
        const tempHp = 4 * level;
        // Will be handled via onUpdate by parent
        updates._grantTempHp = tempHp;
      }
    }

    setShowFormPicker(false);
    onUpdate({ classFeature: updates });
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
      }
    });
  };

  const handleToggle = () => {
    if (active) {
      dismissForm();
    } else if (currentUses > 0) {
      setShowFormPicker(true);
    }
  };

  const formColor = activeForm === 'spores' ? 'var(--dnd-class-druid)'
    : activeForm === 'starry' ? 'var(--dnd-class-wizard)'
    : activeForm === 'monster' ? 'var(--dnd-class-ranger)'
    : 'var(--dnd-class-druid)';

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
             activeForm === 'starry' ? `STARRY: ${starryConstellation || ''}` :
             activeForm === 'monster' ? (monsterForm?.name || 'TRANSFORMED') :
             'ACTIVE'}
          </span>
        ) : (
          <span className="dnd-wildshape__uses">{currentUses} of {maxUses}</span>
        )}
      </div>

      {/* Form picker */}
      {showFormPicker && !active && (
        <div className="dnd-wildshape__picker">
          <p className="dnd-wildshape__picker-label">Choose form:</p>
          <div className="dnd-wildshape__picker-btns">
            <button className="dnd-wildshape__form-btn dnd-wildshape__form-btn--spores"
              onClick={() => activateForm('spores')}>
              Symbiotic Entity
              <span className="dnd-wildshape__form-desc">+{4 * level} temp HP, +1d6 poison melee</span>
            </button>
            <button className="dnd-wildshape__form-btn dnd-wildshape__form-btn--monster"
              onClick={() => activateForm('monster')}>
              Beast Form
              <span className="dnd-wildshape__form-desc">Transform into a creature</span>
            </button>
            <button className="dnd-wildshape__form-btn dnd-wildshape__form-btn--starry"
              onClick={() => setShowFormPicker('starry')}>
              Starry Form
              <span className="dnd-wildshape__form-desc">Choose a constellation</span>
            </button>
          </div>
          {showFormPicker === 'starry' && (
            <div className="dnd-wildshape__starry-picker">
              {Object.entries(STARRY_FORMS).map(([name, desc]) => (
                <button key={name} className="dnd-wildshape__starry-btn"
                  onClick={() => activateForm('starry', { starryConstellation: name })}>
                  <strong>{name}</strong>
                  <span>{desc}</span>
                </button>
              ))}
            </div>
          )}
          <button className="dnd-wildshape__cancel" onClick={() => setShowFormPicker(false)}>Cancel</button>
        </div>
      )}

      {/* Toggle button (when not picking) */}
      {!showFormPicker && (
        <button
          className={`dnd-wildshape__toggle ${active ? 'dnd-wildshape__toggle--end' : ''}`}
          onClick={handleToggle}
          disabled={!active && currentUses === 0}
        >
          {active ? 'END WILD SHAPE' : 'WILD SHAPE'}
        </button>
      )}

      {/* Active form effects */}
      {active && activeForm === 'spores' && (
        <motion.div className="dnd-wildshape__effects"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <p>Symbiotic Entity active</p>
          <p>+1d6 poison damage on melee weapon attacks</p>
          <p>Halo of Spores upgraded</p>
          <p className="dnd-wildshape__auto-note">Temp HP: {4 * level} (4 x level {level})</p>
        </motion.div>
      )}

      {active && activeForm === 'starry' && starryConstellation && (
        <motion.div className="dnd-wildshape__effects"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <p><strong>Starry Form: {starryConstellation}</strong></p>
          <p>{STARRY_FORMS[starryConstellation]}</p>
        </motion.div>
      )}

      {active && activeForm === 'monster' && (
        <motion.div className="dnd-wildshape__effects"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <p>Beast form active — track beast HP separately</p>
          <p className="dnd-wildshape__auto-note">Overflow damage carries to real HP when beast drops to 0</p>
        </motion.div>
      )}

      {rechargeOn && !active && !showFormPicker && (
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
