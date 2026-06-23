import { useEffect, useRef } from 'react';
import { Skull, Ghost, Sparkles, Gem } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';
import { sneakAttackDice } from '../../classProgression';

/**
 * Phantom — Combat tab. Death is the theme: Wails from the Grave is a PB-sized pool
 * whose necrotic echo scales with your Sneak Attack dice; Soul Trinkets are a hoard
 * (cap = PB) you bank from dying foes and burn to fuel Wails or Ghost Walk; Ghost
 * Walk is a phase-shift toggle. A ghostly proficiency rides along too. Accent: rogue.
 */
export default function PhantomBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const wailDmg = Math.ceil(sneakAttackDice(level) / 2);
  const bothTargets = level >= 17;
  const prevPbRef = useRef(null);

  const wails = cf.wailsFromGrave || { max: pb, current: pb };
  const trinkets = cf.soulTrinkets ?? 0;
  const hasTokens = level >= 9;
  const hasGhostWalk = level >= 13;
  const ghostActive = cf.ghostWalkActive || false;
  const ghostUsed = cf.ghostWalkUsed || false;

  // Wails pool tracks the proficiency bonus.
  useEffect(() => {
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const r = cf.wailsFromGrave;
    if (!r || r.max !== pb) {
      const grew = prev !== null && pb > prev;
      const current = r ? (grew ? Math.min((r.current || 0) + (pb - (r.max || 0)), pb) : Math.min(r.current ?? pb, pb)) : pb;
      onUpdate({ classFeature: { ...cf, wailsFromGrave: { max: pb, current } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb]);

  const spendWail = () => { if (wails.current > 0) onUpdate({ classFeature: { ...cf, wailsFromGrave: { ...wails, current: wails.current - 1 } } }); };
  const restoreWail = () => { if (wails.current < wails.max) onUpdate({ classFeature: { ...cf, wailsFromGrave: { ...wails, current: wails.current + 1 } } }); };
  const stepTrinket = (d) => {
    const next = Math.max(0, Math.min(pb, trinkets + d));
    if (next !== trinkets) onUpdate({ classFeature: { ...cf, soulTrinkets: next } });
  };
  const phaseIn = () => {
    if (!ghostUsed) onUpdate({ classFeature: { ...cf, ghostWalkActive: true, ghostWalkUsed: true } });
    else if (trinkets > 0) onUpdate({ classFeature: { ...cf, ghostWalkActive: true, soulTrinkets: trinkets - 1 } });
  };
  const phaseOut = () => onUpdate({ classFeature: { ...cf, ghostWalkActive: false } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Wails from the Grave */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Skull size={13} /> Wails from the Grave</h4>
          <span className="dnd-warmagic__uses">{wails.current}/{wails.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: wails.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < wails.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">After Sneak Attack, a 2nd creature within 30 ft takes <strong>{wailDmg}d6 necrotic</strong>{bothTargets && <> (both creatures)</>}. Refills on a long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restoreWail} disabled={wails.current >= wails.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendWail} disabled={wails.current <= 0}>Wail</button>
          </div>
        </div>
      </div>

      {/* Soul Trinkets */}
      {hasTokens && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Gem size={13} /> Soul Trinkets</h4>
            <span className="dnd-warmagic__uses">{trinkets}/{pb}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Bank one (reaction) when a creature dies within 30 ft. {trinkets > 0 ? <strong>Advantage on death &amp; CON saves.</strong> : 'Hold one for advantage on death &amp; CON saves.'} Burn to fuel Wails or Ghost Walk.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepTrinket(-1)} disabled={trinkets <= 0}>−</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepTrinket(1)} disabled={trinkets >= pb}>+</button>
            </div>
          </div>
        </div>
      )}

      {/* Ghost Walk */}
      {hasGhostWalk && (
        <div className={`dnd-warmagic__section ${ghostActive ? 'dnd-inq--reading' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Ghost size={13} /> Ghost Walk</h4>
            <span className="dnd-warmagic__uses">{ghostActive ? 'PHASED' : ghostUsed ? 'spent' : 'ready'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Spectral form 10 min: fly 10 ft (hover), attacks against you have disadvantage, move through matter. Reuse needs a long rest or a soul trinket.</span>
            <div className="dnd-warmagic__btns">
              {ghostActive
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={phaseOut}>Return</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={phaseIn} disabled={ghostUsed && trinkets <= 0}>{ghostUsed ? 'Phase (−1 trinket)' : 'Phase'}</button>}
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Sparkles size={12} />
          <span><strong>Whispers of the Dead</strong> — after each rest, gain one skill or tool proficiency of your choice:&nbsp;
            <input
              className="dnd-field dnd-phantom__prof"
              value={cf.whisperProf || ''}
              placeholder="proficiency"
              onChange={e => onUpdate({ classFeature: { ...cf, whisperProf: e.target.value } })}
            />
          </span>
        </div>
        {bothTargets && (
          <div className="dnd-warmagic__reminder">
            <Skull size={12} />
            <span><strong>Death's Friend</strong> — Wails hits both creatures, and a soul trinket appears after a long rest if you have none.</span>
          </div>
        )}
      </div>
    </div>
  );
}
