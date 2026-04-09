import { proficiencyBonus } from '../../dndUtils';

function spiritShieldDice(level) {
  if (level >= 14) return '4d6';
  if (level >= 10) return '3d6';
  return '2d6';
}

const FEATURES = [
  {
    name: 'Ancestral Protectors',
    unlockLevel: 3,
    desc: 'While raging, the first creature you hit on your turn is marked by ancestral spirits until the start of your next turn. The marked target has disadvantage on any attack roll that isn\'t against you, and when it hits a creature other than you, that creature has resistance to the damage.',
    tracked: false,
  },
  {
    name: 'Spirit Shield',
    unlockLevel: 6,
    desc: null, // computed with scaling dice
    tracked: true,
  },
  {
    name: 'Consult the Spirits',
    unlockLevel: 10,
    desc: 'Cast Augury or Clairvoyance without a spell slot or material components (WIS is your spellcasting ability). Clairvoyance summons an invisible ancestral spirit instead of creating a sensor. Once per short or long rest.',
    tracked: true,
  },
  {
    name: 'Vengeful Ancestors',
    unlockLevel: 14,
    desc: 'When you use Spirit Shield, the attacker takes force damage equal to the amount Spirit Shield prevented.',
    tracked: false,
  },
];

export default function AncestralGuardianBlock({ character, editMode, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const isRaging = cf.active || false;

  // Spirit Shield uses (reaction, no limit but tracked for awareness)
  // Consult the Spirits: 1 use per short/long rest
  const consultUsed = cf.consultSpiritsUsed || false;

  const useConsultSpirits = () => {
    onUpdate({ classFeature: { ...cf, consultSpiritsUsed: true } });
  };

  const visibleFeatures = FEATURES.filter(f => f.unlockLevel <= level);

  if (visibleFeatures.length === 0) return null;

  return (
    <div className="dnd-ancestral">
      {visibleFeatures.map(feat => (
        <div key={feat.name} className="dnd-ancestral__feature">
          <div className="dnd-ancestral__feature-header">
            <span className="dnd-ancestral__feature-name">{feat.name}</span>
            <span className="dnd-ancestral__feature-level">Lvl {feat.unlockLevel}</span>
          </div>

          {feat.name === 'Ancestral Protectors' && (
            <>
              <p className="dnd-ancestral__feature-desc">{feat.desc}</p>
              {isRaging && (
                <div className="dnd-ancestral__active-note">
                  RAGING — First hit marks target with ancestral spirits
                </div>
              )}
              {!isRaging && (
                <p className="dnd-ancestral__inactive-note">Activate Rage to use this feature</p>
              )}
            </>
          )}

          {feat.name === 'Spirit Shield' && (
            <>
              <p className="dnd-ancestral__feature-desc">
                Reaction: when a creature within 30ft takes damage, reduce it by <strong>{spiritShieldDice(level)}</strong>.
                {level >= 14 && <> Attacker takes force damage equal to the amount prevented (Vengeful Ancestors).</>}
              </p>
              <p className="dnd-ancestral__req-note">Requires: raging, not incapacitated</p>
            </>
          )}

          {feat.name === 'Consult the Spirits' && (
            <>
              <p className="dnd-ancestral__feature-desc">{feat.desc}</p>
              <div className="dnd-ancestral__resource-row">
                <span>{consultUsed ? 'Used' : 'Available'}</span>
                <button
                  className="dnd-ancestral__use-btn"
                  onClick={useConsultSpirits}
                  disabled={consultUsed}
                >
                  {consultUsed ? 'Spent' : 'Cast'}
                </button>
              </div>
            </>
          )}

          {feat.name === 'Vengeful Ancestors' && (
            <p className="dnd-ancestral__feature-desc">{feat.desc}</p>
          )}
        </div>
      ))}
    </div>
  );
}
