import { MessageCircle, Zap, ShieldHalf, HeartPulse, Sparkles } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Oath of Redemption — Combat tab. Channel Divinity options drive the panel.
 * The oath's other powers (the damage-absorbing aura, combat self-healing, and
 * the avatar capstone) are passive/reaction with no per-rest pool of their own,
 * so they ride as reminders — with Protective Spirit showing its live heal.
 */
const ACCENT = 'var(--dnd-class-paladin)';

export default function RedemptionBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const protectiveHeal = Math.floor(level / 2);

  const options = [
    { name: 'Emissary of Peace', icon: <MessageCircle size={13} />,
      desc: 'Bonus action: gain a +5 bonus to Charisma (Persuasion) checks for 10 minutes.' },
    { name: 'Rebuke the Violent', icon: <Zap size={13} />,
      desc: 'Reaction right after an attacker within 30 ft. damages another creature: it makes a WIS save, taking radiant damage equal to the damage it dealt (half on a success).' },
  ];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} />

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldHalf size={12} />
            <span><strong>Aura of the Guardian</strong> — reaction: when a creature within {level >= 18 ? 30 : 10} ft. takes damage, take it yourself instead (can't be reduced).</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <HeartPulse size={12} />
            <span><strong>Protective Spirit</strong> — regain <strong>1d6 + {protectiveHeal}</strong> HP if you end your turn in combat below half HP (and not incapacitated).</span>
          </div>
        )}
        {level >= 20 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Emissary of Redemption</strong> — resistance to all damage from other creatures; attackers take radiant equal to half the damage you take. Breaks vs. a creature you attack/harm until a long rest.</span>
          </div>
        )}
      </div>
    </div>
  );
}
