import { Flame, Swords, Skull, Zap } from 'lucide-react';

/**
 * Samurai — Combat tab. Fighting Spirit is the core: three long-rest uses that grant
 * advantage on weapon attacks plus scaling temporary HP (5 → 10 → 15). Strength
 * Before Death is a once-per-long-rest death-defiance toggle. Tireless Spirit /
 * Rapid Strike ride below as reminders.
 */
function fightingSpiritTemp(level) {
  if (level >= 15) return 15;
  if (level >= 10) return 10;
  return 5;
}

export default function SamuraiBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const temp = fightingSpiritTemp(level);
  const spirit = cf.fightingSpirit || { max: 3, current: 3 };
  const defyUsed = cf.strengthBeforeDeathUsed || false;

  const spend = () => { if (spirit.current > 0) onUpdate({ classFeature: { ...cf, fightingSpirit: { max: 3, current: spirit.current - 1 } } }); };
  const restore = () => { if (spirit.current < 3) onUpdate({ classFeature: { ...cf, fightingSpirit: { max: 3, current: spirit.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Fighting Spirit */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Flame size={13} /> Fighting Spirit</h4>
          <span className="dnd-warmagic__uses">{spirit.current}/3</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < spirit.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Bonus action: <strong>advantage</strong> on weapon attacks this turn + <strong>{temp} temp HP</strong>. Recharge on a long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restore} disabled={spirit.current >= 3}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spend} disabled={spirit.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      {/* Strength Before Death */}
      {level >= 18 && (
        <div className={`dnd-warmagic__section ${defyUsed ? 'dnd-archfey__spent' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Skull size={13} /> Strength Before Death</h4>
            <span className="dnd-warmagic__uses">{defyUsed ? 'spent' : '1 / long'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction when reduced to 0 HP: delay falling and take an immediate extra turn.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, strengthBeforeDeathUsed: !defyUsed } })}>{defyUsed ? 'Reset' : 'Use'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Tireless Spirit</strong> — if you roll initiative with no Fighting Spirit left, regain one use.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Rapid Strike</strong> — trade advantage on one attack for an extra weapon attack against that target (once per turn).</span>
          </div>
        )}
      </div>
    </div>
  );
}
