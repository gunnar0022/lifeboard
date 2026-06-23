import { useEffect, useRef } from 'react';
import { Brain, Shield, Swords, Wind } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Psi Warrior — Combat tab. Psionic Energy dice are the engine: a pool sized to
 * twice your proficiency bonus, growing d6 → d8 → d10 → d12, refilling on a long
 * rest with a once-per-short-rest bonus-action regain. The powers it fuels read off
 * Intelligence live — Protective Field / Psionic Strike reductions and the Thrust DC.
 */
function psiDie(level) {
  if (level >= 17) return 'd12';
  if (level >= 11) return 'd10';
  if (level >= 5) return 'd8';
  return 'd6';
}

export default function PsiWarriorBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const intMod = abilityMod(character.abilities?.INT || 10);
  const cap = 2 * pb;
  const die = psiDie(level);
  const thrustDC = 8 + pb + intMod;
  const intStr = intMod >= 0 ? `+${intMod}` : `${intMod}`;
  const prevCapRef = useRef(null);

  const energy = cf.psionicEnergy || { max: cap, current: cap, die };
  const regainUsed = cf.psiRegainUsed || false;

  // Keep the pool sized to 2×PB and the die current; grant new dice when PB rises.
  useEffect(() => {
    const prev = prevCapRef.current;
    prevCapRef.current = cap;
    const e = cf.psionicEnergy;
    if (!e || e.max !== cap || e.die !== die) {
      const grew = prev !== null && cap > prev;
      const current = e
        ? (grew ? Math.min((e.current || 0) + (cap - (e.max || 0)), cap) : Math.min(e.current ?? cap, cap))
        : cap;
      onUpdate({ classFeature: { ...cf, psionicEnergy: { max: cap, current, die } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, die]);

  const spend = () => { if (energy.current > 0) onUpdate({ classFeature: { ...cf, psionicEnergy: { ...energy, current: energy.current - 1 } } }); };
  const regainOne = () => {
    if (regainUsed || energy.current >= energy.max) return;
    onUpdate({ classFeature: { ...cf, psionicEnergy: { ...energy, current: energy.current + 1 }, psiRegainUsed: true } });
  };
  const restore = () => { if (energy.current < energy.max) onUpdate({ classFeature: { ...cf, psionicEnergy: { ...energy, current: energy.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Psionic Energy pool */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Brain size={13} /> Psionic Energy ({die})</h4>
          <span className="dnd-warmagic__uses">{energy.current}/{energy.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: energy.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < energy.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Refills on a long rest. Bonus action to regain one die — once per short rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={regainOne} disabled={regainUsed || energy.current >= energy.max} title="Bonus-action regain (1/short rest)">↻</button>
            <button className="dnd-warmagic__btn" onClick={restore} disabled={energy.current >= energy.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spend} disabled={energy.current <= 0}>Spend</button>
          </div>
        </div>
      </div>

      {/* Powers */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Swords size={12} />
          <span><strong>Psionic Strike</strong> — once/turn after a weapon hit within 30 ft, spend a die for <strong>{die}{intStr}</strong> force damage.</span>
        </div>
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Shield size={12} />
          <span><strong>Protective Field</strong> — reaction: spend a die to reduce damage to a creature within 30 ft by <strong>{die}{intStr}</strong> (min 1).</span>
        </div>
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Wind size={12} />
            <span><strong>Telekinetic Thrust</strong> — on Psionic Strike damage, <strong>STR save DC {thrustDC}</strong> or prone / moved 10 ft. <em>Psi-Powered Leap</em>: fly 2× speed (1/short rest or a die).</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Brain size={12} />
            <span><strong>Guarded Mind</strong> — resistance to psychic damage; spend a die to shed charm/fright at the start of your turn.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Bulwark of Force</strong> — bonus action: half cover to {Math.max(1, intMod)} creature(s) within 30 ft for 1 min (1/long rest or a die).</span>
          </div>
        )}
        {level >= 18 && (
          <div className="dnd-warmagic__reminder">
            <Wind size={12} />
            <span><strong>Telekinetic Master</strong> — cast Telekinesis (INT, no components) and attack as a bonus action while concentrating (1/long rest or a die).</span>
          </div>
        )}
      </div>
    </div>
  );
}
