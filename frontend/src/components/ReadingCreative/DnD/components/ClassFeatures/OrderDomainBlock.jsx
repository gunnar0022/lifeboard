import { useEffect, useRef } from 'react';
import { Scale, Gavel, Swords, Megaphone } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Order Domain — Combat tab. Channel Divinity: Order's Demand (charm/disarm AoE)
 * headlines, drawing from the shared cleric charges; the WIS-scaled Embodiment of
 * the Law pool (bonus-action enchantments) is tracked below, with Voice of
 * Authority / Divine Strike / Order's Wrath as reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function OrderDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const poolMax = Math.max(1, wisMod);
  const strikeDice = level >= 14 ? '2d8' : '1d8';
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = poolMax;
    if (level >= 6 && cf.embodiment?.max !== poolMax) {
      const stored = cf.embodiment?.current;
      const next = stored == null ? poolMax
        : (p != null && poolMax > p ? Math.min(stored + (poolMax - p), poolMax) : Math.min(stored, poolMax));
      onUpdate({ classFeature: { ...cf, embodiment: { max: poolMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolMax, level]);

  const emb = cf.embodiment || { current: poolMax, max: poolMax };
  const stepEmb = (d) =>
    onUpdate({ classFeature: { ...cf, embodiment: { ...emb, current: Math.max(0, Math.min(emb.max, emb.current + d)) } } });

  const options = [{
    name: "Order's Demand",
    icon: <Gavel size={13} />,
    desc: 'Action: each creature of your choice within 30 ft that can see/hear you makes a WIS save or is charmed until the end of your next turn (or until it takes damage); those that fail can be made to drop what they hold.',
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Scale size={13} /> Embodiment of the Law</h4>
            <span className="dnd-warmagic__uses">{emb.current}/{emb.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: emb.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < emb.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Cast a 1-action enchantment spell as a bonus action instead. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepEmb(1)} disabled={emb.current >= emb.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepEmb(-1)} disabled={emb.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Megaphone size={12} />
          <span><strong>Voice of Authority</strong> — when a 1st-level-or-higher spell targets an ally, that ally can use their reaction to make one weapon attack.</span>
        </div>
        {level >= 8 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> psychic damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Gavel size={12} />
            <span><strong>Order's Wrath</strong> — when you deal Divine Strike damage, curse the target; the next ally to hit it deals +2d8 psychic (once per turn).</span>
          </div>
        )}
      </div>
    </div>
  );
}
