import { SKILLS, abilityMod, formatMod, proficiencyBonus } from '../dndUtils';

const ABILITY_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_LABELS = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

// Group skills by ability
function groupByAbility() {
  const groups = {};
  for (const ab of ABILITY_ORDER) groups[ab] = [];
  for (const skill of SKILLS) {
    groups[skill.ability].push(skill);
  }
  return groups;
}

const GROUPED = groupByAbility();

export default function SkillList({ abilities, skillProficiencies, skillExpertise, level, editMode, onUpdate }) {
  const profBonus = proficiencyBonus(level);

  const toggleProficiency = (skillName) => {
    if (!editMode) return;
    const isProf = skillProficiencies.includes(skillName);
    const isExpert = skillExpertise.includes(skillName);

    if (!isProf) {
      onUpdate({ skillProficiencies: [...skillProficiencies, skillName] });
    } else if (!isExpert) {
      onUpdate({ skillExpertise: [...skillExpertise, skillName] });
    } else {
      onUpdate({
        skillProficiencies: skillProficiencies.filter(s => s !== skillName),
        skillExpertise: skillExpertise.filter(s => s !== skillName),
      });
    }
  };

  const renderSkill = (skill) => {
    const isProf = skillProficiencies.includes(skill.name);
    const isExpert = skillExpertise.includes(skill.name);
    const base = abilityMod(abilities[skill.ability] || 10);
    const mod = isExpert ? base + profBonus * 2 : isProf ? base + profBonus : base;

    return (
      <div key={skill.name} className="dnd-skills__row">
        <button
          className={`dnd-skills__prof ${isExpert ? 'dnd-skills__prof--expert' : isProf ? 'dnd-skills__prof--proficient' : ''}`}
          onClick={() => toggleProficiency(skill.name)}
          title={editMode ? 'Click to cycle: none > proficient > expertise > none' : undefined}
        >
          {isExpert ? '\u25C9' : isProf ? '\u25CF' : '\u25CB'}
        </button>
        <span className="dnd-skills__mod">{formatMod(mod)}</span>
        <span className="dnd-skills__name">{skill.name}</span>
      </div>
    );
  };

  return (
    <div className="dnd-skills">
      <h3 className="dnd-section-title">Skills</h3>
      <div className="dnd-skills__groups">
        {ABILITY_ORDER.map(ab => {
          const skills = GROUPED[ab];
          if (skills.length === 0) return null;
          const abMod = abilityMod(abilities[ab] || 10);
          return (
            <div key={ab} className="dnd-skills__group">
              <div className="dnd-skills__group-header">
                <span className="dnd-skills__group-name">{ABILITY_LABELS[ab]}</span>
                <span className="dnd-skills__group-mod">{formatMod(abMod)}</span>
              </div>
              {skills.map(renderSkill)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
