import { Swords, Wind, Sparkles, Gauge } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Swashbuckler — Combat tab. Rakish Audacity headlines with a live initiative bonus
 * and the duelist's conditional Sneak Attack (no advantage needed when it's just you
 * and your mark). Fancy Footwork / Panache / Elegant Maneuver ride below, with Master
 * Duelist a once-per-short-rest miss reroll. Accent: rogue.
 */
export default function SwashbucklerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const initStr = chaMod >= 0 ? `+${chaMod}` : `${chaMod}`;
  const duelistUsed = cf.masterDuelistUsed || false;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Rakish Audacity */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Gauge size={13} /> Rakish Audacity</h4>
          <span className="dnd-warmagic__chip">Init {initStr}</span>
        </div>
        <p className="dnd-warmagic__note">Add your Charisma to initiative. You can <strong>Sneak Attack without advantage</strong> when you're within 5 ft of the target, no one else is within 5 ft of you, and you don't have disadvantage.</p>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Wind size={12} />
          <span><strong>Fancy Footwork</strong> — a creature you make a melee attack against can't make opportunity attacks against you for the rest of your turn.</span>
        </div>
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Panache</strong> — action, Persuasion vs Insight: taunt a hostile (disadvantage attacking others, no OAs on others) or charm a non-hostile for 1 minute.</span>
          </div>
        )}
        {level >= 13 && (
          <div className="dnd-warmagic__reminder">
            <Wind size={12} />
            <span><strong>Elegant Maneuver</strong> — bonus action: advantage on your next Acrobatics or Athletics check this turn.</span>
          </div>
        )}
        {level >= 17 && (
          <div className={`dnd-warmagic__reminder ${duelistUsed ? 'dnd-archfey__spent' : ''}`}>
            <Swords size={12} />
            <span><strong>Master Duelist</strong> — reroll a missed attack with advantage. {duelistUsed ? '(spent)' : '1 / short rest.'}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, masterDuelistUsed: !duelistUsed } })}>{duelistUsed ? 'Reset' : 'Use'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
