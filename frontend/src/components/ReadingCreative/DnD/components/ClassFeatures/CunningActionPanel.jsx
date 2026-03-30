export default function CunningActionPanel({ classFeature, editMode, onUpdate }) {
  const sneakDamage = classFeature?.sneakAttackDamage || '1d6';

  return (
    <div className="dnd-cunning">
      <div className="dnd-cunning__sneak">
        <h4 className="dnd-cunning__title">SNEAK ATTACK</h4>
        <div className="dnd-cunning__dice">
          {editMode ? (
            <input className="dnd-field dnd-field--sm" value={sneakDamage}
              onChange={e => onUpdate({ classFeature: { ...classFeature, sneakAttackDamage: e.target.value } })} />
          ) : (
            <span className="dnd-cunning__dice-value">{sneakDamage}</span>
          )}
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
    </div>
  );
}
