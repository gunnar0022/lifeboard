import { useEffect, useRef } from 'react';
import { Moon, Eye, Wind, Swords, ShieldHalf } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Twilight Domain — Combat tab. Channel Divinity: Twilight Sanctuary (a moving
 * sphere granting temp HP or ending charm/fright) headlines, with the PB-scaled
 * Steps of Night flight pool and the once-per-rest Eyes of Night share tracked
 * below, plus Divine Strike / Twilight Shroud reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function TwilightDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const strikeDice = level >= 14 ? '2d8' : '1d8';
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = pb;
    if (level >= 6 && cf.stepsOfNight?.max !== pb) {
      const stored = cf.stepsOfNight?.current;
      const next = stored == null ? pb
        : (p != null && pb > p ? Math.min(stored + (pb - p), pb) : Math.min(stored, pb));
      onUpdate({ classFeature: { ...cf, stepsOfNight: { max: pb, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, level]);

  const steps = cf.stepsOfNight || { current: pb, max: pb };
  const stepSteps = (d) =>
    onUpdate({ classFeature: { ...cf, stepsOfNight: { ...steps, current: Math.max(0, Math.min(steps.max, steps.current + d)) } } });

  const eyesShared = !!cf.eyesShared;

  const options = [{
    name: 'Twilight Sanctuary',
    icon: <Moon size={13} />,
    desc: <>Action: a 30-ft sphere of dim light for 1 min (moves with you). When a creature ends its turn inside, grant it either <strong>1d6 + {level}</strong> temp HP or end one charm/fright effect.</>,
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      {/* Eyes of Night — share darkvision (once per long rest, or a slot) */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Eye size={13} /> Eyes of Night</h4>
          <span className={`dnd-warmagic__uses ${eyesShared ? 'dnd-cleric__used' : ''}`}>{eyesShared ? 'shared' : 'ready'}</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Darkvision 300 ft. Action: share it with up to your WIS modifier of creatures within 10 ft for 1 hr. Once per long rest (or expend a slot).</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, eyesShared: !eyesShared } })}>
              {eyesShared ? 'Reset' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* Steps of Night — PB-scaled flight (6th) */}
      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Wind size={13} /> Steps of Night</h4>
            <span className="dnd-warmagic__uses">{steps.current}/{steps.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: steps.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < steps.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Bonus action in dim light or darkness: flying speed = your walking speed for 1 min. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepSteps(1)} disabled={steps.current >= steps.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepSteps(-1)} disabled={steps.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Eye size={12} />
          <span><strong>Vigilant Blessing</strong> — action: give one creature you touch advantage on its next initiative roll.</span>
        </div>
        {level >= 8 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> radiant damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldHalf size={12} />
            <span><strong>Twilight Shroud</strong> — you and allies have half cover while inside your Twilight Sanctuary sphere.</span>
          </div>
        )}
      </div>
    </div>
  );
}
