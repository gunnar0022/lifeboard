import { Skull, Ghost, Flame, Shield, Moon } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oathbreaker — Combat tab. Channel Divinity options drive the panel (Control
 * Undead / Dreadful Aspect); Aura of Hate (live CHA melee bonus) and
 * Supernatural Resistance are reminders, and Dread Lord gets a long-rest toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function OathbreakerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaBonus = Math.max(1, abilityMod(character.abilities?.CHA || 10));
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: 'Dreadful Aspect', icon: <Ghost size={13} />,
      desc: 'Action: each creature of your choice within 30 ft. that can see you makes a WIS save or is frightened of you for 1 min (a creature ending its turn 30+ ft. away may retry).' },
    { name: 'Control Undead', icon: <Skull size={13} />,
      desc: 'Action: an undead within 30 ft. makes a WIS save or obeys you for 24 hours (CR ≥ your paladin level is immune).' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Flame size={12} />
            <span><strong>Aura of Hate</strong> — you and fiends/undead within {level >= 18 ? 30 : 10} ft. gain <strong>+{chaBonus}</strong> (CHA) to melee weapon damage rolls.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Supernatural Resistance</strong> — resistance to bludgeoning, piercing, and slashing from nonmagical weapons.</span>
          </div>
        )}
      </div>

      {level >= 20 && (
        <OnceToggle icon={<Moon size={13} />} title="Dread Lord" rest="long rest" used={cf.dreadLordUsed || false}
          note={`Action, 1 min: 30-ft. gloom aura — frightened enemies take 4d10 psychic each turn there; allies in shadow are hard to hit. Bonus action: shadow melee spell attack for 3d10 + ${chaBonus} necrotic.`}
          onToggle={() => patchCf({ dreadLordUsed: !cf.dreadLordUsed })} />
      )}
    </div>
  );
}
