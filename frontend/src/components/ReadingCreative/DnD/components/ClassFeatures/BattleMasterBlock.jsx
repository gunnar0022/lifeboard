import { useEffect, useRef } from 'react';
import { Swords, Eye, Zap } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';
import { MANEUVER_LIST, superiorityDie, superiorityDiceCount } from '../../classProgression';

/**
 * Battle Master — Combat tab. Superiority dice are the engine: a shared pool of dN
 * (d8 → d10 → d12) that recharges on a short rest, with the count growing at 7th/15th.
 * The maneuver *selection* lives in the Features tab; here we surface the chosen
 * loadout as quick-reference cards (colour-coded by how they're used) plus the live
 * maneuver save DC. Relentless / Know Your Enemy ride below as reminders.
 */
export default function BattleMasterBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const strMod = abilityMod(abilities.STR || 10);
  const dexMod = abilityMod(abilities.DEX || 10);
  const saveDC = 8 + pb + Math.max(strMod, dexMod);
  const die = superiorityDie(level);
  const count = superiorityDiceCount(level);
  const prevCountRef = useRef(null);

  const dice = cf.superiorityDice || { max: count, current: count, die };
  const known = cf.knownManeuvers || [];

  // Keep the pool size + die in sync with level; grant new die(s) when the count grows.
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    const d = cf.superiorityDice;
    if (!d || d.max !== count || d.die !== die) {
      const grew = prev !== null && count > prev;
      const current = d
        ? (grew ? Math.min((d.current || 0) + (count - (d.max || 0)), count) : Math.min(d.current ?? count, count))
        : count;
      onUpdate({ classFeature: { ...cf, superiorityDice: { max: count, current, die } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, die]);

  const spend = () => { if (dice.current > 0) onUpdate({ classFeature: { ...cf, superiorityDice: { ...dice, current: dice.current - 1 } } }); };
  const restore = () => { if (dice.current < dice.max) onUpdate({ classFeature: { ...cf, superiorityDice: { ...dice, current: dice.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Superiority dice pool */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Swords size={13} /> Superiority Dice ({die})</h4>
          <span className="dnd-warmagic__uses">{dice.current}/{dice.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: dice.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < dice.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Fuel one maneuver per attack · save <strong>DC {saveDC}</strong> (STR/DEX) · recharge on a short rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restore} disabled={dice.current >= dice.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spend} disabled={dice.current <= 0}>Spend</button>
          </div>
        </div>
      </div>

      {/* Chosen maneuvers */}
      <div className="dnd-bm__maneuvers">
        {known.length === 0 && (
          <p className="dnd-bm__empty">No maneuvers chosen — pick them in the Features tab.</p>
        )}
        {known.map(name => {
          const m = MANEUVER_LIST.find(x => x.name === name);
          if (!m) return null;
          return (
            <div key={name} className="dnd-bm__maneuver">
              <div className="dnd-bm__maneuver-head">
                <span className="dnd-bm__maneuver-name">{name}</span>
                <span className={`dnd-bm__tag dnd-bm__tag--${m.type}`}>{m.type}</span>
              </div>
              <p className="dnd-bm__maneuver-desc">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Eye size={12} />
            <span><strong>Know Your Enemy</strong> — study a creature 1 min (out of combat) to compare two traits (STR/DEX/CON/AC/HP/levels).</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Relentless</strong> — if you roll initiative with no superiority dice left, regain 1.</span>
          </div>
        )}
      </div>
    </div>
  );
}
