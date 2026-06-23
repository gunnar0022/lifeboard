import { Flag, Heart, Zap, Shield } from 'lucide-react';

/**
 * Banneret (Purple Dragon Knight) — Combat tab. The Banneret has no resource of its
 * own; every feature upgrades a base Fighter resource (Second Wind, Action Surge,
 * Indomitable) to also help allies. So this block is a level-gated reminder panel
 * that computes the live numbers — Rallying Cry's heal scales with fighter level,
 * Inspiring Surge widens to two allies at 18th.
 */
export default function BanneretBlock({ character }) {
  const level = character.meta?.level || 3;
  const inspiringAllies = level >= 18 ? 2 : 1;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Heart size={12} />
          <span><strong>Rallying Cry</strong> — when you use <em>Second Wind</em>, up to 3 allies within 60 ft each regain <strong>{level} HP</strong>.</span>
        </div>
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Flag size={12} />
            <span><strong>Royal Envoy</strong> — proficiency in Persuasion, with your proficiency bonus <strong>doubled</strong> on Persuasion checks.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Zap size={12} />
            <span><strong>Inspiring Surge</strong> — when you use <em>Action Surge</em>, <strong>{inspiringAllies}</strong> all{inspiringAllies === 1 ? 'y' : 'ies'} within 60 ft can make a weapon attack with their reaction.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Bulwark</strong> — when you use <em>Indomitable</em> on an INT/WIS/CHA save, an ally within 60 ft that failed the same save can reroll too.</span>
          </div>
        )}
      </div>
    </div>
  );
}
