import { Dumbbell, HeartPulse, Footprints, Shield, Award } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';
import { UsePool, OnceToggle } from './trackers';

/**
 * Oath of Glory — Combat tab. Channel Divinity options drive the panel
 * (Inspiring Smite shows its live temp-HP total); the speed aura is a reminder,
 * Glorious Defense is a CHA / long-rest pool, and Living Legend a long-rest toggle.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function GloryBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = Math.max(1, abilityMod(character.abilities?.CHA || 10));
  const patchCf = (f) => onUpdate({ classFeature: { ...cf, ...f } });
  const defenseUsed = cf.gloriousDefenseUsed || 0;

  const options = [
    { name: 'Peerless Athlete', icon: <Dumbbell size={13} />,
      desc: 'Bonus action: for 10 min, advantage on Athletics & Acrobatics, double carrying capacity, and +10 ft. to your jumps.' },
    { name: 'Inspiring Smite', icon: <HeartPulse size={13} />,
      desc: `Bonus action right after a Divine Smite: distribute 2d8 + ${level} temp HP among creatures within 30 ft.` },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      {level >= 7 && (
        <div className="dnd-warmagic__reminders">
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Footprints size={12} />
            <span><strong>Aura of Alacrity</strong> — your speed +10 ft.; allies starting their turn within {level >= 18 ? 10 : 5} ft. gain +10 ft. speed that turn.</span>
          </div>
        </div>
      )}

      {level >= 15 && (
        <UsePool icon={<Shield size={13} />} title="Glorious Defense" used={defenseUsed} max={chaMod}
          note="Reaction when you/an ally within 10 ft. is hit: +CHA to AC vs. that attack; on a miss, make one weapon attack on the attacker. Long rest."
          onUse={() => patchCf({ gloriousDefenseUsed: Math.min(chaMod, defenseUsed + 1) })}
          onRestore={() => patchCf({ gloriousDefenseUsed: Math.max(0, defenseUsed - 1) })} />
      )}

      {level >= 20 && (
        <OnceToggle icon={<Award size={13} />} title="Living Legend" rest="long rest" used={cf.livingLegendUsed || false}
          note="Bonus action, 1 min: advantage on all CHA checks; once per turn turn a miss into a hit; reaction to reroll a failed save. Or expend a 5th-level slot to reuse."
          onToggle={() => patchCf({ livingLegendUsed: !cf.livingLegendUsed })} />
      )}
    </div>
  );
}
