import { useEffect, useRef } from 'react';
import { Search, Eye, Crosshair, Footprints } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Inquisitive — Combat tab. The signature is Insightful Fighting: a "read" you lock
 * onto a target so Sneak Attack lands without advantage — modelled as a toggle that
 * lights up (and, from 17th, advertises Eye for Weakness's +3d6). Unerring Eye is a
 * Wisdom-sized long-rest pool; the rest are detective passives. Accent: rogue.
 */
export default function InquisitiveBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const cap = Math.max(1, wisMod);
  const prevCapRef = useRef(null);

  const marked = cf.insightfulTarget || false;
  const hasUnerring = level >= 13;
  const hasWeakness = level >= 17;
  const unerring = cf.unerringEye || { max: cap, current: cap };

  useEffect(() => {
    if (!hasUnerring) return;
    const prev = prevCapRef.current;
    prevCapRef.current = cap;
    const r = cf.unerringEye;
    if (!r || r.max !== cap) {
      const grew = prev !== null && cap > prev;
      const current = r ? (grew ? Math.min((r.current || 0) + (cap - (r.max || 0)), cap) : Math.min(r.current ?? cap, cap)) : cap;
      onUpdate({ classFeature: { ...cf, unerringEye: { max: cap, current } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, hasUnerring]);

  const spendUnerring = () => { if (unerring.current > 0) onUpdate({ classFeature: { ...cf, unerringEye: { ...unerring, current: unerring.current - 1 } } }); };
  const restoreUnerring = () => { if (unerring.current < unerring.max) onUpdate({ classFeature: { ...cf, unerringEye: { ...unerring, current: unerring.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Insightful Fighting */}
      <div className={`dnd-warmagic__section ${marked ? 'dnd-inq--reading' : ''}`}>
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Crosshair size={13} /> Insightful Fighting</h4>
          <span className="dnd-warmagic__uses">{marked ? 'READING' : 'idle'}</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">
            Bonus action (Insight vs Deception): Sneak Attack without advantage for 1 min.
            {hasWeakness && marked && <> <strong>Eye for Weakness: +3d6</strong> Sneak Attack.</>}
          </span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, insightfulTarget: !marked } })}>{marked ? 'Clear' : 'Read'}</button>
          </div>
        </div>
      </div>

      {/* Unerring Eye */}
      {hasUnerring && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Eye size={13} /> Unerring Eye</h4>
            <span className="dnd-warmagic__uses">{unerring.current}/{unerring.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: unerring.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < unerring.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Action: sense illusions, disguises, and deceptions within 30 ft. Refills on a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={restoreUnerring} disabled={unerring.current >= unerring.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendUnerring} disabled={unerring.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Search size={12} />
          <span><strong>Eye for Detail</strong> — bonus action to make a Perception or Investigation check. <strong>Ear for Deceit</strong> treats Insight-vs-lie rolls of 7 or lower as 8.</span>
        </div>
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <Footprints size={12} />
            <span><strong>Steady Eye</strong> — advantage on Perception &amp; Investigation if you move no more than half your speed this turn.</span>
          </div>
        )}
      </div>
    </div>
  );
}
