import { BookOpen, Scissors, Sparkles, Target } from 'lucide-react';
import { bardicInspirationDie } from '../../classProgression';

/**
 * College of Lore — Combat tab. Lore has no resource of its own: its teeth (Cutting
 * Words, Peerless Skill) are paid for with Bardic Inspiration dice tracked on the
 * base Bard card. So this block headlines the current die and the two ways to spend
 * it, with the scholarly passives (Bonus Proficiencies, Additional Magical Secrets)
 * as reminders. Accent: scholar's violet.
 */
export default function LoreBlock({ character }) {
  const level = character.meta?.level || 3;
  const cf = character.classFeature || {};
  const die = bardicInspirationDie(level);
  const inspLeft = cf.currentUses ?? 0;

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#9b6dd6' }}>
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Scissors size={13} /> Cutting Words</span>
          <span className="dnd-bardsub__die">{die}</span>
        </div>
        <p className="dnd-bardsub__note">
          Reaction: when a creature within 60 ft makes an attack, ability check, or damage roll, spend a Bardic Inspiration die and <strong>subtract it</strong> from their roll. Decide after they roll. Immune if it can't hear you.
        </p>
        <span className="dnd-bardsub__hint">{inspLeft} inspiration die{inspLeft === 1 ? '' : 's'} left to spend</span>
      </div>

      {level >= 14 && (
        <div className="dnd-bardsub__card">
          <div className="dnd-bardsub__head">
            <span className="dnd-bardsub__title"><Target size={13} /> Peerless Skill</span>
            <span className="dnd-bardsub__badge">Lvl 14</span>
          </div>
          <p className="dnd-bardsub__note">Spend a Bardic Inspiration die to <strong>add {die}</strong> to one of your ability checks — even after you roll, before the result is known.</p>
        </div>
      )}

      <div className="dnd-bardsub__reminders">
        <div className="dnd-bardsub__reminder">
          <BookOpen size={12} />
          <span><strong>Bonus Proficiencies</strong> — proficiency in three skills of your choice.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-bardsub__reminder">
            <Sparkles size={12} />
            <span><strong>Additional Magical Secrets</strong> — two spells from any class, free of your Spells Known.</span>
          </div>
        )}
      </div>
    </div>
  );
}
