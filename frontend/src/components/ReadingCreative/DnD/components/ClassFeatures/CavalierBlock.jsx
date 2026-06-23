import { useEffect, useRef } from 'react';
import { Crosshair, Shield, Anchor, Wind } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Cavalier — Combat tab. Two ability-sized pools refill on a long rest: Unwavering
 * Mark's punishing strike (uses = STR mod, extra damage = half fighter level) and
 * Warding Maneuver's 1d8 ward (uses = CON mod). Hold the Line / Ferocious Charger /
 * Vigilant Defender ride below, with the charger's save DC computed live.
 */
export default function CavalierBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const strMod = abilityMod(abilities.STR || 10);
  const conMod = abilityMod(abilities.CON || 10);
  const markCap = Math.max(1, strMod);
  const wardCap = Math.max(1, conMod);
  const markDamage = Math.floor(level / 2);
  const chargerDC = 8 + pb + strMod;
  const hasWarding = level >= 7;
  const prevRef = useRef({ mark: null, ward: null });

  const mark = cf.unwaveringMark || { max: markCap, current: markCap };
  const ward = cf.wardingManeuver || { max: wardCap, current: wardCap };

  // Keep both pools synced to their ability modifier; grant new use(s) on a rise.
  useEffect(() => {
    const updates = {};
    const sync = (key, cap, prevKey) => {
      const prev = prevRef.current[prevKey];
      prevRef.current[prevKey] = cap;
      const r = cf[key];
      if (!r || r.max !== cap) {
        const grew = prev !== null && cap > prev;
        updates[key] = {
          max: cap,
          current: r ? (grew ? Math.min((r.current || 0) + (cap - (r.max || 0)), cap) : Math.min(r.current ?? cap, cap)) : cap,
        };
      }
    };
    sync('unwaveringMark', markCap, 'mark');
    if (hasWarding) sync('wardingManeuver', wardCap, 'ward');
    if (Object.keys(updates).length) onUpdate({ classFeature: { ...cf, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markCap, wardCap, hasWarding]);

  const spend = (key, r) => { if (r.current > 0) onUpdate({ classFeature: { ...cf, [key]: { ...r, current: r.current - 1 } } }); };
  const restore = (key, r) => { if (r.current < r.max) onUpdate({ classFeature: { ...cf, [key]: { ...r, current: r.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Unwavering Mark */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Crosshair size={13} /> Unwavering Mark</h4>
          <span className="dnd-warmagic__uses">{mark.current}/{mark.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: mark.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < mark.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Mark on a melee hit; bonus-action punish strike has advantage and deals <strong>+{markDamage}</strong> damage. Recharge on a long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => restore('unwaveringMark', mark)} disabled={mark.current >= mark.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend('unwaveringMark', mark)} disabled={mark.current <= 0}>Strike</button>
          </div>
        </div>
      </div>

      {/* Warding Maneuver */}
      {hasWarding && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Shield size={13} /> Warding Maneuver</h4>
            <span className="dnd-warmagic__uses">{ward.current}/{ward.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: ward.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < ward.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction: add <strong>1d8</strong> to AC for you or an ally within 5 ft; resistance to the damage if it still hits. Recharge on a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => restore('wardingManeuver', ward)} disabled={ward.current >= ward.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend('wardingManeuver', ward)} disabled={ward.current <= 0}>Ward</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Anchor size={12} />
            <span><strong>Hold the Line</strong> — opportunity attacks when foes move 5+ ft in reach; a hit drops their speed to 0 this turn.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Wind size={12} />
            <span><strong>Ferocious Charger</strong> — move 10+ ft straight then hit: <strong>STR save DC {chargerDC}</strong> or prone (once per turn).</span>
          </div>
        )}
        {level >= 18 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Vigilant Defender</strong> — a bonus opportunity-attack reaction once on every other creature's turn.</span>
          </div>
        )}
      </div>
    </div>
  );
}
