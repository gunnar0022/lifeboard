import { Swords, Repeat, Wand2 } from 'lucide-react';
import { bardicInspirationDie } from '../../classProgression';

/**
 * College of Valor — Combat tab. Valor has no resource of its own; Combat Inspiration
 * just gives the recipient of a Bardic Inspiration die a second use for it (weapon
 * damage or a reactive AC boost), so this block headlines the live die and surfaces
 * Extra Attack / Battle Magic as level-gated reminders. Accent: martial bronze.
 */
export default function ValorBlock({ character }) {
  const level = character.meta?.level || 3;
  const die = bardicInspirationDie(level);

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#c79a3e' }}>
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Swords size={13} /> Combat Inspiration</span>
          <span className="dnd-bardsub__die">{die}</span>
        </div>
        <p className="dnd-bardsub__note">
          A creature holding your Bardic Inspiration die can spend it to <strong>add {die} to a weapon damage roll</strong>, or — as a reaction to being attacked — <strong>add {die} to its AC</strong> against that attack (after the roll, before hit/miss is known).
        </p>
      </div>

      <div className="dnd-bardsub__reminders">
        {level >= 6 && (
          <div className="dnd-bardsub__reminder">
            <Repeat size={12} />
            <span><strong>Extra Attack</strong> — attack twice whenever you take the Attack action.</span>
          </div>
        )}
        {level >= 14 && (
          <div className="dnd-bardsub__reminder">
            <Wand2 size={12} />
            <span><strong>Battle Magic</strong> — when you cast a bard spell with your action, make one weapon attack as a bonus action.</span>
          </div>
        )}
      </div>
    </div>
  );
}
