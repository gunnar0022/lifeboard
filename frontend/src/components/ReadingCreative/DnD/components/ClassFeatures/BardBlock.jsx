import { useEffect, useRef } from 'react';
import { Music, Sparkles, Shield, Drama, Dice5 } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { bardicInspirationDie, songOfRestDie } from '../../classProgression';

/**
 * Bard — Combat tab. Bardic Inspiration is the live resource: uses scale to the
 * Charisma modifier, the die grows with level, and from 5th level (Font of
 * Inspiration) it recharges on a short rest. The die headlines the card as a
 * struck token; Song of Rest / Countercharm / Magical Secrets / Jack of All
 * Trades ride below as level-gated flourishes.
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
    <div className="dnd-bard">
      {/* Bardic Inspiration — the headline resource */}
      <div className={`dnd-bard__inspiration ${currentUses > 0 ? 'dnd-bard__inspiration--charged' : ''}`}>
        <div className="dnd-bard__die" aria-hidden="true">{die}</div>
        <div className="dnd-bard__insp-body">
          <div className="dnd-bard__insp-head">
            <span className="dnd-bard__insp-title"><Music size={13} /> Bardic Inspiration</span>
            <span className="dnd-bard__uses">{currentUses}<span className="dnd-bard__uses-max">/{max}</span></span>
          </div>
          <div className="dnd-bard__pips">
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={`dnd-bard__pip ${i < currentUses ? 'dnd-bard__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-bard__insp-foot">
            <span className="dnd-bard__recharge">Bonus action · give a {die} for a check, attack, or save · recharges on a {shortRest ? 'short or long' : 'long'} rest.</span>
            <div className="dnd-bard__btns">
              <button className="dnd-bard__btn" onClick={restore} disabled={currentUses >= max} aria-label="Restore a use">+</button>
              <button className="dnd-bard__btn dnd-bard__btn--spend" onClick={spend} disabled={currentUses <= 0}>Inspire</button>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting flourishes */}
      <div className="dnd-bard__flourishes">
        <div className="dnd-bard__flourish">
          <Sparkles size={12} />
          <span><strong>Song of Rest</strong> — allies who spend Hit Dice on a short rest regain an extra <strong>1{songOfRestDie(level)}</strong> HP.</span>
        </div>
        <div className="dnd-bard__flourish">
          <Dice5 size={12} />
          <span><strong>Jack of All Trades</strong> — add half your proficiency to any ability check you're not already proficient in.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-bard__flourish">
            <Shield size={12} />
            <span><strong>Countercharm</strong> — action: you and allies within 30 ft gain advantage on saves vs. frightened/charmed until the end of your next turn.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-bard__flourish">
            <Drama size={12} />
            <span><strong>Magical Secrets</strong> — <strong>{level >= 18 ? 6 : level >= 14 ? 4 : 2}</strong> spells learned from any class (count against Spells Known).</span>
          </div>
        )}
      </div>
    </div>
  );
}
