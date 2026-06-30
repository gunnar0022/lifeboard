import { useEffect, useRef } from 'react';
import { Music, Wind, Gauge, Swords, Shield, Sparkles } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';

/**
 * Bladesinging — Combat tab. The Bladesong is a glowing 1-minute stance toggled
 * with a bonus action, fueled by a proficiency-bonus pool of daily uses. While
 * it sings, the live buffs (AC, speed, Acrobatics, concentration, and — at 14th
 * — Song of Victory damage) light up. Song of Defense rides along as a slot-burn
 * reaction reference.
 */
export default function BladesingingBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const pb = proficiencyBonus(level);
  const intBonus = Math.max(1, abilityMod(character.abilities?.INT || 10));

  const song = cf.bladesong || { active: false, uses: { current: pb, max: pb } };
  const uses = song.uses || { current: pb, max: pb };
  const active = !!song.active;
  const prevPbRef = useRef(null);

  // Keep the daily-use pool sized to the proficiency bonus; grant new uses as it grows.
  useEffect(() => {
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const u = cf.bladesong?.uses;
    if (!u || u.max !== pb) {
      const grew = prev !== null && pb > prev;
      const current = u ? (grew ? Math.min((u.current || 0) + (pb - (u.max || 0)), pb) : Math.min(u.current ?? pb, pb)) : pb;
      onUpdate({ classFeature: { ...cf, bladesong: { ...(cf.bladesong || {}), active: cf.bladesong?.active || false, uses: { current, max: pb } } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb]);

  const setSong = (next) => onUpdate({ classFeature: { ...cf, bladesong: { ...song, uses, ...next } } });
  const begin = () => { if (uses.current > 0 && !active) setSong({ active: true, uses: { ...uses, current: uses.current - 1 } }); };
  const dismiss = () => setSong({ active: false });
  const regain = () => { if (uses.current < uses.max) setSong({ uses: { ...uses, current: uses.current + 1 } }); };

  const hasVictory = level >= 14;
  const hasDefense = level >= 10;
  const hasExtraAttack = level >= 6;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-monk)' }}>
      {/* Bladesong stance */}
      <div className={`dnd-bladesong ${active ? 'dnd-bladesong--singing' : ''}`}>
        <div className="dnd-bladesong__head">
          <h4 className="dnd-bladesong__title"><Music size={14} /> Bladesong</h4>
          <span className="dnd-warmagic__uses">{uses.current}/{uses.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: uses.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < uses.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>

        <div className="dnd-bladesong__row">
          <span className={`dnd-bladesong__state ${active ? 'dnd-bladesong__state--on' : ''}`}>
            {active ? '♪ Singing — 1 minute' : 'Silent'}
          </span>
          <div className="dnd-warmagic__btns">
            {active
              ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={dismiss}>End Song</button>
              : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={begin} disabled={uses.current <= 0}>Begin (BA)</button>}
            <button className="dnd-warmagic__btn" onClick={regain} disabled={uses.current >= uses.max} title="Regain a use">+</button>
          </div>
        </div>

        {/* Live buffs while singing */}
        <div className={`dnd-bladesong__buffs ${active ? 'dnd-bladesong__buffs--on' : ''}`}>
          <span className="dnd-bladesong__buff"><Shield size={11} /> +{intBonus} AC</span>
          <span className="dnd-bladesong__buff"><Wind size={11} /> +10 ft speed</span>
          <span className="dnd-bladesong__buff"><Gauge size={11} /> Adv. Dex (Acrobatics)</span>
          <span className="dnd-bladesong__buff"><Sparkles size={11} /> +{intBonus} CON conc. saves</span>
          {hasVictory && <span className="dnd-bladesong__buff dnd-bladesong__buff--dmg"><Swords size={11} /> +{intBonus} melee dmg</span>}
        </div>
      </div>

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {hasExtraAttack && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Extra Attack</strong> — attack twice on your Attack action; you can replace one attack with a cantrip.</span>
          </div>
        )}
        {hasDefense && (
          <div className={`dnd-warmagic__reminder ${active ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Shield size={12} />
            <span><strong>Song of Defense</strong> — while singing, reaction: expend a spell slot to reduce damage by <strong>5 × slot level</strong> (L1 −5 · L2 −10 · L3 −15 · L4 −20 · L5 −25…).</span>
          </div>
        )}
      </div>
    </div>
  );
}
