import { HeartPulse, HandHeart, Swords, Sparkles, Plus } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Life Domain — Combat tab. The archetypal healer. Channel Divinity: Preserve
 * Life (a distributable heal pool of 5× level) headlines, drawing from the shared
 * cleric charges; the passive healing amplifiers (Disciple of Life, Blessed
 * Healer, Supreme Healing) and Divine Strike ride as reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function LifeDomainBlock({ character, onUpdate }) {
  const level = character.meta?.level || 1;
  const preservePool = 5 * level;
  const strikeDice = level >= 14 ? '2d8' : '1d8';

  const options = [{
    name: 'Preserve Life',
    icon: <HandHeart size={13} />,
    desc: <>Action: restore <strong>{preservePool}</strong> HP (5× level), divided among creatures within 30 ft — none above half their max. Not on undead or constructs.</>,
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Plus size={12} />
          <span><strong>Disciple of Life</strong> — a 1st-level-or-higher healing spell restores an extra <strong>2 + the spell's level</strong> HP.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <HeartPulse size={12} />
            <span><strong>Blessed Healer</strong> — healing another with a 1st-level-or-higher spell also heals you for 2 + the spell's level.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> radiant damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Supreme Healing</strong> — your healing spells use the maximum value of each die instead of rolling.</span>
          </div>
        )}
      </div>
    </div>
  );
}
