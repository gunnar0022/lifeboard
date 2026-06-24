import { useEffect, useRef } from 'react';
import { Shield, Zap, Swords, Footprints, EyeOff, Hammer, Magnet } from 'lucide-react';
import { abilityMod, proficiencyBonus, formatMod } from '../../dndUtils';

/**
 * Armorer — Combat tab. The Arcane Armor's two models are a live loadout switch:
 * Guardian (Thunder Gauntlets + the trackable Defensive Field, and the Perfected
 * pull at 15th) vs. Infiltrator (Lightning Launcher + mobility/stealth perks).
 * The active model drives the signature weapon card and which trackers show.
 * State: classFeature.armorModel / defensiveField / perfectedPull.
 */
const ACCENT = 'var(--dnd-class-artificer)';

export default function ArmorerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const intMod = abilityMod(character.abilities?.INT || 10);
  const model = cf.armorModel || 'guardian';
  const isGuardian = model === 'guardian';

  const dfMax = pb;            // Defensive Field uses (Guardian)
  const ppMax = pb;            // Perfected pull uses (Guardian, 15th)
  const df = cf.defensiveField || { current: dfMax, max: dfMax };
  const pp = cf.perfectedPull || { current: ppMax, max: ppMax };
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = { dfMax, ppMax };
    const grow = (stored, max, oldMax) => {
      if (stored == null) return max;
      return oldMax != null && max > oldMax ? Math.min(stored + (max - oldMax), max) : Math.min(stored, max);
    };
    const patch = {};
    if (cf.defensiveField?.max !== dfMax) {
      patch.defensiveField = { max: dfMax, current: grow(cf.defensiveField?.current, dfMax, p?.dfMax) };
    }
    if (level >= 15 && cf.perfectedPull?.max !== ppMax) {
      patch.perfectedPull = { max: ppMax, current: grow(cf.perfectedPull?.current, ppMax, p?.ppMax) };
    }
    if (Object.keys(patch).length) onUpdate({ classFeature: { ...cf, ...patch } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dfMax, ppMax, level]);

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const stepDf = (d) => patch({ defensiveField: { ...df, current: Math.max(0, Math.min(df.max, df.current + d)) } });
  const stepPp = (d) => patch({ perfectedPull: { ...pp, current: Math.max(0, Math.min(pp.max, pp.current + d)) } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Model switch */}
      <div className="dnd-feature-choice__toggle dnd-companion__modes">
        <button className={`dnd-feature-choice__toggle-btn ${isGuardian ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => patch({ armorModel: 'guardian' })}><Shield size={12} /> Guardian</button>
        <button className={`dnd-feature-choice__toggle-btn ${!isGuardian ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => patch({ armorModel: 'infiltrator' })}><EyeOff size={12} /> Infiltrator</button>
      </div>

      {/* Signature weapon for the active model */}
      {isGuardian ? (
        <div className="dnd-sig dnd-sig--smite">
          <div className="dnd-sig__token">1d8</div>
          <div className="dnd-sig__body">
            <span className="dnd-sig__title"><Swords size={13} /> Thunder Gauntlets</span>
            <span className="dnd-sig__desc">
              Simple melee, <strong>1d8 thunder</strong>, {formatMod(pb + intMod)} to hit (INT). A creature you hit has <strong>disadvantage</strong> on attacks against anyone but you until your next turn.
            </span>
          </div>
        </div>
      ) : (
        <div className="dnd-sig dnd-sig--planar">
          <div className="dnd-sig__token">1d6</div>
          <div className="dnd-sig__body">
            <span className="dnd-sig__title"><Zap size={13} /> Lightning Launcher</span>
            <span className="dnd-sig__desc">
              Simple ranged (90/300 ft), <strong>1d6 lightning</strong>, {formatMod(pb + intMod)} to hit (INT). Once per turn, a creature you hit takes an extra <strong>1d6 lightning</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Guardian: Defensive Field tracker */}
      {isGuardian && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Shield size={13} /> Defensive Field</h4>
            <span className="dnd-warmagic__uses">{df.current}/{df.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: df.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < df.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Bonus action: gain <strong>{level}</strong> temp HP (= artificer level), replacing any current temp HP. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepDf(1)} disabled={df.current >= df.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepDf(-1)} disabled={df.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {/* Guardian: Perfected Armor pull (15th) */}
      {isGuardian && level >= 15 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Magnet size={13} /> Perfected Armor</h4>
            <span className="dnd-warmagic__uses">{pp.current}/{pp.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: pp.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < pp.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction: a Huge-or-smaller creature ending its turn within 30 ft makes a STR save or is pulled up to 25 ft; if it lands within 5 ft, make a melee attack. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepPp(1)} disabled={pp.current >= pp.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepPp(-1)} disabled={pp.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Hammer size={12} />
          <span><strong>Arcane Armor</strong> — your armor is your spellcasting focus, ignores STR requirements, can't be removed against your will, and replaces missing limbs. Swap models on a rest with smith's tools.</span>
        </div>
        {!isGuardian && (
          <>
            <div className="dnd-warmagic__reminder">
              <Footprints size={12} />
              <span><strong>Powered Steps</strong> — +5 ft walking speed.</span>
            </div>
            <div className="dnd-warmagic__reminder">
              <EyeOff size={12} />
              <span><strong>Dampening Field</strong> — advantage on Stealth (DEX) checks.</span>
            </div>
          </>
        )}
        {level >= 5 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Extra Attack</strong> — attack twice when you take the Attack action.</span>
          </div>
        )}
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <Hammer size={12} />
            <span><strong>Armor Modifications</strong> — armor, boots, helmet &amp; its weapon each take an infusion (max infused items +2 for armor parts). Infuse them on the Combat tab's workbench.</span>
          </div>
        )}
        {!isGuardian && level >= 15 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Zap size={12} />
            <span><strong>Perfected Armor</strong> — a creature hit by your Lightning Launcher glimmers: dim light, disadvantage on attacks vs. you, next attack against it has advantage and deals +1d6 lightning.</span>
          </div>
        )}
      </div>
    </div>
  );
}
