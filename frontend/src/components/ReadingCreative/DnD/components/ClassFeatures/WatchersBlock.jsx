import { Eye, Volume2, Gauge, Zap, ShieldCheck } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oath of the Watchers — Combat tab. Channel Divinity options drive the panel;
 * Aura of the Sentinel (live PB initiative bonus) and Vigilant Rebuke (live
 * force damage) are reminders, and Mortal Bulwark gets a long-rest toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function WatchersBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const chaMod = Math.max(1, abilityMod(character.abilities?.CHA || 10));
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: "Watcher's Will", icon: <Eye size={13} />,
      desc: `Action: choose up to ${chaMod} (CHA) creatures within 30 ft.; for 1 min, you and they have advantage on INT, WIS, and CHA saves.` },
    { name: 'Abjure the Extraplanar', icon: <Volume2 size={13} />,
      desc: 'Action: each aberration, celestial, elemental, fey, or fiend within 30 ft. that can hear you makes a WIS save or is turned for 1 min (or until it takes damage).' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Gauge size={12} />
            <span><strong>Aura of the Sentinel</strong> — you and chosen creatures within {level >= 18 ? 30 : 10} ft. gain <strong>+{pb}</strong> (PB) to initiative.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Vigilant Rebuke</strong> — reaction when you/an ally within 30 ft. succeeds on an INT/WIS/CHA save: deal <strong>2d8 + {chaMod}</strong> force to the creature that forced it.</span>
          </div>
        )}
      </div>

      {level >= 20 && (
        <OnceToggle icon={<ShieldCheck size={13} />} title="Mortal Bulwark" rest="long rest" used={cf.mortalBulwarkUsed || false}
          note="Bonus action, 1 min: truesight 120 ft.; advantage vs. aberrations/celestials/elementals/fey/fiends; on a hit, force a CHA save or banish to native plane. Or expend a 5th-level slot to reuse."
          onToggle={() => patchCf({ mortalBulwarkUsed: !cf.mortalBulwarkUsed })} />
      )}
    </div>
  );
}
