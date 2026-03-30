import { abilityMod, formatMod, proficiencyBonus, passivePerception } from '../dndUtils';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function StatBlock({ character, editMode, onUpdate }) {
  const abilities = character.abilities || {};
  const combat = character.combat || {};
  const meta = character.meta || {};
  const level = meta.level || 1;
  const profBonus = proficiencyBonus(level);
  const initiative = abilityMod(abilities.DEX || 10);
  const passPerc = passivePerception(
    abilities, profBonus,
    (character.skillProficiencies || []).includes('Perception')
  );

  const hp = combat.hpCurrent ?? 0;
  const hpMax = combat.hpMax ?? 1;
  const hpPct = hpMax > 0 ? (hp / hpMax) * 100 : 0;
  const barColor = hpPct > 60 ? '#4a7a4a' : hpPct > 25 ? '#8a7a2a' : '#8b0000';

  const adjustHp = (delta) => {
    const next = Math.max(0, Math.min(hpMax + (combat.hpTemp || 0), hp + delta));
    onUpdate({ combat: { ...combat, hpCurrent: next } });
  };

  const handleCombat = (field, value) => {
    onUpdate({ combat: { ...combat, [field]: value } });
  };

  const handleMeta = (field, value) => {
    onUpdate({ meta: { ...meta, [field]: value } });
  };

  const handleAbility = (ab, value) => {
    const num = Math.min(30, Math.max(1, parseInt(value) || 1));
    onUpdate({ abilities: { ...abilities, [ab]: num } });
  };

  return (
    <div className="dnd-statblock">
      {/* Row 1: AC - HP (wide) - Hit Dice - Death Saves */}
      <div className="dnd-statblock__row">
        {/* AC */}
        <div className="dnd-statblock__cell">
          <span className="dnd-statblock__label">AC</span>
          {editMode ? (
            <input type="number" className="dnd-statblock__big-input" value={combat.ac || 10}
              onChange={e => handleCombat('ac', parseInt(e.target.value) || 0)} />
          ) : (
            <span className="dnd-statblock__big">{combat.ac || 10}</span>
          )}
          {editMode ? (
            <input className="dnd-statblock__sub-input" value={combat.acSource || ''} placeholder="Source"
              onChange={e => handleCombat('acSource', e.target.value)} />
          ) : (
            combat.acSource && <span className="dnd-statblock__sub">{combat.acSource}</span>
          )}
        </div>

        {/* HP (wide) */}
        <div className="dnd-statblock__cell dnd-statblock__cell--hp">
          <span className="dnd-statblock__label">HP</span>
          <div className="dnd-statblock__hp-row">
            <span className="dnd-statblock__big">{hp}</span>
            <span className="dnd-statblock__hp-sep">/</span>
            {editMode ? (
              <input type="number" className="dnd-statblock__big-input dnd-statblock__big-input--sm"
                value={hpMax} onChange={e => handleCombat('hpMax', parseInt(e.target.value) || 1)} />
            ) : (
              <span className="dnd-statblock__hp-max">{hpMax}</span>
            )}
          </div>
          <div className="dnd-statblock__hp-bar">
            <div className="dnd-statblock__hp-fill" style={{ width: `${Math.min(100, hpPct)}%`, background: barColor }} />
          </div>
          <div className="dnd-statblock__hp-btns">
            <button onClick={() => adjustHp(-5)}>-5</button>
            <button onClick={() => adjustHp(-1)}>-1</button>
            <button onClick={() => adjustHp(1)}>+1</button>
            <button onClick={() => adjustHp(5)}>+5</button>
            <span className="dnd-statblock__temp">Temp</span>
            <input type="number" className="dnd-statblock__temp-input"
              value={combat.hpTemp || 0}
              onChange={e => handleCombat('hpTemp', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Hit Dice */}
        <div className="dnd-statblock__cell">
          <span className="dnd-statblock__label">HIT DICE</span>
          {editMode ? (
            <div className="dnd-statblock__hd-edit">
              <input type="number" className="dnd-statblock__big-input dnd-statblock__big-input--sm"
                value={combat.hitDiceRemaining || 0}
                onChange={e => handleCombat('hitDiceRemaining', parseInt(e.target.value) || 0)} />
              <span className="dnd-statblock__sub">d</span>
              <input type="number" className="dnd-statblock__big-input dnd-statblock__big-input--sm"
                value={combat.hitDiceType || 8}
                onChange={e => handleCombat('hitDiceType', parseInt(e.target.value) || 8)} />
            </div>
          ) : (
            <>
              <span className="dnd-statblock__big">{combat.hitDiceRemaining || 0}</span>
              <span className="dnd-statblock__sub">d{combat.hitDiceType || 8}</span>
              <button className="dnd-statblock__spend" onClick={() => {
                if (combat.hitDiceRemaining > 0) handleCombat('hitDiceRemaining', combat.hitDiceRemaining - 1);
              }} disabled={(combat.hitDiceRemaining || 0) <= 0}>Spend</button>
            </>
          )}
        </div>

        {/* Death Saves */}
        <div className="dnd-statblock__cell">
          <span className="dnd-statblock__label">DEATH SAVES</span>
          <div className="dnd-statblock__death">
            <div className="dnd-statblock__death-row">
              <span className="dnd-statblock__death-lbl" style={{ color: '#4a7a4a' }}>S</span>
              {[0, 1, 2].map(i => (
                <button key={`s${i}`}
                  className={`dnd-statblock__dot ${i < (combat.deathSaves?.successes || 0) ? 'dnd-statblock__dot--success' : ''}`}
                  onClick={() => {
                    const cur = combat.deathSaves?.successes || 0;
                    const next = i < cur ? i : i + 1;
                    handleCombat('deathSaves', { ...combat.deathSaves, successes: Math.min(3, next) });
                  }} />
              ))}
            </div>
            <div className="dnd-statblock__death-row">
              <span className="dnd-statblock__death-lbl" style={{ color: '#8b0000' }}>F</span>
              {[0, 1, 2].map(i => (
                <button key={`f${i}`}
                  className={`dnd-statblock__dot ${i < (combat.deathSaves?.failures || 0) ? 'dnd-statblock__dot--failure' : ''}`}
                  onClick={() => {
                    const cur = combat.deathSaves?.failures || 0;
                    const next = i < cur ? i : i + 1;
                    handleCombat('deathSaves', { ...combat.deathSaves, failures: Math.min(3, next) });
                  }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Initiative - Prof - Speed - Size - Passive Perception - Body Type */}
      <div className="dnd-statblock__row">
        <div className="dnd-statblock__cell dnd-statblock__cell--sm">
          <span className="dnd-statblock__label">INIT</span>
          <span className="dnd-statblock__mid">{formatMod(initiative)}</span>
        </div>
        <div className="dnd-statblock__cell dnd-statblock__cell--sm">
          <span className="dnd-statblock__label">PROF</span>
          <span className="dnd-statblock__mid">+{profBonus}</span>
        </div>
        <div className="dnd-statblock__cell dnd-statblock__cell--sm">
          <span className="dnd-statblock__label">SPEED</span>
          {editMode ? (
            <input type="number" className="dnd-statblock__mid-input" value={meta.speed || 30}
              onChange={e => handleMeta('speed', parseInt(e.target.value) || 30)} />
          ) : (
            <span className="dnd-statblock__mid">{meta.speed || 30}ft</span>
          )}
        </div>
        <div className="dnd-statblock__cell dnd-statblock__cell--sm">
          <span className="dnd-statblock__label">SIZE</span>
          {editMode ? (
            <select className="dnd-statblock__mid-input" value={meta.size || 'Medium'}
              onChange={e => handleMeta('size', e.target.value)}>
              <option>Tiny</option><option>Small</option><option>Medium</option><option>Large</option>
            </select>
          ) : (
            <span className="dnd-statblock__mid">{meta.size || 'Med'}</span>
          )}
        </div>
        <div className="dnd-statblock__cell dnd-statblock__cell--sm">
          <span className="dnd-statblock__label">PERCEP</span>
          <span className="dnd-statblock__mid">{passPerc}</span>
        </div>
        <div className="dnd-statblock__cell dnd-statblock__cell--sm">
          <span className="dnd-statblock__label">BODY</span>
          {editMode ? (
            <input className="dnd-statblock__mid-input" value={meta.bodyType || ''} placeholder="e.g. Humanoid"
              onChange={e => handleMeta('bodyType', e.target.value)} />
          ) : (
            <span className="dnd-statblock__mid dnd-statblock__mid--text">{meta.bodyType || '---'}</span>
          )}
        </div>
      </div>

      {/* Row 3: Ability Scores */}
      <div className="dnd-statblock__row">
        {ABILITIES.map(ab => {
          const score = abilities[ab] || 10;
          const mod = abilityMod(score);
          return (
            <div key={ab} className="dnd-statblock__cell dnd-statblock__cell--sm">
              <span className="dnd-statblock__label">{ab}</span>
              <span className="dnd-statblock__mid">{formatMod(mod)}</span>
              {editMode ? (
                <input type="number" className="dnd-statblock__score-input" value={score}
                  min={1} max={30} onChange={e => handleAbility(ab, e.target.value)} />
              ) : (
                <span className="dnd-statblock__score">{score}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
