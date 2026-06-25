import { Leaf, Swords, ShieldHalf, PawPrint } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Nature Domain — Combat tab. Channel Divinity: Charm Animals and Plants
 * headlines, drawing from the shared cleric charges; Divine Strike (choosable
 * cold/fire/lightning), Dampen Elements, and Master of Nature ride as reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function NatureDomainBlock({ character, onUpdate }) {
  const level = character.meta?.level || 1;
  const strikeDice = level >= 14 ? '2d8' : '1d8';

  const options = [{
    name: 'Charm Animals and Plants',
    icon: <PawPrint size={13} />,
    desc: 'Action: each beast or plant creature within 30 ft that can see you makes a WIS save or is charmed for 1 min (or until it takes damage), becoming friendly to you and your allies.',
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Leaf size={12} />
          <span><strong>Acolyte of Nature</strong> — a free druid cantrip (counts as cleric) and a nature skill; plus heavy armor proficiency.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldHalf size={12} />
            <span><strong>Dampen Elements</strong> — reaction: grant a creature within 30 ft resistance to one instance of acid, cold, fire, lightning, or thunder damage.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> cold, fire, or lightning damage (your choice).</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <PawPrint size={12} />
            <span><strong>Master of Nature</strong> — bonus action to command creatures charmed by Charm Animals and Plants.</span>
          </div>
        )}
      </div>
    </div>
  );
}
