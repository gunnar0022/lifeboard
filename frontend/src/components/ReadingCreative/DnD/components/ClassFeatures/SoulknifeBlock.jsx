import { useEffect, useRef } from 'react';
import { Brain, Swords, Sparkles, EyeOff, Zap } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Soulknife — Combat tab. Psionic Energy dice (2×PB, growing d6→d12) fuel everything,
 * with a once-per-short-rest bonus-action regain. Psychic Blades show their live
 * damage; Soul Blades, Psychic Veil (toggle), and Rend Mind (save DC) spend dice or a
 * long rest. Shares the psionic-die state keys with Psi Warrior. Accent: rogue.
 */
function psiDie(level) {
  if (level >= 17) return 'd12';
  if (level >= 11) return 'd10';
  if (level >= 5) return 'd8';
  return 'd6';
}

export default function SoulknifeBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const dexMod = abilityMod(character.abilities?.DEX || 10);
  const dexStr = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  const cap = 2 * pb;
  const die = psiDie(level);
  const rendDC = 8 + pb + dexMod;
  const prevCapRef = useRef(null);

  const energy = cf.psionicEnergy || { max: cap, current: cap, die };
  const regainUsed = cf.psiRegainUsed || false;
  const veilActive = cf.psychicVeilActive || false;
  const veilUsed = cf.psychicVeilUsed || false;
  const rendUsed = cf.rendMindUsed || false;

  useEffect(() => {
    const prev = prevCapRef.current;
    prevCapRef.current = cap;
    const e = cf.psionicEnergy;
    if (!e || e.max !== cap || e.die !== die) {
      const grew = prev !== null && cap > prev;
      const current = e ? (grew ? Math.min((e.current || 0) + (cap - (e.max || 0)), cap) : Math.min(e.current ?? cap, cap)) : cap;
      onUpdate({ classFeature: { ...cf, psionicEnergy: { max: cap, current, die } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, die]);

  const spendDice = (n, patch = {}) => {
    if (energy.current < n) return;
    onUpdate({ classFeature: { ...cf, psionicEnergy: { ...energy, current: energy.current - n }, ...patch } });
  };
  const regainOne = () => {
    if (regainUsed || energy.current >= energy.max) return;
    onUpdate({ classFeature: { ...cf, psionicEnergy: { ...energy, current: energy.current + 1 }, psiRegainUsed: true } });
  };
  const restore = () => { if (energy.current < energy.max) onUpdate({ classFeature: { ...cf, psionicEnergy: { ...energy, current: energy.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Psionic Energy */}
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
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spendDice(1)} disabled={energy.current <= 0}>Spend</button>
          </div>
        </div>
      </div>

      {/* Psychic Blades */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Swords size={13} /> Psychic Blades</h4>
        </div>
        <div className="dnd-warmagic__chips" style={{ display: 'flex', gap: '0.4rem', margin: '0.1rem 0 0.2rem' }}>
          <span className="dnd-warmagic__chip">Main 1d6{dexStr}</span>
          <span className="dnd-warmagic__chip">Bonus 1d4{dexStr}</span>
        </div>
        <p className="dnd-warmagic__note">Finesse, thrown (60 ft), psychic damage; vanishes after the attack. The bonus-action second blade needs a free hand.</p>
      </div>

      {/* Soul Blades / powers */}
      <div className="dnd-warmagic__reminders">
        {level >= 9 && (
          <>
            <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
              <Sparkles size={12} />
              <span><strong>Homing Strikes</strong> — on a Psychic Blade miss, add a die to the roll (expended if it hits).</span>
            </div>
            <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
              <Zap size={12} />
              <span><strong>Psychic Teleportation</strong> — bonus action: expend a die and teleport 10 × the roll feet.</span>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => spendDice(1)} disabled={energy.current <= 0}>−1</button>
            </div>
          </>
        )}
        {level >= 13 && (
          <div className={`dnd-warmagic__reminder ${veilActive ? 'dnd-warmagic__reminder--active' : ''} ${veilUsed && !veilActive ? 'dnd-archfey__spent' : ''}`}>
            <EyeOff size={12} />
            <span><strong>Psychic Veil</strong> — invisible 1 hr (ends when you deal damage or force a save). {veilActive ? 'Active.' : '1 / long rest or a die.'}</span>
            <div className="dnd-warmagic__btns">
              {veilActive
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, psychicVeilActive: false } })}>End</button>
                : !veilUsed
                  ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, psychicVeilActive: true, psychicVeilUsed: true } })}>Use</button>
                  : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spendDice(1, { psychicVeilActive: true })} disabled={energy.current <= 0}>−1 die</button>}
            </div>
          </div>
        )}
        {level >= 17 && (
          <div className={`dnd-warmagic__reminder ${rendUsed ? 'dnd-archfey__spent' : ''}`}>
            <Brain size={12} />
            <span><strong>Rend Mind</strong> — on a Psychic-Blade Sneak Attack, <strong>WIS save DC {rendDC}</strong> or stunned 1 min. {rendUsed ? '(spent)' : '1 / long rest or 3 dice.'}</span>
            <div className="dnd-warmagic__btns">
              {rendUsed
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spendDice(3)} disabled={energy.current < 3} title="Use again for 3 dice">−3 dice</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, rendMindUsed: true } })}>Use</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
