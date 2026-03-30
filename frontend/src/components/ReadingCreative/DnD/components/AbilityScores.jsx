import { abilityMod, formatMod } from '../dndUtils';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function AbilityScores({ abilities, editMode, onUpdate }) {
  const handleChange = (ability, value) => {
    const num = Math.min(30, Math.max(1, parseInt(value) || 1));
    onUpdate({ abilities: { ...abilities, [ability]: num } });
  };

  return (
    <div className="dnd-abilities">
      {ABILITIES.map(ab => {
        const score = abilities[ab] || 10;
        const mod = abilityMod(score);
        return (
          <div key={ab} className="dnd-abilities__cell">
            <span className="dnd-abilities__label">{ab}</span>
            <span className="dnd-abilities__mod">{formatMod(mod)}</span>
            {editMode ? (
              <input
                type="number"
                className="dnd-abilities__input"
                value={score}
                min={1}
                max={30}
                onChange={e => handleChange(ab, e.target.value)}
              />
            ) : (
              <span className="dnd-abilities__score">{score}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
