import { abilityMod } from '../../dndUtils';

/**
 * Path of the Battlerager — Combat-tab reference. Battlerager has no per-rest
 * resources to track: the spike attack is a bonus action while raging, Reckless
 * Abandon rides on Reckless Attack, Charge is at-will while raging, and Spiked
 * Retribution is a passive reaction. So this block surfaces the combat-relevant
 * features level-gated, computes the spike attack modifier and Reckless Abandon
 * temp HP live, and highlights what's available while raging. No persisted state.
 */
const FEATURES = [
  { name: 'Battlerager Armor', unlockLevel: 3 },
  { name: 'Reckless Abandon', unlockLevel: 6 },
  { name: 'Battlerager Charge', unlockLevel: 10 },
  { name: 'Spiked Retribution', unlockLevel: 14 },
];

function fmt(mod) { return mod >= 0 ? `+${mod}` : `${mod}`; }

export default function BattleragerBlock({ character }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const abilities = character.abilities || {};
  const isRaging = cf.active || false;
  const strMod = abilityMod(abilities.STR || 10);
  const conMod = abilityMod(abilities.CON || 10);
  const recklessTemp = Math.max(1, conMod);

  const visible = FEATURES.filter(f => f.unlockLevel <= level);
  if (visible.length === 0) return null;

  return (
    <div className="dnd-battlerager">
      {visible.map(feat => (
        <div key={feat.name} className="dnd-battlerager__feature">
          <div className="dnd-battlerager__feature-header">
            <span className="dnd-battlerager__feature-name">{feat.name}</span>
            <span className="dnd-battlerager__feature-level">Lvl {feat.unlockLevel}</span>
          </div>

          {feat.name === 'Battlerager Armor' && (
            <>
              <p className="dnd-battlerager__feature-desc">
                Bonus action while raging in spiked armor: one spike attack vs. a target within <strong>5 ft</strong> — <strong>{fmt(strMod)} to hit</strong>, <strong>1d4{fmt(strMod)}</strong> piercing. A successful Attack-action grapple also deals <strong>3 piercing</strong>.
              </p>
              {isRaging ? (
                <div className="dnd-battlerager__active-note">RAGING — bonus-action spike attack available</div>
              ) : (
                <p className="dnd-battlerager__inactive-note">Activate Rage to use the spike attack</p>
              )}
            </>
          )}

          {feat.name === 'Reckless Abandon' && (
            <>
              <p className="dnd-battlerager__feature-desc">
                When you use Reckless Attack while raging, gain temporary HP equal to your Constitution modifier (min 1). They vanish when the rage ends.
              </p>
              <div className="dnd-battlerager__resource-row">
                <span>Temp HP on Reckless Attack</span>
                <span className="dnd-battlerager__value">{recklessTemp}</span>
              </div>
            </>
          )}

          {feat.name === 'Battlerager Charge' && (
            <p className="dnd-battlerager__feature-desc">
              You can take the <strong>Dash</strong> action as a bonus action while raging.
            </p>
          )}

          {feat.name === 'Spiked Retribution' && (
            <p className="dnd-battlerager__feature-desc">
              When a creature within <strong>5 ft</strong> hits you with a melee attack, it takes <strong>3 piercing</strong> — while raging, not incapacitated, and wearing spiked armor.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
