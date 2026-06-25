import { Skull, Swords, Biohazard, Crosshair } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Death Domain — Combat tab. Channel Divinity: Touch of Death headlines — a
 * melee-strike necrotic nuke (5 + 2× level) drawing from the cleric's shared
 * charges. Divine Strike, Inescapable Destruction, and Reaper ride as reminders,
 * in the cleric "healer" visual language (turned grim here).
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function DeathDomainBlock({ character, onUpdate }) {
  const level = character.meta?.level || 1;
  const touchDmg = 5 + 2 * level;
  const strikeDice = level >= 14 ? '2d8' : '1d8';

  const options = [{
    name: 'Touch of Death',
    icon: <Skull size={13} />,
    desc: <>On a melee hit, spend a use to deal an extra <strong>{touchDmg}</strong> necrotic damage (5 + twice your cleric level).</>,
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Crosshair size={12} />
          <span><strong>Reaper</strong> — martial weapon proficiency, plus a necromancy cantrip (any list) that can hit two creatures within 5 ft of each other.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Biohazard size={12} />
            <span><strong>Inescapable Destruction</strong> — your cleric spell &amp; Channel Divinity necrotic damage ignores resistance to necrotic.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> necrotic damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Skull size={12} />
            <span><strong>Improved Reaper</strong> — single-target necromancy spells of 1st–5th level can hit two creatures within 5 ft of each other.</span>
          </div>
        )}
      </div>
    </div>
  );
}
