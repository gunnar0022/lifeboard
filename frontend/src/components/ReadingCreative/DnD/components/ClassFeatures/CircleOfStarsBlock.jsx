import { useState } from 'react';
import { abilityMod, formatMod, proficiencyBonus } from '../../dndUtils';

const CONSTELLATIONS = {
  Archer: {
    base: 'Bonus action: ranged spell attack, 60ft. 1d8 + WIS mod radiant damage.',
    upgraded: 'Bonus action: ranged spell attack, 60ft. 2d8 + WIS mod radiant damage.',
  },
  Chalice: {
    base: 'When you cast a healing spell with a slot, you or a creature within 30ft regains 1d8 + WIS mod HP.',
    upgraded: 'When you cast a healing spell with a slot, you or a creature within 30ft regains 2d8 + WIS mod HP.',
  },
  Dragon: {
    base: 'Treat rolls of 9 or lower as 10 on INT/WIS checks and CON concentration saves.',
    upgraded: 'Treat rolls of 9 or lower as 10 on INT/WIS checks and CON concentration saves. Gain 20ft flying speed (hover).',
  },
};

export default function CircleOfStarsBlock({ character, editMode, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const profBonus = proficiencyBonus(level);
  const isUpgraded = level >= 10;
  const [showPicker, setShowPicker] = useState(false);

  const isInStarryForm = cf.activeForm === 'starry' && cf.active;
  const activeConstellation = cf.starryConstellation || null;
  const canActivate = (cf.currentUses || 0) > 0 && !cf.active;

  // Star Map: guiding bolt free casts
  const guidingBoltMax = profBonus;
  const guidingBoltUsed = cf.guidingBoltUsed || 0;

  // Cosmic Omen (6th level)
  const cosmicOmen = cf.cosmicOmen || { type: null, usesRemaining: profBonus };

  const activateStarryForm = (constellation) => {
    if (!canActivate) return;
    onUpdate({
      classFeature: {
        ...cf,
        active: true,
        currentUses: (cf.currentUses || 1) - 1,
        activeForm: 'starry',
        starryConstellation: constellation,
      },
    });
    setShowPicker(false);
  };

  const useGuidingBolt = () => {
    if (guidingBoltUsed >= guidingBoltMax) return;
    onUpdate({ classFeature: { ...cf, guidingBoltUsed: guidingBoltUsed + 1 } });
  };

  const rollCosmicOmen = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const type = roll % 2 === 0 ? 'Weal' : 'Woe';
    onUpdate({ classFeature: { ...cf, cosmicOmen: { type, usesRemaining: profBonus, roll } } });
  };

  const useCosmicOmen = () => {
    if (cosmicOmen.usesRemaining <= 0) return;
    onUpdate({
      classFeature: { ...cf, cosmicOmen: { ...cosmicOmen, usesRemaining: cosmicOmen.usesRemaining - 1 } },
    });
  };

  return (
    <div className="dnd-stars">
      {/* Starry Form activation */}
      <div className="dnd-stars__section">
        <h4 className="dnd-stars__subtitle">Starry Form</h4>
        {!isInStarryForm && !showPicker && (
          <button
            className="dnd-stars__activate-btn"
            onClick={() => setShowPicker(true)}
            disabled={!canActivate}
            title={!canActivate ? (cf.active ? 'Already in a form' : 'No Wild Shape uses remaining') : 'Expend Wild Shape to enter Starry Form'}
          >
            ENTER STARRY FORM
          </button>
        )}
        {showPicker && (
          <div className="dnd-stars__constellation-picker">
            {Object.entries(CONSTELLATIONS).map(([name, data]) => (
              <button key={name} className="dnd-stars__constellation-pick-btn" onClick={() => activateStarryForm(name)}>
                <strong>{name}</strong>
                <span>{isUpgraded ? data.upgraded : data.base}</span>
              </button>
            ))}
            <button className="dnd-stars__cancel-pick" onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        )}
        {isInStarryForm && (
          <div className="dnd-stars__active-form">
            <span className="dnd-stars__active-badge">STARRY FORM: {activeConstellation}</span>
            <p className="dnd-stars__desc-sm">Sheds bright light 10ft, dim 10ft. Lasts 10 min.</p>
            {isUpgraded && <p className="dnd-stars__upgrade-note">Can change constellation at start of each turn.</p>}
          </div>
        )}
      </div>

      {/* Constellation reference */}
      <div className="dnd-stars__section">
        <h4 className="dnd-stars__subtitle">Constellations</h4>
        {Object.entries(CONSTELLATIONS).map(([name, data]) => (
          <div key={name} className={`dnd-stars__constellation ${isInStarryForm && activeConstellation === name ? 'dnd-stars__constellation--active' : ''}`}>
            <span className="dnd-stars__constellation-name">{name}</span>
            <span className="dnd-stars__constellation-desc">{isUpgraded ? data.upgraded : data.base}</span>
          </div>
        ))}
      </div>

      {/* Star Map */}
      <div className="dnd-stars__section">
        <h4 className="dnd-stars__subtitle">Star Map</h4>
        <p className="dnd-stars__desc-sm">Know Guidance cantrip. Guiding Bolt always prepared.</p>
        <div className="dnd-stars__resource-row">
          <span className="dnd-stars__resource-label">Guiding Bolt (free):</span>
          <span className="dnd-stars__resource-count">{guidingBoltMax - guidingBoltUsed}/{guidingBoltMax}</span>
          <button className="dnd-stars__use-btn" onClick={useGuidingBolt} disabled={guidingBoltUsed >= guidingBoltMax}>
            Cast
          </button>
        </div>
      </div>

      {/* Cosmic Omen (6th level) */}
      {level >= 6 && (
        <div className="dnd-stars__section">
          <h4 className="dnd-stars__subtitle">Cosmic Omen</h4>
          <div className="dnd-stars__omen-row">
            {cosmicOmen.type ? (
              <>
                <span className={`dnd-stars__omen-badge dnd-stars__omen-badge--${cosmicOmen.type.toLowerCase()}`}>
                  {cosmicOmen.type} (rolled {cosmicOmen.roll})
                </span>
                <span className="dnd-stars__resource-count">{cosmicOmen.usesRemaining}/{profBonus}</span>
                <button className="dnd-stars__use-btn" onClick={useCosmicOmen} disabled={cosmicOmen.usesRemaining <= 0}>Use</button>
              </>
            ) : (
              <button className="dnd-stars__roll-btn" onClick={rollCosmicOmen}>Roll Cosmic Omen</button>
            )}
          </div>
          <p className="dnd-stars__desc-sm">
            {cosmicOmen.type === 'Weal' ? 'Reaction: add 1d6 to attack, save, or ability check within 30ft.'
              : cosmicOmen.type === 'Woe' ? 'Reaction: subtract 1d6 from attack, save, or ability check within 30ft.'
              : 'After long rest, roll to determine Weal or Woe.'}
          </p>
        </div>
      )}

      {/* Full of Stars (14th level) */}
      {level >= 14 && (
        <div className="dnd-stars__section">
          <h4 className="dnd-stars__subtitle">Full of Stars</h4>
          <p className="dnd-stars__desc">While in Starry Form: resistance to bludgeoning, piercing, and slashing damage.</p>
        </div>
      )}
    </div>
  );
}
