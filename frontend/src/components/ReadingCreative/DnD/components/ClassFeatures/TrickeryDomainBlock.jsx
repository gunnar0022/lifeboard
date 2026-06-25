import { Copy, Ghost, Swords, Footprints } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Trickery Domain — Combat tab. Two Channel Divinity options (Invoke Duplicity,
 * then Cloak of Shadows at 6th) draw from the shared cleric charges, with poison
 * Divine Strike and the Blessing of the Trickster / Improved Duplicity reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function TrickeryDomainBlock({ character, onUpdate }) {
  const level = character.meta?.level || 1;
  const strikeDice = level >= 14 ? '2d8' : '1d8';
  const dupes = level >= 17 ? 'up to four illusory duplicates' : 'an illusory duplicate';

  const options = [{
    name: 'Invoke Duplicity',
    icon: <Copy size={13} />,
    desc: <>Action: create {dupes} within 30 ft for 1 min (concentration); bonus action to move it up to 30 ft. Cast spells from its space; advantage on attacks against a creature within 5 ft of both you and it.</>,
  }];
  if (level >= 6) {
    options.push({
      name: 'Cloak of Shadows',
      icon: <Ghost size={13} />,
      desc: 'Action: become invisible until the end of your next turn (you reappear if you attack or cast a spell).',
    });
  }

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Footprints size={12} />
          <span><strong>Blessing of the Trickster</strong> — action: touch a willing creature to give it advantage on Stealth (DEX) checks for 1 hour.</span>
        </div>
        {level >= 8 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> poison damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Copy size={12} />
            <span><strong>Improved Duplicity</strong> — Invoke Duplicity makes up to four duplicates; move any number up to 30 ft as a bonus action.</span>
          </div>
        )}
      </div>
    </div>
  );
}
