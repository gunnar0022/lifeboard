import { Users, Eye, Shield, Brain } from 'lucide-react';

/**
 * Mastermind — Combat tab. The Mastermind has no spendable resources; its edge is
 * tactical, so this block headlines Master of Tactics (Help as a bonus action, at
 * 30 ft) and surfaces the rest as level-gated reminders. Accent: rogue.
 */
export default function MastermindBlock({ character }) {
  const level = character.meta?.level || 3;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Users size={13} /> Master of Tactics</h4>
          <span className="dnd-warmagic__chip">Help · 30 ft</span>
        </div>
        <p className="dnd-warmagic__note">Use the <strong>Help</strong> action as a <strong>bonus action</strong>; when you Help an ally attack, the target can be up to <strong>30 ft</strong> away (if it can see or hear you).</p>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Brain size={12} />
          <span><strong>Master of Intrigue</strong> — disguise/forgery/gaming proficiencies, two languages, and you can mimic a voice you've heard for 1 minute.</span>
        </div>
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <Eye size={12} />
            <span><strong>Insightful Manipulator</strong> — observe a creature 1 min (out of combat) to compare two of INT/WIS/CHA/class levels.</span>
          </div>
        )}
        {level >= 13 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Misdirection</strong> — reaction: when a creature within 5 ft grants you cover against an attack, redirect that attack to it.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Brain size={12} />
            <span><strong>Soul of Deceit</strong> — your mind can't be read unless you allow it, you can feign thoughts, and lie-detection magic reads you as truthful.</span>
          </div>
        )}
      </div>
    </div>
  );
}
