import { useEffect, useRef } from 'react';
import { Swords, Crosshair, HandHelping, ShieldHalf } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * War Domain — Combat tab. The WIS-scaled War Priest bonus-attack pool and two
 * Channel Divinity options (Guided Strike, then War God's Blessing at 6th) headline
 * the cleric-styled block, with Divine Strike and the Avatar of Battle reminder.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function WarDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const priestMax = Math.max(1, wisMod);
  const strikeDice = level >= 14 ? '2d8' : '1d8';
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = priestMax;
    if (cf.warPriest?.max !== priestMax) {
      const stored = cf.warPriest?.current;
      const next = stored == null ? priestMax
        : (p != null && priestMax > p ? Math.min(stored + (priestMax - p), priestMax) : Math.min(stored, priestMax));
      onUpdate({ classFeature: { ...cf, warPriest: { max: priestMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priestMax]);

  const priest = cf.warPriest || { current: priestMax, max: priestMax };
  const stepPriest = (d) =>
    onUpdate({ classFeature: { ...cf, warPriest: { ...priest, current: Math.max(0, Math.min(priest.max, priest.current + d)) } } });

  const options = [{
    name: 'Guided Strike',
    icon: <Crosshair size={13} />,
    desc: 'When you make an attack roll, spend a use to gain +10 (decide after the roll, before the result).',
  }];
  if (level >= 6) {
    options.push({
      name: "War God's Blessing",
      icon: <HandHelping size={13} />,
      desc: 'Reaction: when a creature within 30 ft makes an attack roll, spend a use to grant it +10 (after the roll, before the result).',
    });
  }

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Swords size={13} /> War Priest</h4>
          <span className="dnd-warmagic__uses">{priest.current}/{priest.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: priest.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < priest.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">When you take the Attack action, make one weapon attack as a bonus action. Long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => stepPriest(1)} disabled={priest.current >= priest.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepPriest(-1)} disabled={priest.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> damage of the weapon's type.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldHalf size={12} />
            <span><strong>Avatar of Battle</strong> — resistance to nonmagical bludgeoning, piercing, and slashing damage.</span>
          </div>
        )}
      </div>
    </div>
  );
}
