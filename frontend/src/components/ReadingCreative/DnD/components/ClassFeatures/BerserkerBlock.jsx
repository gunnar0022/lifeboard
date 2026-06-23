import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Path of the Berserker — Combat-tab reference. Berserker has no per-rest
 * resources to track (Frenzy is per-rage, Retaliation/Intimidating Presence are
 * at-will reaction/action), so this block surfaces the combat-relevant features
 * level-gated, computes the Intimidating Presence save DC live, and highlights
 * Frenzy while the character is raging. No persisted state / rest-reset needed.
 */
const FEATURES = [
  { name: 'Frenzy', unlockLevel: 3 },
  { name: 'Mindless Rage', unlockLevel: 6 },
  { name: 'Intimidating Presence', unlockLevel: 10 },
  { name: 'Retaliation', unlockLevel: 14 },
];

export default function BerserkerBlock({ character }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const abilities = character.abilities || {};
  const isRaging = cf.active || false;
  const intimidateDC = 8 + proficiencyBonus(level) + abilityMod(abilities.CHA || 10);

  const visible = FEATURES.filter(f => f.unlockLevel <= level);
  if (visible.length === 0) return null;

  return (
    <div className="dnd-berserker">
      {visible.map(feat => (
        <div key={feat.name} className="dnd-berserker__feature">
          <div className="dnd-berserker__feature-header">
            <span className="dnd-berserker__feature-name">{feat.name}</span>
            <span className="dnd-berserker__feature-level">Lvl {feat.unlockLevel}</span>
          </div>

          {feat.name === 'Frenzy' && (
            <>
              <p className="dnd-berserker__feature-desc">
                Bonus-action melee weapon attack each turn while raging. When the rage ends you suffer <strong>1 level of exhaustion</strong>.
              </p>
              {isRaging ? (
                <div className="dnd-berserker__active-note">RAGING — bonus-action attack available</div>
              ) : (
                <p className="dnd-berserker__inactive-note">Activate Rage to frenzy</p>
              )}
            </>
          )}

          {feat.name === 'Mindless Rage' && (
            <p className="dnd-berserker__feature-desc">
              Can't be charmed or frightened while raging; an existing charm or fright is suspended for the rage.
            </p>
          )}

          {feat.name === 'Intimidating Presence' && (
            <>
              <p className="dnd-berserker__feature-desc">
                Action: one creature within <strong>30 ft</strong> that can see or hear you must make a Wisdom save or be frightened until the end of your next turn. Repeat the action on later turns to extend it.
              </p>
              <div className="dnd-berserker__resource-row">
                <span>Save DC</span>
                <span className="dnd-berserker__dc">{intimidateDC}</span>
              </div>
            </>
          )}

          {feat.name === 'Retaliation' && (
            <p className="dnd-berserker__feature-desc">
              Reaction: when a creature within <strong>5 ft</strong> deals damage to you, make a melee weapon attack against it.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
