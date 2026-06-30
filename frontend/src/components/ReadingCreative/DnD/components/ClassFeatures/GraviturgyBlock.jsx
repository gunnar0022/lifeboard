import { useEffect, useRef } from 'react';
import { Feather, Weight, Magnet, Orbit, Move } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Graviturgy Magic — Combat tab. Adjust Density is a live weight-warp toggle
 * (halve ↔ double, with the rider effects spelled out). Violent Attraction is an
 * INT-mod reaction pool that adds momentum to a hit or a fall. Event Horizon is
 * the capstone field toggle with its long-rest / 3rd-level-slot recharge. Gravity
 * Well rides along as a reminder.
 */
export default function GraviturgyBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const vaMax = Math.max(1, intMod);

  const density = cf.adjustDensity || { active: false, mode: 'halved', target: '' };
  const va = cf.violentAttraction || { current: vaMax, max: vaMax };
  const ehActive = !!cf.eventHorizonActive;
  const ehUsed = !!cf.eventHorizonUsed;
  const sizeLimit = level >= 10 ? 'Huge' : 'Large';
  const prevVaRef = useRef(null);

  // Violent Attraction pool tracks the Intelligence modifier.
  useEffect(() => {
    if (level < 10) return;
    const prev = prevVaRef.current;
    prevVaRef.current = vaMax;
    const v = cf.violentAttraction;
    if (!v || v.max !== vaMax) {
      const grew = prev !== null && vaMax > prev;
      const current = v ? (grew ? Math.min((v.current || 0) + (vaMax - (v.max || 0)), vaMax) : Math.min(v.current ?? vaMax, vaMax)) : vaMax;
      onUpdate({ classFeature: { ...cf, violentAttraction: { current, max: vaMax } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaMax, level]);

  const setDensity = (next) => onUpdate({ classFeature: { ...cf, adjustDensity: { ...density, ...next } } });
  const spendVA = () => { if (va.current > 0) onUpdate({ classFeature: { ...cf, violentAttraction: { ...va, current: va.current - 1 } } }); };
  const gainVA = () => { if (va.current < va.max) onUpdate({ classFeature: { ...cf, violentAttraction: { ...va, current: va.current + 1 } } }); };
  const toggleEH = () => onUpdate({ classFeature: { ...cf, eventHorizonActive: !ehActive, eventHorizonUsed: ehActive ? ehUsed : true } });
  const rechargeEH = () => onUpdate({ classFeature: { ...cf, eventHorizonUsed: false } });

  const halved = density.mode === 'halved';

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-warlock)' }}>
      {/* Adjust Density */}
      <div className={`dnd-density ${density.active ? 'dnd-density--on' : ''} ${density.active ? (halved ? 'dnd-density--light' : 'dnd-density--heavy') : ''}`}>
        <div className="dnd-density__head">
          <h4 className="dnd-density__title">{halved ? <Feather size={14} /> : <Weight size={14} />} Adjust Density</h4>
          <span className="dnd-density__size">{sizeLimit} or smaller · 30 ft · conc.</span>
        </div>
        {density.active ? (
          <>
            <div className="dnd-density__toggle">
              <button className={`dnd-density__mode ${halved ? 'dnd-density__mode--sel' : ''}`} onClick={() => setDensity({ mode: 'halved' })}>
                <Feather size={12} /> Halved
              </button>
              <button className={`dnd-density__mode ${!halved ? 'dnd-density__mode--sel' : ''}`} onClick={() => setDensity({ mode: 'doubled' })}>
                <Weight size={12} /> Doubled
              </button>
            </div>
            <input className="dnd-density__input" placeholder="target…" value={density.target} onChange={(e) => setDensity({ target: e.target.value })} />
            <span className="dnd-density__effect">
              {halved
                ? '+10 ft speed · jump twice as far · disadvantage on STR checks & saves'
                : '−10 ft speed · advantage on STR checks & saves'}
            </span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-density__end" onClick={() => setDensity({ active: false })}>Release</button>
          </>
        ) : (
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Action: halve or double a target's weight for 1 minute (concentration).</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setDensity({ active: true })}>Warp</button>
          </div>
        )}
      </div>

      {/* Violent Attraction */}
      {level >= 10 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Magnet size={13} /> Violent Attraction</h4>
            <span className="dnd-warmagic__uses">{va.current}/{va.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: va.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < va.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction: +1d10 to a weapon hit (within 60 ft), or +2d10 to a creature's fall damage.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={gainVA} disabled={va.current >= va.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendVA} disabled={va.current <= 0}>Pull</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Horizon */}
      {level >= 14 && (
        <div className={`dnd-horizon ${ehActive ? 'dnd-horizon--on' : ''}`}>
          <div className="dnd-horizon__head">
            <h4 className="dnd-horizon__title"><Orbit size={14} /> Event Horizon</h4>
            <span className="dnd-horizon__state">{ehActive ? 'collapsing' : ehUsed ? 'spent' : 'ready'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">1-min field (conc.): hostiles starting within 30 ft make a STR save — fail: 2d10 force &amp; speed 0; success: half &amp; movement costs double.</span>
            <div className="dnd-warmagic__btns">
              {ehActive
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={toggleEH}>Collapse</button>
                : ehUsed
                  ? <button className="dnd-warmagic__btn" onClick={rechargeEH} title="Recharge by expending a 3rd+ slot">Recharge</button>
                  : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={toggleEH}>Emit</button>}
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Move size={12} />
          <span><strong>Gravity Well</strong> — when you cast a spell on a creature (willing, hit by attack, or failed save), you can slide it 5 ft to an unoccupied space.</span>
        </div>
      </div>
    </div>
  );
}
