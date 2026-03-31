import { abilityMod, formatMod, proficiencyBonus } from '../../dndUtils';

export default function SpellcastingHeader({ spellcasting, abilities, level, editMode, onUpdate }) {
  const ability = spellcasting.ability || 'WIS';
  const mod = abilityMod(abilities[ability] || 10);
  const prof = proficiencyBonus(level);
  const saveDC = 8 + prof + mod;
  const atkBonus = prof + mod;

  return (
    <div className="spell-header">
      <div className="spell-header__box">
        <span className="spell-header__label">Spellcasting Ability</span>
        {editMode ? (
          <select className="dnd-field spell-header__select" value={ability}
            onChange={e => onUpdate({ spellcasting: { ...spellcasting, ability: e.target.value } })}>
            <option value="STR">STR</option>
            <option value="DEX">DEX</option>
            <option value="CON">CON</option>
            <option value="INT">INT</option>
            <option value="WIS">WIS</option>
            <option value="CHA">CHA</option>
          </select>
        ) : (
          <span className="spell-header__value">{ability}</span>
        )}
      </div>
      <div className="spell-header__box">
        <span className="spell-header__label">Spell Save DC</span>
        <span className="spell-header__value">{saveDC}</span>
      </div>
      <div className="spell-header__box">
        <span className="spell-header__label">Spell Attack</span>
        <span className="spell-header__value">{formatMod(atkBonus)}</span>
      </div>
    </div>
  );
}
