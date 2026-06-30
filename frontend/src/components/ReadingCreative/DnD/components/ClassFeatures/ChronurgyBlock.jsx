import { useEffect, useRef } from 'react';
import { RotateCcw, Snowflake, Gem, Infinity as InfinityIcon, Zap, AlertTriangle } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Chronurgy Magic — Combat tab. A console of time-meddling charges: Chronal Shift
 * (force a reroll, twice/long rest), Momentary Stasis (freeze a creature, INT-mod
 * uses), the Arcane Abeyance gray bead (a spell frozen mid-cast, short-rest
 * recharge), and Convergent Future — the dread reaction that rewrites a die at
 * the cost of exhaustion. Temporal Awareness rides along as an initiative note.
 */
export default function ChronurgyBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const stasisMax = Math.max(1, intMod);

  const shift = cf.chronalShift || { current: 2, max: 2 };
  const stasis = cf.momentaryStasis || { current: stasisMax, max: stasisMax };
  const abeyanceUsed = !!cf.abeyanceUsed;
  const exhaustion = character.exhaustionLevel || 0;
  const prevStasisRef = useRef(null);

  // Chronal Shift is a flat 2 uses; seed it if missing.
  useEffect(() => {
    if (!cf.chronalShift) onUpdate({ classFeature: { ...cf, chronalShift: { current: 2, max: 2 } } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Momentary Stasis pool tracks the Intelligence modifier.
  useEffect(() => {
    if (level < 6) return;
    const prev = prevStasisRef.current;
    prevStasisRef.current = stasisMax;
    const s = cf.momentaryStasis;
    if (!s || s.max !== stasisMax) {
      const grew = prev !== null && stasisMax > prev;
      const current = s ? (grew ? Math.min((s.current || 0) + (stasisMax - (s.max || 0)), stasisMax) : Math.min(s.current ?? stasisMax, stasisMax)) : stasisMax;
      onUpdate({ classFeature: { ...cf, momentaryStasis: { current, max: stasisMax } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stasisMax, level]);

  const spendShift = () => { if (shift.current > 0) onUpdate({ classFeature: { ...cf, chronalShift: { ...shift, current: shift.current - 1 } } }); };
  const gainShift = () => { if (shift.current < shift.max) onUpdate({ classFeature: { ...cf, chronalShift: { ...shift, current: shift.current + 1 } } }); };
  const spendStasis = () => { if (stasis.current > 0) onUpdate({ classFeature: { ...cf, momentaryStasis: { ...stasis, current: stasis.current - 1 } } }); };
  const gainStasis = () => { if (stasis.current < stasis.max) onUpdate({ classFeature: { ...cf, momentaryStasis: { ...stasis, current: stasis.current + 1 } } }); };
  const toggleAbeyance = () => onUpdate({ classFeature: { ...cf, abeyanceUsed: !abeyanceUsed } });
  const pullFuture = () => onUpdate({ exhaustionLevel: exhaustion + 1 });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Chronal Shift */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><RotateCcw size={13} /> Chronal Shift</h4>
          <span className="dnd-warmagic__uses">{shift.current}/{shift.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: shift.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < shift.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Reaction: force a reroll of an attack, check, or save (you/seen creature within 30 ft) after seeing the result.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={gainShift} disabled={shift.current >= shift.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendShift} disabled={shift.current <= 0}>Rewind</button>
          </div>
        </div>
      </div>

      {/* Momentary Stasis */}
      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Snowflake size={13} /> Momentary Stasis</h4>
            <span className="dnd-warmagic__uses">{stasis.current}/{stasis.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: stasis.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < stasis.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Action: a Large-or-smaller creature within 60 ft makes a CON save vs your DC or is incapacitated &amp; speed 0 until end of your next turn (or it takes damage).</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={gainStasis} disabled={stasis.current >= stasis.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendStasis} disabled={stasis.current <= 0}>Freeze</button>
            </div>
          </div>
        </div>
      )}

      {/* Arcane Abeyance — the gray bead */}
      {level >= 10 && (
        <div className={`dnd-bead ${abeyanceUsed ? 'dnd-bead--spent' : 'dnd-bead--ready'}`}>
          <div className="dnd-bead__orb"><Gem size={18} /></div>
          <div className="dnd-bead__body">
            <h4 className="dnd-bead__title">Arcane Abeyance</h4>
            <span className="dnd-bead__note">
              {abeyanceUsed
                ? 'Bead spent — recharges on a short or long rest.'
                : 'Freeze a spell (slot ≤ 4th) into a gray bead for 1 hour. A holder releases it as an action using your DC/attack.'}
            </span>
          </div>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={toggleAbeyance}>
            {abeyanceUsed ? 'Reset' : 'Condense'}
          </button>
        </div>
      )}

      {/* Convergent Future — the exhaustion gamble */}
      {level >= 14 && (
        <div className="dnd-convergent">
          <div className="dnd-convergent__head">
            <h4 className="dnd-convergent__title"><InfinityIcon size={14} /> Convergent Future</h4>
            <span className={`dnd-convergent__exh ${exhaustion > 0 ? 'dnd-convergent__exh--on' : ''}`}>
              <AlertTriangle size={11} /> Exhaustion {exhaustion}
            </span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction: ignore a d20 (you/seen creature within 60 ft) and set it to the minimum needed to succeed, or one less. Costs 1 level of exhaustion (long rest only).</span>
            <button className="dnd-warmagic__btn dnd-convergent__btn" onClick={pullFuture}>Pull Future</button>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Zap size={12} />
          <span><strong>Temporal Awareness</strong> — add <strong>+{intMod >= 0 ? intMod : 0}</strong> (INT) to your initiative rolls.</span>
        </div>
      </div>
    </div>
  );
}
