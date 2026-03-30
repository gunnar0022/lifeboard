import { abilityMod, formatMod, proficiencyBonus } from '../dndUtils';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function SaveThrows({ abilities, saveProficiencies, level, editMode, onUpdate }) {
  const profBonus = proficiencyBonus(level);

  const toggleSave = (ab) => {
    if (!editMode) return;
    const isProf = saveProficiencies.includes(ab);
    if (isProf) {
      onUpdate({ saveProficiencies: saveProficiencies.filter(s => s !== ab) });
    } else {
      onUpdate({ saveProficiencies: [...saveProficiencies, ab] });
    }
  };

  return (
    <div className="dnd-saves">
      <h3 className="dnd-section-title">Saving Throws</h3>
      <div className="dnd-saves__grid">
        {ABILITIES.map(ab => {
          const isProf = saveProficiencies.includes(ab);
          const mod = abilityMod(abilities[ab] || 10) + (isProf ? profBonus : 0);
          return (
            <div key={ab} className="dnd-saves__cell">
              <button
                className={`dnd-saves__prof ${isProf ? 'dnd-saves__prof--active' : ''}`}
                onClick={() => toggleSave(ab)}
              >
                {isProf ? '\u25CF' : '\u25CB'}
              </button>
              <span className="dnd-saves__label">{ab}</span>
              <span className="dnd-saves__mod">{formatMod(mod)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
