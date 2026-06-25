import { useEffect, useRef } from 'react';
import { Eye, ShieldHalf, Skull, HeartPulse, Wand2 } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Grave Domain — Combat tab. The defensive healer who guards death's threshold.
 * Channel Divinity: Path to the Grave (vulnerability curse) draws from the shared
 * cleric charges; two WIS-scaled long-rest pools — Eyes of the Grave (sense
 * undead) and Sentinel at Death's Door (negate a crit) — are tracked here.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function GraveDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const poolMax = Math.max(1, wisMod);
  const prev = useRef(null);

  // Both Grave pools scale with WIS; grant the delta on growth.
  useEffect(() => {
    const p = prev.current;
    prev.current = poolMax;
    const grow = (stored) => {
      if (stored == null) return poolMax;
      return p != null && poolMax > p ? Math.min(stored + (poolMax - p), poolMax) : Math.min(stored, poolMax);
    };
    const patch = {};
    if (cf.eyesOfGrave?.max !== poolMax) patch.eyesOfGrave = { max: poolMax, current: grow(cf.eyesOfGrave?.current) };
    if (level >= 6 && cf.sentinel?.max !== poolMax) patch.sentinel = { max: poolMax, current: grow(cf.sentinel?.current) };
    if (Object.keys(patch).length) onUpdate({ classFeature: { ...cf, ...patch } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolMax, level]);

  const eyes = cf.eyesOfGrave || { current: poolMax, max: poolMax };
  const sentinel = cf.sentinel || { current: poolMax, max: poolMax };
  const step = (key, obj, d) =>
    onUpdate({ classFeature: { ...cf, [key]: { ...obj, current: Math.max(0, Math.min(obj.max, obj.current + d)) } } });

  const options = [{
    name: 'Path to the Grave',
    icon: <Skull size={13} />,
    desc: 'Action: curse a creature within 30 ft until the end of your next turn. The next attack that hits it (you or an ally) has vulnerability to all its damage, then the curse ends.',
  }];

  const useRow = (key, obj, title, icon, note) => (
    <div className="dnd-warmagic__section">
      <div className="dnd-warmagic__head">
        <h4 className="dnd-warmagic__subtitle">{icon} {title}</h4>
        <span className="dnd-warmagic__uses">{obj.current}/{obj.max}</span>
      </div>
      <div className="dnd-warmagic__pips">
        {Array.from({ length: obj.max }, (_, i) => (
          <span key={i} className={`dnd-warmagic__pip ${i < obj.current ? 'dnd-warmagic__pip--full' : ''}`} />
        ))}
      </div>
      <div className="dnd-warmagic__row">
        <span className="dnd-warmagic__note">{note}</span>
        <div className="dnd-warmagic__btns">
          <button className="dnd-warmagic__btn" onClick={() => step(key, obj, 1)} disabled={obj.current >= obj.max}>+</button>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => step(key, obj, -1)} disabled={obj.current <= 0}>Use</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      {useRow('eyesOfGrave', eyes, 'Eyes of the Grave', <Eye size={13} />,
        'Action: sense undead within 60 ft until end of your next turn. Long rest.')}

      {level >= 6 && useRow('sentinel', sentinel, "Sentinel at Death's Door", <ShieldHalf size={13} />,
        'Reaction: turn a crit on you or an ally within 30 ft into a normal hit. Long rest.')}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <HeartPulse size={12} />
          <span><strong>Circle of Mortality</strong> — healing a creature at 0 HP uses max die values; you know Spare the Dying (30 ft, bonus action).</span>
        </div>
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wand2 size={12} />
            <span><strong>Potent Spellcasting</strong> — add your WIS modifier (+{Math.max(0, wisMod)}) to the damage of any cleric cantrip.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Skull size={12} />
            <span><strong>Keeper of Souls</strong> — when an enemy dies within 30 ft, you or an ally regains HP equal to its Hit Dice (once per turn).</span>
          </div>
        )}
      </div>
    </div>
  );
}
