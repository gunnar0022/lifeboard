import { abilityMod, formatMod, proficiencyBonus, SKILLS } from '../dndUtils';

// Interleaved for 2-column grid: left column STR/DEX/CON, right column INT/WIS/CHA
const ABILITIES = ['STR', 'INT', 'DEX', 'WIS', 'CON', 'CHA'];
const ABILITY_NAMES = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

// Standard reading order for the build panel
const BUILD_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
// 5e point-buy cost table and budget
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUDGET = 27;
const RACIAL_MAX = 2; // any stat can be raised up to twice for racial reasons

// Group skills by ability
const SKILLS_BY_ABILITY = {};
ABILITIES.forEach(ab => { SKILLS_BY_ABILITY[ab] = []; });
SKILLS.forEach(s => { if (SKILLS_BY_ABILITY[s.ability]) SKILLS_BY_ABILITY[s.ability].push(s); });

// The three-layer build, derived from the final scores if not stored yet.
// Migration preserves totals: base = min(15, score), asi = max(0, score - 15).
function deriveBuild(character) {
  const stored = character.abilityBuild;
  const abilities = character.abilities || {};
  const base = {}, racial = {}, asi = {};
  BUILD_ORDER.forEach(ab => {
    if (stored) {
      base[ab] = stored.base?.[ab] ?? 10;
      racial[ab] = stored.racial?.[ab] ?? 0;
      asi[ab] = stored.asi?.[ab] ?? 0;
    } else {
      const s = abilities[ab] ?? 10;
      base[ab] = Math.min(15, s);
      racial[ab] = 0;
      asi[ab] = Math.max(0, s - 15);
    }
  });
  return { base, racial, asi };
}

function Stepper({ value, prefix = '', cost, onDec, onInc, decDisabled, incDisabled }) {
  return (
    <div className="dnd-build__stepper">
      <button onClick={onDec} disabled={decDisabled}>&minus;</button>
      <span className="dnd-build__value">{prefix}{value}{cost != null && <em className="dnd-build__cost">{cost}</em>}</span>
      <button onClick={onInc} disabled={incDisabled}>+</button>
    </div>
  );
}

// Edit-mode panel: point buy (base) + racial bonus + ASI/feat layers.
function AbilityBuildPanel({ character, onUpdate }) {
  const { base, racial, asi } = deriveBuild(character);
  const pointsUsed = BUILD_ORDER.reduce((sum, ab) => sum + (POINT_COST[base[ab]] ?? 0), 0);
  const remaining = POINT_BUDGET - pointsUsed;

  const commit = (next) => {
    const abilities = { ...(character.abilities || {}) };
    BUILD_ORDER.forEach(ab => {
      abilities[ab] = (next.base[ab] || 0) + (next.racial[ab] || 0) + (next.asi[ab] || 0);
    });
    onUpdate({ abilityBuild: next, abilities });
  };

  const setLayer = (layer, ab, val) => {
    const next = { base: { ...base }, racial: { ...racial }, asi: { ...asi } };
    next[layer][ab] = val;
    commit(next);
  };

  const changeBase = (ab, dir) => {
    const target = base[ab] + dir;
    if (target < 8 || target > 15) return;
    if (dir > 0) {
      const newUsed = pointsUsed - (POINT_COST[base[ab]] || 0) + (POINT_COST[target] || 0);
      if (newUsed > POINT_BUDGET) return;
    }
    setLayer('base', ab, target);
  };

  const canAffordInc = (ab) => {
    if (base[ab] >= 15) return false;
    const newUsed = pointsUsed - (POINT_COST[base[ab]] || 0) + (POINT_COST[base[ab] + 1] || 0);
    return newUsed <= POINT_BUDGET;
  };

  return (
    <div className="dnd-build">
      <div className="dnd-build__header">
        <span className="dnd-build__title">Ability Scores</span>
        <span className={`dnd-build__points ${remaining < 0 ? 'dnd-build__points--over' : ''}`}>
          Point Buy: {pointsUsed} / {POINT_BUDGET}
        </span>
      </div>
      <table className="dnd-build__table">
        <thead>
          <tr>
            <th></th><th>Base</th><th>Racial</th><th>ASI / Feat</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {BUILD_ORDER.map(ab => {
            const total = (base[ab] || 0) + (racial[ab] || 0) + (asi[ab] || 0);
            return (
              <tr key={ab}>
                <td className="dnd-build__ab">{ab}</td>
                <td>
                  <Stepper
                    value={base[ab]}
                    cost={`(${POINT_COST[base[ab]] ?? '–'})`}
                    onDec={() => changeBase(ab, -1)}
                    onInc={() => changeBase(ab, 1)}
                    decDisabled={base[ab] <= 8}
                    incDisabled={!canAffordInc(ab)}
                  />
                </td>
                <td>
                  <Stepper
                    value={racial[ab] || 0}
                    prefix="+"
                    onDec={() => setLayer('racial', ab, Math.max(0, (racial[ab] || 0) - 1))}
                    onInc={() => setLayer('racial', ab, Math.min(RACIAL_MAX, (racial[ab] || 0) + 1))}
                    decDisabled={(racial[ab] || 0) <= 0}
                    incDisabled={(racial[ab] || 0) >= RACIAL_MAX}
                  />
                </td>
                <td>
                  <Stepper
                    value={asi[ab] || 0}
                    prefix="+"
                    onDec={() => setLayer('asi', ab, Math.max(0, (asi[ab] || 0) - 1))}
                    onInc={() => setLayer('asi', ab, (asi[ab] || 0) + 1)}
                    decDisabled={(asi[ab] || 0) <= 0}
                  />
                </td>
                <td className="dnd-build__total">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="dnd-build__hint">
        Point buy: base scores 8–15 (27 points). Racial: up to +2 per ability. ASI / Feat: level-up boosts (no cap).
      </p>
    </div>
  );
}

export default function StatsTab({ character, editMode, onUpdate }) {
  const abilities = character.abilities || {};
  const level = character.meta?.level || 1;
  const profBonus = proficiencyBonus(level);
  const saveProficiencies = character.saveProficiencies || [];
  const skillProficiencies = character.skillProficiencies || [];
  const skillExpertise = character.skillExpertise || [];

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
      onUpdate({
        skillProficiencies: skillProficiencies.filter(s => s !== skillName),
        skillExpertise: skillExpertise.filter(s => s !== skillName),
      });
    } else if (isProf) {
      onUpdate({ skillExpertise: [...skillExpertise, skillName] });
    } else {
      onUpdate({ skillProficiencies: [...skillProficiencies, skillName] });
    }
  };

  return (
    <>
      {editMode && <AbilityBuildPanel character={character} onUpdate={onUpdate} />}
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
                  <span className="dnd-stats-tab__score">{score}</span>
                  <span className="dnd-stats-tab__mod">{formatMod(mod)}</span>
                </div>

                {/* Saving throw */}
                <div className="dnd-stats-tab__save" onClick={() => toggleSaveProf(ab)}>
                  <span className={`dnd-stats-tab__prof-dot ${isSaveProf ? 'dnd-stats-tab__prof-dot--active' : ''}`}>
                    {isSaveProf ? '●' : '○'}
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
                    const indicator = isExpert ? '◉' : isProf ? '●' : '○';

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
    </>
  );
}
