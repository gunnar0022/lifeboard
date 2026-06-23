import { Moon, Zap, Flame, Shuffle } from 'lucide-react';

/**
 * Circle of the Moon — Combat tab. The headline is the beast-form ceiling: Circle
 * Forms lifts your Wild Shape CR cap (1 until 6th, then druid level ÷ 3), shown as a
 * live badge. Combat Wild Shape (bonus-action transform + spend-a-slot healing) and
 * the higher-level tricks ride below. The Wild Shape uses themselves live on the base
 * Wild Shape tracker above. Accent: druid green.
 */
function maxCR(level) {
  if (level >= 6) return Math.floor(level / 3);
  return 1;
}

export default function MoonBlock({ character }) {
  const level = character.meta?.level || 2;
  const cr = maxCR(level);

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      <div className="dnd-warmagic__section dnd-champ__crit-card">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Moon size={13} /> Circle Forms</h4>
        </div>
        <div className="dnd-champ__crit">
          <span className="dnd-champ__crit-range">CR {cr}</span>
          <span className="dnd-champ__crit-label">max beast form{level < 6 ? ' (½ at lvl 6)' : ''}</span>
        </div>
      </div>

      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Zap size={13} /> Combat Wild Shape</h4>
        </div>
        <p className="dnd-warmagic__note">Wild Shape as a <strong>bonus action</strong>. While transformed, spend a spell slot as a bonus action to regain <strong>1d8 HP per slot level</strong>.</p>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Primal Strike</strong> — your beast-form attacks count as magical for overcoming resistance &amp; immunity.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Flame size={12} />
            <span><strong>Elemental Wild Shape</strong> — expend <strong>two</strong> Wild Shape uses to become an air, earth, fire, or water elemental.</span>
          </div>
        )}
        {level >= 14 && (
          <div className="dnd-warmagic__reminder">
            <Shuffle size={12} />
            <span><strong>Thousand Forms</strong> — you can cast Alter Self at will.</span>
          </div>
        )}
      </div>
    </div>
  );
}
