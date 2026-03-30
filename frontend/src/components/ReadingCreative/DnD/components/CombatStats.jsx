import { abilityMod, formatMod } from '../dndUtils';

export default function CombatStats({ combat, abilities, editMode, onUpdate }) {
  const initiative = abilityMod(abilities.DEX || 10);
  const hp = combat.hpCurrent;
  const max = combat.hpMax;
  const pct = max > 0 ? (hp / max) * 100 : 0;
  const barColor = pct > 60 ? 'var(--dnd-hp-healthy)' : pct > 25 ? 'var(--dnd-hp-wounded)' : 'var(--dnd-hp-critical)';

  const adjustHp = (delta) => {
    const next = Math.max(0, Math.min(max + combat.hpTemp, hp + delta));
    onUpdate({ combat: { ...combat, hpCurrent: next } });
  };

  const adjustHitDice = (delta) => {
    const next = Math.max(0, Math.min(combat.hitDiceRemaining + delta, Math.ceil(combat.hitDiceType ? (combat.hpMax > 0 ? Math.ceil(max / combat.hitDiceType) : 1) : 1)));
    // Simpler: just clamp to 0..level (we approximate with hitDiceRemaining max)
    const clamped = Math.max(0, combat.hitDiceRemaining + delta);
    onUpdate({ combat: { ...combat, hitDiceRemaining: clamped } });
  };

  return (
    <div className="dnd-combat">
      {/* AC */}
      <div className="dnd-combat__box">
        <span className="dnd-combat__box-label">AC</span>
        {editMode ? (
          <>
            <input type="number" className="dnd-combat__input" value={combat.ac}
              onChange={e => onUpdate({ combat: { ...combat, ac: parseInt(e.target.value) || 0 } })} />
            <input type="text" className="dnd-combat__input dnd-combat__input--wide" placeholder="Source"
              value={combat.acSource || ''} onChange={e => onUpdate({ combat: { ...combat, acSource: e.target.value } })} />
          </>
        ) : (
          <>
            <span className="dnd-combat__big-num">{combat.ac}</span>
            {combat.acSource && <span className="dnd-combat__sub">{combat.acSource}</span>}
          </>
        )}
      </div>

      {/* HP */}
      <div className="dnd-combat__box dnd-combat__box--hp">
        <span className="dnd-combat__box-label">HP</span>
        <div className="dnd-combat__hp-display">
          <span className="dnd-combat__big-num">{hp}</span>
          <span className="dnd-combat__hp-sep">/</span>
          {editMode ? (
            <input type="number" className="dnd-combat__input" value={max}
              onChange={e => onUpdate({ combat: { ...combat, hpMax: parseInt(e.target.value) || 1 } })} />
          ) : (
            <span className="dnd-combat__hp-max">{max}</span>
          )}
        </div>
        <div className="dnd-combat__hp-bar">
          <div className="dnd-combat__hp-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
        </div>
        <div className="dnd-combat__hp-btns">
          <button onClick={() => adjustHp(-5)}>-5</button>
          <button onClick={() => adjustHp(-1)}>-1</button>
          <button onClick={() => adjustHp(1)}>+1</button>
          <button onClick={() => adjustHp(5)}>+5</button>
        </div>
        <div className="dnd-combat__temp-hp">
          <span>Temp</span>
          <input type="number" className="dnd-combat__input dnd-combat__input--sm"
            value={combat.hpTemp || 0}
            onChange={e => onUpdate({ combat: { ...combat, hpTemp: parseInt(e.target.value) || 0 } })} />
        </div>
      </div>

      {/* Initiative */}
      <div className="dnd-combat__box">
        <span className="dnd-combat__box-label">INIT</span>
        <span className="dnd-combat__big-num">{formatMod(initiative)}</span>
      </div>

      {/* Hit Dice */}
      <div className="dnd-combat__box">
        <span className="dnd-combat__box-label">HIT DICE</span>
        {editMode ? (
          <>
            <input type="number" className="dnd-combat__input dnd-combat__input--sm"
              value={combat.hitDiceRemaining}
              onChange={e => onUpdate({ combat: { ...combat, hitDiceRemaining: parseInt(e.target.value) || 0 } })} />
            <span className="dnd-combat__sub">d</span>
            <input type="number" className="dnd-combat__input dnd-combat__input--sm"
              value={combat.hitDiceType}
              onChange={e => onUpdate({ combat: { ...combat, hitDiceType: parseInt(e.target.value) || 8 } })} />
          </>
        ) : (
          <>
            <span className="dnd-combat__big-num">{combat.hitDiceRemaining}</span>
            <span className="dnd-combat__sub">d{combat.hitDiceType}</span>
            <button className="dnd-combat__spend-btn" onClick={() => adjustHitDice(-1)}
              disabled={combat.hitDiceRemaining <= 0}>Spend</button>
          </>
        )}
      </div>

      {/* Death Saves */}
      <div className="dnd-combat__box">
        <span className="dnd-combat__box-label">DEATH SAVES</span>
        <div className="dnd-combat__death-saves">
          <div className="dnd-combat__death-row">
            <span className="dnd-combat__death-label" style={{ color: 'var(--dnd-positive)' }}>S</span>
            {[0, 1, 2].map(i => (
              <button key={`s${i}`}
                className={`dnd-combat__death-dot ${i < (combat.deathSaves?.successes || 0) ? 'dnd-combat__death-dot--success' : ''}`}
                onClick={() => {
                  const cur = combat.deathSaves?.successes || 0;
                  const next = i < cur ? i : i + 1;
                  onUpdate({ combat: { ...combat, deathSaves: { ...combat.deathSaves, successes: Math.min(3, next) } } });
                }}
              />
            ))}
          </div>
          <div className="dnd-combat__death-row">
            <span className="dnd-combat__death-label" style={{ color: 'var(--dnd-negative)' }}>F</span>
            {[0, 1, 2].map(i => (
              <button key={`f${i}`}
                className={`dnd-combat__death-dot ${i < (combat.deathSaves?.failures || 0) ? 'dnd-combat__death-dot--failure' : ''}`}
                onClick={() => {
                  const cur = combat.deathSaves?.failures || 0;
                  const next = i < cur ? i : i + 1;
                  onUpdate({ combat: { ...combat, deathSaves: { ...combat.deathSaves, failures: Math.min(3, next) } } });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
