import { Skull, Crosshair, Flame, Zap, Swords } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oath of Conquest — Combat tab. Channel Divinity options drive the panel; the
 * fear-leveraging Aura of Conquest (with its live psychic-damage value) and
 * Scornful Rebuke are reminders, and Invincible Conqueror gets a toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function ConquestBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = Math.max(1, abilityMod(character.abilities?.CHA || 10));
  const auraPsychic = Math.floor(level / 2);
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: 'Conquering Presence', icon: <Skull size={13} />,
      desc: 'Action: each creature of your choice within 30 ft. makes a WIS save or is frightened of you for 1 min (repeats the save at the end of each of its turns).' },
    { name: 'Guided Strike', icon: <Crosshair size={13} />,
      desc: 'Gain a +10 bonus to one attack roll — choose after you see the roll, before knowing if it hits.' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Flame size={12} />
            <span><strong>Aura of Conquest</strong> ({level >= 18 ? 30 : 10} ft) — a creature frightened of you has speed 0 here and takes <strong>{auraPsychic} psychic</strong> (½ level) if it starts its turn in the aura.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Scornful Rebuke</strong> — a creature that hits you takes <strong>{chaMod} psychic</strong> (CHA) while you're not incapacitated.</span>
          </div>
        )}
      </div>

      {level >= 20 && (
        <OnceToggle icon={<Swords size={13} />} title="Invincible Conqueror" rest="long rest" used={cf.invincibleConquerorUsed || false}
          note="Action, 1 min: resistance to all damage; one extra attack on the Attack action; melee crits on 19–20."
          onToggle={() => patchCf({ invincibleConquerorUsed: !cf.invincibleConquerorUsed })} />
      )}
    </div>
  );
}
