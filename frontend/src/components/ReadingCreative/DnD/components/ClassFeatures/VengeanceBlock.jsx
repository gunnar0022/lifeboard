import { Skull, Crosshair, Footprints, Swords, Feather } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oath of Vengeance — Combat tab. Channel Divinity options drive the panel
 * (Vow of Enmity / Abjure Enemy); Relentless Avenger and Soul of Vengeance are
 * reminders, and Avenging Angel gets a long-rest toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function VengeanceBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: 'Vow of Enmity', icon: <Crosshair size={13} />,
      desc: 'Bonus action: gain advantage on attacks against a creature within 10 ft. for 1 min (or until it drops to 0 HP / falls unconscious).' },
    { name: 'Abjure Enemy', icon: <Skull size={13} />,
      desc: 'Action: a creature within 60 ft. makes a WIS save (fiends/undead at disadvantage) — fail: frightened, speed 0 for 1 min (or until it takes damage); success: speed halved.' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Footprints size={12} />
            <span><strong>Relentless Avenger</strong> — hit with an opportunity attack to move up to half your speed (same reaction), without provoking.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Swords size={12} />
            <span><strong>Soul of Vengeance</strong> — reaction: when your Vow of Enmity target attacks, make a melee weapon attack against it if it's in range.</span>
          </div>
        )}
      </div>

      {level >= 20 && (
        <OnceToggle icon={<Feather size={13} />} title="Avenging Angel" rest="long rest" used={cf.avengingAngelUsed || false}
          note="Action, 1 hour: fly 60 ft. and emanate a 30-ft. aura of menace (enemies entering/starting there make a WIS save or are frightened; attacks against them have advantage)."
          onToggle={() => patchCf({ avengingAngelUsed: !cf.avengingAngelUsed })} />
      )}
    </div>
  );
}
