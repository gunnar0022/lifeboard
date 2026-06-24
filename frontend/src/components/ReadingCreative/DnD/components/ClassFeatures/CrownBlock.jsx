import { Swords, HeartPulse, Shield, ShieldCheck, Crown } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oath of the Crown — Combat tab. Channel Divinity options drive the panel (one
 * is a heal whose value scales with CHA); Divine Allegiance and Unyielding Saint
 * are reminders, and Exalted Champion gets a toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function CrownBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = Math.max(1, abilityMod(character.abilities?.CHA || 10));
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: 'Champion Challenge', icon: <Swords size={13} />,
      desc: "Bonus action: each creature of your choice within 30 ft. makes a WIS save or can't willingly move more than 30 ft. away from you." },
    { name: 'Turn the Tide', icon: <HeartPulse size={13} />,
      desc: `Bonus action: each chosen creature within 30 ft. that can hear you and is at half HP or less regains 1d6 + ${chaMod} (CHA) HP.` },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Shield size={12} />
            <span><strong>Divine Allegiance</strong> — reaction: when a creature within 5 ft. takes damage, take it yourself instead (can't be reduced or prevented).</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <ShieldCheck size={12} />
            <span><strong>Unyielding Saint</strong> — advantage on saving throws to avoid being paralyzed or stunned.</span>
          </div>
        )}
      </div>

      {level >= 20 && (
        <OnceToggle icon={<Crown size={13} />} title="Exalted Champion" rest="long rest" used={cf.exaltedChampionUsed || false}
          note="Action, 1 hour: resistance to nonmagical B/P/S; you & allies within 30 ft. gain advantage on WIS saves; allies within 30 ft. have advantage on death saves."
          onToggle={() => patchCf({ exaltedChampionUsed: !cf.exaltedChampionUsed })} />
      )}
    </div>
  );
}
