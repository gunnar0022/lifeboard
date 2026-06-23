import { useEffect, useRef } from 'react';
import { MessageCircle, Languages, Sparkles, ShieldOff } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { bardicInspirationDie } from '../../classProgression';

/**
 * College of Eloquence — Combat tab. Two live resources beyond Bardic Inspiration:
 * Universal Speech (once per long rest) and Infectious Inspiration (14th), a pool
 * sized to the Charisma modifier that refills on a long rest. Unsettling Words spends
 * a base inspiration die; Silver Tongue / Unfailing Inspiration are passives.
 * Accent: silver-cyan.
 */
export default function EloquenceBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const cap = Math.max(1, chaMod);
  const die = bardicInspirationDie(level);
  const prevCapRef = useRef(null);

  const hasUniversal = level >= 6;
  const hasInfectious = level >= 14;
  const universalUsed = cf.universalSpeechUsed || false;
  const infectious = cf.infectiousInspiration || { maxUses: cap, currentUses: cap };

  // Keep the Infectious Inspiration pool synced to the Charisma modifier.
  useEffect(() => {
    if (!hasInfectious) return;
    const prev = prevCapRef.current;
    prevCapRef.current = cap;
    const r = cf.infectiousInspiration;
    if (!r || r.maxUses !== cap) {
      const grew = prev !== null && cap > prev;
      const currentUses = r
        ? (grew ? Math.min((r.currentUses || 0) + (cap - (r.maxUses || 0)), cap) : Math.min(r.currentUses ?? cap, cap))
        : cap;
      onUpdate({ classFeature: { ...cf, infectiousInspiration: { maxUses: cap, currentUses } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, hasInfectious]);

  const spendInfectious = () => {
    if (infectious.currentUses <= 0) return;
    onUpdate({ classFeature: { ...cf, infectiousInspiration: { ...infectious, currentUses: infectious.currentUses - 1 } } });
  };
  const restoreInfectious = () => {
    if (infectious.currentUses >= infectious.maxUses) return;
    onUpdate({ classFeature: { ...cf, infectiousInspiration: { ...infectious, currentUses: infectious.currentUses + 1 } } });
  };
  const useUniversal = () => onUpdate({ classFeature: { ...cf, universalSpeechUsed: true } });
  const resetUniversal = () => onUpdate({ classFeature: { ...cf, universalSpeechUsed: false } });

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#5fb3c9' }}>
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><MessageCircle size={13} /> Unsettling Words</span>
          <span className="dnd-bardsub__die">{die}</span>
        </div>
        <p className="dnd-bardsub__note">
          Bonus action: spend a Bardic Inspiration die and a creature within 60 ft must <strong>subtract {die}</strong> from its next saving throw before your next turn.
        </p>
      </div>

      {hasInfectious && (
        <div className="dnd-bardsub__card">
          <div className="dnd-bardsub__head">
            <span className="dnd-bardsub__title"><Sparkles size={13} /> Infectious Inspiration</span>
            <span className="dnd-bardsub__uses">{infectious.currentUses}/{infectious.maxUses}</span>
          </div>
          <div className="dnd-bardsub__pips">
            {Array.from({ length: infectious.maxUses }, (_, i) => (
              <span key={i} className={`dnd-bardsub__pip ${i < infectious.currentUses ? 'dnd-bardsub__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-bardsub__row">
            <span className="dnd-bardsub__note">Reaction when an ally succeeds with your die: hand a free {die} to another creature within 60 ft.</span>
            <div className="dnd-bardsub__btns">
              <button className="dnd-bardsub__btn" onClick={restoreInfectious} disabled={infectious.currentUses >= infectious.maxUses}>+</button>
              <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={spendInfectious} disabled={infectious.currentUses <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {hasUniversal && (
        <div className={`dnd-bardsub__card ${universalUsed ? 'dnd-bardsub__card--spent' : ''}`}>
          <div className="dnd-bardsub__head">
            <span className="dnd-bardsub__title"><Languages size={13} /> Universal Speech</span>
            <span className="dnd-bardsub__badge">1 / long rest</span>
          </div>
          <div className="dnd-bardsub__row">
            <span className="dnd-bardsub__note">Action: up to {cap} creature{cap === 1 ? '' : 's'} within 60 ft understand you for 1 hour. (Or spend a spell slot.)</span>
            <div className="dnd-bardsub__btns">
              {universalUsed && <button className="dnd-bardsub__btn" onClick={resetUniversal}>Reset</button>}
              <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={useUniversal} disabled={universalUsed}>{universalUsed ? 'Spent' : 'Speak'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-bardsub__reminders">
        <div className="dnd-bardsub__reminder">
          <MessageCircle size={12} />
          <span><strong>Silver Tongue</strong> — treat a d20 of 9 or lower as a 10 on Persuasion &amp; Deception checks.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-bardsub__reminder">
            <ShieldOff size={12} />
            <span><strong>Unfailing Inspiration</strong> — if a creature's roll fails with your die, it keeps the die.</span>
          </div>
        )}
      </div>
    </div>
  );
}
