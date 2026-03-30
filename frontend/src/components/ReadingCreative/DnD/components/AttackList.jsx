import { abilityMod, formatMod, proficiencyBonus } from '../dndUtils';

export default function AttackList({ attacks, abilities, level, classFeature, editMode, onUpdate }) {
  const profBonus = proficiencyBonus(level);
  const isRaging = classFeature?.type === 'rage' && classFeature?.active;
  const rageDamage = classFeature?.bonusDamage || 0;

  const handleAttackChange = (index, field, value) => {
    const updated = attacks.map((a, i) => i === index ? { ...a, [field]: value } : a);
    onUpdate({ attacks: updated });
  };

  const addAttack = () => {
    onUpdate({
      attacks: [...attacks, {
        name: '', atkAbility: 'STR', damage: '1d6', damageType: 'slashing',
        properties: '', affectedByClassFeature: false,
      }],
    });
  };

  const removeAttack = (index) => {
    onUpdate({ attacks: attacks.filter((_, i) => i !== index) });
  };

  return (
    <div className="dnd-attacks">
      <h3 className="dnd-section-title">Attacks</h3>
      <div className="dnd-attacks__list">
        {attacks.map((atk, i) => {
          const atkMod = abilityMod(abilities[atk.atkAbility] || 10);
          const totalAtk = atkMod + profBonus + (atk.atkBonus || 0);
          const dmgMod = abilityMod(abilities[atk.atkAbility] || 10);

          if (editMode) {
            return (
              <div key={i} className="dnd-attacks__card dnd-attacks__card--edit">
                <button className="dnd-attacks__remove" onClick={() => removeAttack(i)}>X</button>
                <input className="dnd-field" value={atk.name} placeholder="Name"
                  onChange={e => handleAttackChange(i, 'name', e.target.value)} />
                <div className="dnd-attacks__edit-row">
                  <select className="dnd-field" value={atk.atkAbility}
                    onChange={e => handleAttackChange(i, 'atkAbility', e.target.value)}>
                    <option value="STR">STR</option>
                    <option value="DEX">DEX</option>
                    <option value="INT">INT</option>
                    <option value="WIS">WIS</option>
                    <option value="CHA">CHA</option>
                  </select>
                  <input className="dnd-field" value={atk.damage} placeholder="Damage"
                    onChange={e => handleAttackChange(i, 'damage', e.target.value)} />
                  <input className="dnd-field" value={atk.damageType} placeholder="Type"
                    onChange={e => handleAttackChange(i, 'damageType', e.target.value)} />
                </div>
                <input className="dnd-field" value={atk.properties || ''} placeholder="Properties"
                  onChange={e => handleAttackChange(i, 'properties', e.target.value)} />
                <div className="dnd-attacks__edit-row">
                  <label className="dnd-attacks__checkbox">
                    <input type="checkbox" checked={atk.affectedByClassFeature || false}
                      onChange={e => handleAttackChange(i, 'affectedByClassFeature', e.target.checked)} />
                    <span>Affected by class feature</span>
                  </label>
                  <input type="number" className="dnd-field dnd-field--sm" placeholder="Bonus"
                    value={atk.atkBonus || ''} onChange={e => handleAttackChange(i, 'atkBonus', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="dnd-attacks__card">
              <div className="dnd-attacks__header">
                <span className="dnd-attacks__name">{atk.name}</span>
                <span className="dnd-attacks__hit">{formatMod(totalAtk)} to hit</span>
              </div>
              <div className="dnd-attacks__damage">
                {atk.damage} + {dmgMod} {atk.damageType}
                {isRaging && atk.affectedByClassFeature && (
                  <span className="dnd-attacks__rage-bonus"> (+{rageDamage} rage)</span>
                )}
              </div>
              {atk.properties && <div className="dnd-attacks__props">{atk.properties}</div>}
            </div>
          );
        })}
      </div>
      {editMode && (
        <button className="dnd-add-btn" onClick={addAttack}>+ Add Attack</button>
      )}
    </div>
  );
}
