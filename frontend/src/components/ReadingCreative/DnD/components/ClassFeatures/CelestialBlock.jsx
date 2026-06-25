import { useEffect, useRef } from 'react';
import { HeartPulse, Sun, ShieldPlus, Flame } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { OnceToggle } from './trackers';

/**
 * The Celestial — Combat tab. The centerpiece is the Healing Light pool (1 +
 * warlock level d6s), spent a few dice at a time as a bonus-action heal; it
 * keeps its max synced to level. Radiant Soul is a passive reminder, Celestial
 * Resistance grants self temp HP on demand, and Searing Vengeance is a once-per-
 * long-rest revival. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';

export default function CelestialBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const spendMax = Math.max(1, chaMod);            // dice per heal (min 1)
  const poolMax = 1 + level;
  const halfMax = Math.floor((character.combat?.hpMax || 0) / 2);
  const tempHpSelf = Math.max(0, level + chaMod);
  const prev = useRef(null);

  // Keep the Healing Light pool's max in sync with level (grow tops up, shrink clamps).
  useEffect(() => {
    const p = prev.current;
    prev.current = poolMax;
    if (cf.healingLight?.max !== poolMax) {
      const stored = cf.healingLight?.current;
      const next = stored == null ? poolMax
        : (p != null && poolMax > p ? Math.min(stored + (poolMax - p), poolMax) : Math.min(stored, poolMax));
      onUpdate({ classFeature: { ...cf, healingLight: { max: poolMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolMax]);

  const pool = cf.healingLight || { current: poolMax, max: poolMax };
  const stepPool = (d) =>
    onUpdate({ classFeature: { ...cf, healingLight: { ...pool, current: Math.max(0, Math.min(pool.max, pool.current + d)) } } });
  const spendHeal = () =>
    onUpdate({ classFeature: { ...cf, healingLight: { ...pool, current: Math.max(0, pool.current - Math.min(spendMax, pool.current)) } } });

  const grantResistanceTemp = () => onUpdate({ classFeature: { ...cf, _grantTempHp: tempHpSelf } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Healing Light — d6 pool */}
      <div className={`dnd-sig ${pool.current > 0 ? 'dnd-sig--locked' : 'dnd-sig--empty'}`} style={{ '--block-accent': ACCENT }}>
        <div className="dnd-sig__token">{pool.current}<span style={{ fontSize: '0.55rem', opacity: 0.85 }}>d6</span></div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><HeartPulse size={13} /> Healing Light</span>
          <span className="dnd-sig__desc">
            Bonus action: heal a creature within 60 ft, spending up to <strong>{spendMax}</strong> {spendMax === 1 ? 'die' : 'dice'} (CHA mod). Pool <strong>{pool.current}/{pool.max}</strong> d6 · refills on a long rest.
          </span>
          <div className="dnd-warmagic__row">
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepPool(-1)} disabled={pool.current <= 0}>−1</button>
              <button className="dnd-warmagic__btn" onClick={() => stepPool(1)} disabled={pool.current >= pool.max}>+1</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendHeal} disabled={pool.current <= 0}>
                Heal (−{Math.min(spendMax, pool.current) || 0})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Flame size={12} />
            <span><strong>Radiant Soul</strong> — resistance to radiant damage. Add your CHA modifier (+{Math.max(0, chaMod)}) to one radiant or fire damage roll of a spell you cast.</span>
          </div>
        )}
      </div>

      {/* Celestial Resistance — self temp HP on rest */}
      {level >= 10 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><ShieldPlus size={13} /> Celestial Resistance</h4>
            <span className="dnd-warmagic__chip">+{tempHpSelf} temp HP</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">
              On a short or long rest: gain <strong>{tempHpSelf}</strong> temp HP (level + CHA). Up to five allies each gain <strong>{Math.max(0, Math.floor(level / 2) + chaMod)}</strong> (½ level + CHA).
            </span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={grantResistanceTemp}>Gain</button>
            </div>
          </div>
        </div>
      )}

      {/* Searing Vengeance — once per long rest */}
      {level >= 14 && (
        <OnceToggle
          icon={<Sun size={13} />} title="Searing Vengeance" rest="long rest"
          used={!!cf.searingVengeanceUsed}
          note={<>Instead of a death save at the start of your turn: regain <strong>{halfMax || 'half max'}</strong> HP and stand. Each chosen creature within 30 ft takes <strong>2d8 + {Math.max(0, chaMod)}</strong> radiant and is blinded until end of turn.</>}
          onToggle={() => onUpdate({ classFeature: { ...cf, searingVengeanceUsed: !cf.searingVengeanceUsed } })}
        />
      )}
    </div>
  );
}
