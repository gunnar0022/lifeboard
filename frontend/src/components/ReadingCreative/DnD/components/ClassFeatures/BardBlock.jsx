import { useEffect, useRef } from 'react';
import { Music, Sparkles, Shield } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { bardicInspirationDie, songOfRestDie } from '../../classProgression';

/**
 * Bard — Combat tab. Bardic Inspiration is the live resource: uses scale to the
 * Charisma modifier, the die grows with level, and from 5th level (Font of
 * Inspiration) it recharges on a short rest. Song of Rest / Countercharm /
 * Magical Secrets are surfaced as level-gated reminders.
 */
export default function BardBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const max = Math.max(1, chaMod);
  const die = bardicInspirationDie(level);
  const shortRest = level >= 5; // Font of Inspiration
  const prevMaxRef = useRef(null);

  // Keep uses synced to the Charisma modifier; grant new use(s) when it rises.
  useEffect(() => {
    const prev = prevMaxRef.current;
    prevMaxRef.current = max;
    const cur = cf.currentUses;
    if (cf.maxUses !== max || cur == null) {
      const grew = prev !== null && max > prev;
      const currentUses = cur == null ? max
        : grew ? Math.min(cur + (max - (cf.maxUses || 0)), max) : Math.min(cur, max);
      onUpdate({ classFeature: { ...cf, maxUses: max, currentUses, dieDamage: die } });
    } else if (cf.dieDamage !== die) {
      onUpdate({ classFeature: { ...cf, dieDamage: die } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, die]);

  const currentUses = cf.currentUses ?? max;
  const spend = () => { if (currentUses > 0) onUpdate({ classFeature: { ...cf, currentUses: currentUses - 1 } }); };
  const restore = () => { if (currentUses < max) onUpdate({ classFeature: { ...cf, currentUses: currentUses + 1 } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-bard)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Music size={13} /> Bardic Inspiration ({die})</h4>
          <span className="dnd-warmagic__uses">{currentUses}/{max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < currentUses ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Bonus action: give a creature a {die} for a check, attack, or save. Recharges on a {shortRest ? 'short or long' : 'long'} rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restore} disabled={currentUses >= max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spend} disabled={currentUses <= 0}>Use</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Sparkles size={12} />
          <span><strong>Song of Rest</strong> — allies who spend Hit Dice on a short rest regain an extra <strong>1{songOfRestDie(level)}</strong> HP.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Countercharm</strong> — action: you and allies within 30 ft have advantage on saves vs. frightened/charmed until end of your next turn.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Magical Secrets</strong> — {level >= 18 ? 6 : level >= 14 ? 4 : 2} spells learned from any class (count against Spells Known).</span>
          </div>
        )}
      </div>
    </div>
  );
}
