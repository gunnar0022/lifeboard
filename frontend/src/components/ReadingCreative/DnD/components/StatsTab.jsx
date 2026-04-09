import { abilityMod, formatMod, proficiencyBonus, SKILLS } from '../dndUtils';

// Interleaved for 2-column grid: left column STR/DEX/CON, right column INT/WIS/CHA
const ABILITIES = ['STR', 'INT', 'DEX', 'WIS', 'CON', 'CHA'];
const ABILITY_NAMES = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

// Group skills by ability
const SKILLS_BY_ABILITY = {};
ABILITIES.forEach(ab => { SKILLS_BY_ABILITY[ab] = []; });
SKILLS.forEach(s => { if (SKILLS_BY_ABILITY[s.ability]) SKILLS_BY_ABILITY[s.ability].push(s); });

export default function StatsTab({ character, editMode, onUpdate }) {
  const abilities = character.abilities || {};
  const level = character.meta?.level || 1;
  const profBonus = proficiencyBonus(level);
  const saveProficiencies = character.saveProficiencies || [];
  const skillProficiencies = character.skillProficiencies || [];
  const skillExpertise = character.skillExpertise || [];

  const handleAbilityChange = (ab, value) => {
    const val = Math.max(1, Math.min(30, parseInt(value) || 10));
    onUpdate({ abilities: { ...abilities, [ab]: val } });
  };

  const toggleSaveProf = (ab) => {
    if (!editMode) return;
    const isProf = saveProficiencies.includes(ab);
    onUpdate({
      saveProficiencies: isProf
        ? saveProficiencies.filter(s => s !== ab)
        : [...saveProficiencies, ab],
    });
  };

  const cycleSkillProf = (skillName) => {
    if (!editMode) return;
    const isProf = skillProficiencies.includes(skillName);
    const isExpert = skillExpertise.includes(skillName);

    if (isExpert) {
      // Expert → None
      onUpdate({
        skillProficiencies: skillProficiencies.filter(s => s !== skillName),
        skillExpertise: skillExpertise.filter(s => s !== skillName),
      });
    } else if (isProf) {
      // Prof → Expert
      onUpdate({ skillExpertise: [...skillExpertise, skillName] });
    } else {
      // None → Prof
      onUpdate({ skillProficiencies: [...skillProficiencies, skillName] });
    }
  };

  return (
    <div className="dnd-stats-tab">
      {ABILITIES.map(ab => {
        const score = abilities[ab] || 10;
        const mod = abilityMod(score);
        const isSaveProf = saveProficiencies.includes(ab);
        const saveMod = mod + (isSaveProf ? profBonus : 0);
        const skills = SKILLS_BY_ABILITY[ab] || [];

        return (
          <div key={ab} className="dnd-stats-tab__ability-group">
            {/* Ability header */}
            <div className="dnd-stats-tab__ability-header">
              <div className="dnd-stats-tab__ability-core">
                <span className="dnd-stats-tab__ability-name">{ABILITY_NAMES[ab]}</span>
                {editMode ? (
                  <input
                    type="number"
                    className="dnd-stats-tab__score-input"
                    value={score}
                    min={1} max={30}
                    onChange={e => handleAbilityChange(ab, e.target.value)}
                  />
                ) : (
                  <span className="dnd-stats-tab__score">{score}</span>
                )}
                <span className="dnd-stats-tab__mod">{formatMod(mod)}</span>
              </div>

              {/* Saving throw */}
              <div className="dnd-stats-tab__save" onClick={() => toggleSaveProf(ab)}>
                <span className={`dnd-stats-tab__prof-dot ${isSaveProf ? 'dnd-stats-tab__prof-dot--active' : ''}`}>
                  {isSaveProf ? '\u25CF' : '\u25CB'}
                </span>
                <span className="dnd-stats-tab__save-label">Save</span>
                <span className={`dnd-stats-tab__save-mod ${isSaveProf ? 'dnd-stats-tab__save-mod--prof' : ''}`}>
                  {formatMod(saveMod)}
                </span>
              </div>
            </div>

            {/* Skills under this ability */}
            {skills.length > 0 && (
              <div className="dnd-stats-tab__skills">
                {skills.map(skill => {
                  const isProf = skillProficiencies.includes(skill.name);
                  const isExpert = skillExpertise.includes(skill.name);
                  const skillMod = mod + (isExpert ? profBonus * 2 : isProf ? profBonus : 0);
                  const indicator = isExpert ? '\u25C9' : isProf ? '\u25CF' : '\u25CB';

                  return (
                    <div key={skill.name} className="dnd-stats-tab__skill-row" onClick={() => cycleSkillProf(skill.name)}>
                      <span className={`dnd-stats-tab__prof-dot ${isProf ? 'dnd-stats-tab__prof-dot--active' : ''} ${isExpert ? 'dnd-stats-tab__prof-dot--expert' : ''}`}>
                        {indicator}
                      </span>
                      <span className={`dnd-stats-tab__skill-mod ${isProf || isExpert ? 'dnd-stats-tab__skill-mod--prof' : ''}`}>
                        {formatMod(skillMod)}
                      </span>
                      <span className="dnd-stats-tab__skill-name">{skill.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
