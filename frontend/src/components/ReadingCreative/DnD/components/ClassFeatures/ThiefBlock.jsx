import { Hand, Footprints, EyeOff, Wand2, Timer } from 'lucide-react';

/**
 * Thief — Combat tab. No spendable resources; the Thief is about doing more with a
 * bonus action and bending magic items to their will. Fast Hands headlines, with the
 * rest as level-gated reminders. Accent: rogue.
 */
export default function ThiefBlock({ character }) {
  const level = character.meta?.level || 3;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Hand size={13} /> Fast Hands</h4>
          <span className="dnd-warmagic__chip">Bonus action</span>
        </div>
        <p className="dnd-warmagic__note">Use your Cunning Action bonus action to make a <strong>Sleight of Hand</strong> check, use <strong>thieves' tools</strong> (disarm a trap / open a lock), or take the <strong>Use an Object</strong> action.</p>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Footprints size={12} />
          <span><strong>Second-Story Work</strong> — climbing costs no extra movement; running jumps reach +DEX feet.</span>
        </div>
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <EyeOff size={12} />
            <span><strong>Supreme Sneak</strong> — advantage on Stealth if you move no more than half your speed this turn.</span>
          </div>
        )}
        {level >= 13 && (
          <div className="dnd-warmagic__reminder">
            <Wand2 size={12} />
            <span><strong>Use Magic Device</strong> — you ignore all class, race, and level requirements on magic items.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Timer size={12} />
            <span><strong>Thief's Reflexes</strong> — take two turns in the first round of combat (the second at initiative −10); not while surprised.</span>
          </div>
        )}
      </div>
    </div>
  );
}
