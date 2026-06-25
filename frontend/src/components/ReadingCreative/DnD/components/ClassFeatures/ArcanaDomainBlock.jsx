import { Wand2, ShieldOff, Sparkles, BookOpen, Star } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Arcana Domain — Combat tab. Channel Divinity: Arcane Abjuration headlines
 * (turn, then banish otherworldly creatures by a level-scaled CR), drawing from
 * the cleric's shared charges. Spell Breaker / Potent Spellcasting / Arcane
 * Mastery ride as reminders, in the cleric "healer" visual language.
 */
const ACCENT = 'var(--dnd-class-cleric)';

function banishCR(level) {
  if (level >= 17) return '4';
  if (level >= 14) return '3';
  if (level >= 11) return '2';
  if (level >= 8) return '1';
  if (level >= 5) return '½';
  return null;
}

export default function ArcanaDomainBlock({ character, onUpdate }) {
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const cr = banishCR(level);

  const options = [{
    name: 'Arcane Abjuration',
    icon: <ShieldOff size={13} />,
    desc: (
      <>Action: a celestial, elemental, fey, or fiend within 30 ft that can see/hear you makes a WIS save or is turned for 1 min (or until it takes damage).
      {cr && <> If off its home plane and CR ≤ <strong>{cr}</strong>, it's <strong>banished</strong> for 1 min instead (no concentration).</>}</>
    ),
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <BookOpen size={12} />
          <span><strong>Arcane Initiate</strong> — Arcana proficiency and two wizard cantrips that count as cleric cantrips (add on the Spells tab).</span>
        </div>
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Spell Breaker</strong> — when you heal an ally with a 1st-level-or-higher spell, also end one spell on them of level ≤ the slot used.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wand2 size={12} />
            <span><strong>Potent Spellcasting</strong> — add your WIS modifier (+{Math.max(0, wisMod)}) to the damage of any cleric cantrip.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Star size={12} />
            <span><strong>Arcane Mastery</strong> — four always-prepared wizard spells (one each of 6th–9th level) count as cleric spells.</span>
          </div>
        )}
      </div>
    </div>
  );
}
