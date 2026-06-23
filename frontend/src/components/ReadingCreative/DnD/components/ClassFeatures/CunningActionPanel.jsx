import { sneakAttackDice } from '../../classProgression';

export default function CunningActionPanel({ classFeature, level = 1, editMode, onUpdate }) {
  // Sneak Attack snaps to level: ceil(level / 2) d6, like the other
  // class-authoritative resources (no longer a stored, manually-edited value).
  const sneakDamage = `${sneakAttackDice(level)}d6`;

  return (
    <div className="dnd-cunning">
      <div className="dnd-cunning__sneak">
        <h4 className="dnd-cunning__title">SNEAK ATTACK</h4>
        <div className="dnd-cunning__dice">
          <span className="dnd-cunning__dice-value">{sneakDamage}</span>
        </div>
        <p className="dnd-cunning__reminder">
          Once per turn. Requires advantage OR an ally within 5ft of target. Must use finesse or ranged weapon.
        </p>
      </div>

      <div className="dnd-cunning__actions">
        <h4 className="dnd-cunning__title">CUNNING ACTION</h4>
        <div className="dnd-cunning__chips">
          <span className="dnd-cunning__chip">DASH</span>
          <span className="dnd-cunning__chip">DISENGAGE</span>
          <span className="dnd-cunning__chip">HIDE</span>
        </div>
        <span className="dnd-cunning__sub">Bonus Action</span>
      </div>

      {(level >= 3 || level >= 5) && (
        <div className="dnd-cunning__extras">
          {level >= 3 && (
            <div className="dnd-cunning__extra">
              <strong>Steady Aim</strong> — BA: advantage on your next attack this turn (speed becomes 0).
            </div>
          )}
          {level >= 5 && (
            <div className="dnd-cunning__extra">
              <strong>Uncanny Dodge</strong> — Reaction: halve the damage of one attack you can see.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
