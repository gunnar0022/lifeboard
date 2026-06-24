import { Leaf, Volume2, ShieldHalf, HeartPulse, Sparkles } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oath of the Ancients — Combat tab. The two Channel Divinity options drive the
 * panel; Aura of Warding is a reminder, and the long-rest survival/transform
 * abilities (Undying Sentinel, Elder Champion) get toggles.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function AncientsBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: "Nature's Wrath", icon: <Leaf size={13} />,
      desc: 'Action: spectral vines reach a creature within 10 ft. — STR or DEX save (its choice) or restrained, repeating the save at the end of each of its turns.' },
    { name: 'Turn the Faithless', icon: <Volume2 size={13} />,
      desc: 'Action: each fey or fiend within 30 ft. that can hear you makes a WIS save or is turned for 1 min (or until it takes damage); its true form is revealed.' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      {level >= 7 && (
        <div className="dnd-warmagic__reminders">
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldHalf size={12} />
            <span><strong>Aura of Warding</strong> — you and allies within {level >= 18 ? 30 : 10} ft. have resistance to damage from spells.</span>
          </div>
        </div>
      )}

      {level >= 15 && (
        <OnceToggle icon={<HeartPulse size={13} />} title="Undying Sentinel" rest="long rest" used={cf.undyingSentinelUsed || false}
          note="When reduced to 0 HP (not killed outright), drop to 1 HP instead."
          onToggle={() => patchCf({ undyingSentinelUsed: !cf.undyingSentinelUsed })} />
      )}

      {level >= 20 && (
        <OnceToggle icon={<Sparkles size={13} />} title="Elder Champion" rest="long rest" used={cf.elderChampionUsed || false}
          note="Action, 1 min: regain 10 HP each turn; cast 1-action paladin spells as a bonus action; enemies within 10 ft. have disadvantage on saves vs. your spells & Channel Divinity."
          onToggle={() => patchCf({ elderChampionUsed: !cf.elderChampionUsed })} />
      )}
    </div>
  );
}
