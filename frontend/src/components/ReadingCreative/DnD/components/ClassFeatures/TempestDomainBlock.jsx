import { useEffect, useRef } from 'react';
import { CloudLightning, Zap, Swords, Wind } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Tempest Domain — Combat tab. The WIS-scaled Wrath of the Storm reaction pool
 * and Channel Divinity: Destructive Wrath (maximize lightning/thunder damage)
 * headline the cleric-styled block, with Divine Strike (thunder) and the
 * Thunderous Strike / Stormborn reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function TempestDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const wrathMax = Math.max(1, wisMod);
  const strikeDice = level >= 14 ? '2d8' : '1d8';
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = wrathMax;
    if (cf.wrathOfStorm?.max !== wrathMax) {
      const stored = cf.wrathOfStorm?.current;
      const next = stored == null ? wrathMax
        : (p != null && wrathMax > p ? Math.min(stored + (wrathMax - p), wrathMax) : Math.min(stored, wrathMax));
      onUpdate({ classFeature: { ...cf, wrathOfStorm: { max: wrathMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrathMax]);

  const wrath = cf.wrathOfStorm || { current: wrathMax, max: wrathMax };
  const stepWrath = (d) =>
    onUpdate({ classFeature: { ...cf, wrathOfStorm: { ...wrath, current: Math.max(0, Math.min(wrath.max, wrath.current + d)) } } });

  const options = [{
    name: 'Destructive Wrath',
    icon: <Zap size={13} />,
    desc: 'When you roll lightning or thunder damage, spend a use to deal maximum damage instead of rolling.',
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><CloudLightning size={13} /> Wrath of the Storm</h4>
          <span className="dnd-warmagic__uses">{wrath.current}/{wrath.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: wrath.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < wrath.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Reaction when an adjacent attacker hits you: it makes a DEX save for 2d8 lightning or thunder (half on success). Long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => stepWrath(1)} disabled={wrath.current >= wrath.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepWrath(-1)} disabled={wrath.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wind size={12} />
            <span><strong>Thunderous Strike</strong> — when you deal lightning damage to a Large or smaller creature, you can push it up to 10 ft away.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> thunder damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wind size={12} />
            <span><strong>Stormborn</strong> — flying speed equal to your walking speed whenever you're not underground or indoors.</span>
          </div>
        )}
      </div>
    </div>
  );
}
