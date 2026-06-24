import { Sword, Skull, Heart, Sparkles, Sun } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { OnceToggle } from './trackers';

/**
 * Oath of Devotion — Combat tab. Channel Divinity options drive the panel
 * (Sacred Weapon shows its live CHA bonus); the anti-charm aura and Purity of
 * Spirit are reminders, and Holy Nimbus gets a long-rest toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function DevotionBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaBonus = Math.max(1, abilityMod(character.abilities?.CHA || 10));
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });

  const options = [
    { name: 'Sacred Weapon', icon: <Sword size={13} />,
      desc: `Action: for 1 min, add +${chaBonus} (CHA, min +1) to attacks with one held weapon; it sheds bright light (20 ft.) and becomes magical.` },
    { name: 'Turn the Unholy', icon: <Skull size={13} />,
      desc: 'Action: each fiend or undead within 30 ft. that can see or hear you makes a WIS save or is turned for 1 min (or until it takes damage).' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Heart size={12} />
            <span><strong>Aura of Devotion</strong> — you and allies within {level >= 18 ? 30 : 10} ft. can't be charmed while you're conscious.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Purity of Spirit</strong> — you're always under the effects of Protection from Evil and Good.</span>
          </div>
        )}
      </div>

      {level >= 20 && (
        <OnceToggle icon={<Sun size={13} />} title="Holy Nimbus" rest="long rest" used={cf.holyNimbusUsed || false}
          note="Action, 1 min: 30-ft. bright sunlight; enemies starting their turn in it take 10 radiant; advantage on saves vs. fiend/undead spells."
          onToggle={() => patchCf({ holyNimbusUsed: !cf.holyNimbusUsed })} />
      )}
    </div>
  );
}
