import { motion } from 'framer-motion';

export default function WildShapeTracker({ classFeature, editMode, onUpdate }) {
  const { maxUses, currentUses, active, rechargeOn } = classFeature;

  const toggleWildShape = () => {
    if (active) {
      onUpdate({ classFeature: { ...classFeature, active: false } });
    } else if (currentUses > 0) {
      onUpdate({ classFeature: { ...classFeature, active: true, currentUses: currentUses - 1 } });
    }
  };

  return (
    <motion.div
      className={`dnd-wildshape ${active ? 'dnd-wildshape--active' : ''}`}
      animate={active
        ? { boxShadow: '0 0 20px rgba(42,106,42,var(--dnd-glow-opacity, 0.3))' }
        : { boxShadow: '0 0 0px rgba(42,106,42,0)' }}
    >
      <div className="dnd-wildshape__header">
        <h4 className="dnd-wildshape__title">WILD SHAPE</h4>
        {active ? (
          <span className="dnd-wildshape__status dnd-wildshape__status--active">ACTIVE</span>
        ) : (
          <span className="dnd-wildshape__uses">{currentUses} of {maxUses}</span>
        )}
      </div>

      <button
        className={`dnd-wildshape__toggle ${active ? 'dnd-wildshape__toggle--end' : ''}`}
        onClick={toggleWildShape}
        disabled={!active && currentUses === 0}
      >
        {active ? 'END WILD SHAPE' : 'WILD SHAPE'}
      </button>

      {active && (
        <motion.div
          className="dnd-wildshape__effects"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p>Transformed &middot; Uses Druid wildshape rules</p>
        </motion.div>
      )}

      {rechargeOn && (
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
