import { Wind, Compass, Crosshair, Zap } from 'lucide-react';

/**
 * Scout — Combat tab. No spendable resources; the Scout is about mobility and the
 * jump on a fight. Skirmisher's reactive reposition headlines, Superior Mobility
 * shows its live speed bonus, and Ambush Master / Sudden Strike ride below. Accent: rogue.
 */
export default function ScoutBlock({ character }) {
  const level = character.meta?.level || 3;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Wind size={13} /> Skirmisher</h4>
          {level >= 9 && <span className="dnd-warmagic__chip">+10 ft speed</span>}
        </div>
        <p className="dnd-warmagic__note">Reaction: when an enemy ends its turn within 5 ft, move up to <strong>half your speed</strong> without provoking.{level >= 9 && <> <strong>Superior Mobility</strong> adds +10 ft to your walking (and climb/swim) speed.</>}</p>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Compass size={12} />
          <span><strong>Survivalist</strong> — expertise (doubled proficiency) on Nature and Survival checks.</span>
        </div>
        {level >= 13 && (
          <div className="dnd-warmagic__reminder">
            <Crosshair size={12} />
            <span><strong>Ambush Master</strong> — advantage on initiative; the first creature you hit in round 1 is easier to hit (attacks against it have advantage) until your next turn.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Sudden Strike</strong> — after the Attack action, an extra bonus-action attack that can also Sneak Attack (a different target).</span>
          </div>
        )}
      </div>
    </div>
  );
}
