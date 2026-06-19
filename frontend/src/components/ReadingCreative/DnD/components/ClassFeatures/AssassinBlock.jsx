import { abilityMod, proficiencyBonus } from '../../dndUtils';

/**
 * Assassin — Combat tab. Only the combat-relevant features show here, kept
 * brief; full rules text lives in the Features tab (Subclass zone).
 *   Assassinate (L3) — quick reminder.
 *   Death Strike (L17) — computed save DC.
 */
export default function AssassinBlock({ character }) {
  const level = character.meta?.level || 3;
  const dex = character.abilities?.DEX || 10;
  const deathStrikeDC = 8 + abilityMod(dex) + proficiencyBonus(level);

  return (
    <div className="dnd-assassin">
      <div className="dnd-assassin__feature">
        <div className="dnd-assassin__feature-header">
          <span className="dnd-assassin__feature-name">Assassinate</span>
          <span className="dnd-assassin__feature-level">Lvl 3</span>
        </div>
        <p className="dnd-assassin__feature-desc">
          Advantage vs. any creature that hasn't acted yet. Any hit on a surprised creature is a critical hit.
        </p>
        <div className="dnd-assassin__reminder">
          Stacks with Sneak Attack — a surprised target takes a critical Sneak Attack.
        </div>
      </div>

      {level >= 17 && (
        <div className="dnd-assassin__feature">
          <div className="dnd-assassin__feature-header">
            <span className="dnd-assassin__feature-name">Death Strike</span>
            <span className="dnd-assassin__feature-level">Lvl 17</span>
          </div>
          <p className="dnd-assassin__feature-desc">
            Hit a surprised creature → it makes a CON save (DC {deathStrikeDC}) or takes double damage.
          </p>
        </div>
      )}
    </div>
  );
}
