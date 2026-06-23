import { useState, useEffect, useRef } from 'react';
import { Flame, Heart, Sparkles, ChevronRight, Leaf } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Circle of Wildfire — Combat tab. The wildfire spirit is a summon toggle that
 * spends a Wild Shape use (tracked on the base Wild Shape card) and reveals a full
 * stat block on request, so the combat tab stays tidy until you want the numbers.
 * Cauterizing Flames is a proficiency-sized reaction pool (long rest) and Blazing
 * Revival a once-per-long-rest death save. The circle spells list for reference.
 * Accent: druid green.
 */
const CIRCLE_SPELLS = {
  2: 'Burning Hands, Cure Wounds',
  3: 'Flaming Sphere, Scorching Ray',
  5: 'Plant Growth, Revivify',
  7: 'Aura of Life, Fire Shield',
  9: 'Flame Strike, Mass Cure Wounds',
};

export default function WildfireBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const pb = proficiencyBonus(level);
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const saveDC = 8 + pb + wisMod;
  const atk = pb + wisMod;
  const atkStr = atk >= 0 ? `+${atk}` : `${atk}`;
  const spiritHP = 5 + 5 * level;
  const wsLeft = cf.currentUses ?? 0;
  const [showStats, setShowStats] = useState(false);
  const prevPbRef = useRef(null);

  const summoned = cf.wildfireSpirit || false;
  const hasCauterize = level >= 10;
  const hasRevival = level >= 14;
  const cauterize = cf.cauterizingFlames || { max: pb, current: pb };
  const revivalUsed = cf.blazingRevivalUsed || false;

  // Cauterizing Flames pool tracks the proficiency bonus.
  useEffect(() => {
    if (!hasCauterize) return;
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const r = cf.cauterizingFlames;
    if (!r || r.max !== pb) {
      const grew = prev !== null && pb > prev;
      const current = r ? (grew ? Math.min((r.current || 0) + (pb - (r.max || 0)), pb) : Math.min(r.current ?? pb, pb)) : pb;
      onUpdate({ classFeature: { ...cf, cauterizingFlames: { max: pb, current } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, hasCauterize]);

  // Summoning spends a Wild Shape use (from the base Wild Shape tracker).
  const toggleSpirit = () => {
    if (summoned) {
      onUpdate({ classFeature: { ...cf, wildfireSpirit: false } });
    } else if (wsLeft > 0) {
      onUpdate({ classFeature: { ...cf, wildfireSpirit: true, currentUses: wsLeft - 1 } });
    }
  };
  const spendCauterize = () => { if (cauterize.current > 0) onUpdate({ classFeature: { ...cf, cauterizingFlames: { ...cauterize, current: cauterize.current - 1 } } }); };
  const restoreCauterize = () => { if (cauterize.current < cauterize.max) onUpdate({ classFeature: { ...cf, cauterizingFlames: { ...cauterize, current: cauterize.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      {/* Wildfire Spirit manifest card */}
      <div className={`dnd-echo dnd-wildfire ${summoned ? 'dnd-echo--active' : ''}`}>
        <div className="dnd-echo__head">
          <span className="dnd-echo__title"><Flame size={14} /> Wildfire Spirit{summoned ? ' — manifested' : ''}</span>
          <button className="dnd-echo__toggle" onClick={toggleSpirit} disabled={!summoned && wsLeft <= 0}>
            {summoned ? 'Dismiss' : 'Summon'}
          </button>
        </div>
        <div className="dnd-echo__stats">
          <span className="dnd-echo__stat">AC <strong>13</strong></span>
          <span className="dnd-echo__stat">HP <strong>{spiritHP}</strong></span>
          <span className="dnd-echo__stat">30 ft · fly 30</span>
        </div>
        <p className="dnd-echo__note">
          Action, expend a Wild Shape use ({wsLeft} left): appears within 30 ft; creatures within 10 ft make a <strong>DEX save DC {saveDC}</strong> or take <strong>2d6 fire</strong>.
        </p>

        <button className="dnd-wildfire__expand" onClick={() => setShowStats(s => !s)}>
          <ChevronRight size={12} className={showStats ? 'dnd-wildfire__chev--open' : ''} /> {showStats ? 'Hide' : 'Show'} stat block
        </button>
        {showStats && (
          <div className="dnd-wildfire__statblock">
            <div className="dnd-wildfire__action">
              <span className="dnd-wildfire__action-name">Flame Seed</span>
              <span className="dnd-wildfire__action-line"><strong>{atkStr}</strong> to hit, range 60 ft · <strong>1d6+{pb}</strong> fire</span>
            </div>
            <div className="dnd-wildfire__action">
              <span className="dnd-wildfire__action-name">Fiery Teleportation</span>
              <span className="dnd-wildfire__action-line">Spirit + willing allies within 5 ft teleport 15 ft; creatures by the old space make a <strong>DEX save DC {saveDC}</strong> or take <strong>1d6+{pb}</strong> fire.</span>
            </div>
            <p className="dnd-wildfire__sb-note">Dodges unless you spend a bonus action to command it. Immune to fire; lasts 1 hr / until 0 HP / resummon.</p>
          </div>
        )}
      </div>

      {/* Cauterizing Flames */}
      {hasCauterize && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Cauterizing Flames</h4>
            <span className="dnd-warmagic__uses">{cauterize.current}/{cauterize.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: cauterize.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < cauterize.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction at a death-flame space: heal or burn for <strong>2d10+{wisMod}</strong>. Refills on a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={restoreCauterize} disabled={cauterize.current >= cauterize.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendCauterize} disabled={cauterize.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {/* Blazing Revival */}
      {hasRevival && (
        <div className={`dnd-warmagic__section ${revivalUsed ? 'dnd-archfey__spent' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Heart size={13} /> Blazing Revival</h4>
            <span className="dnd-warmagic__uses">{revivalUsed ? 'spent' : '1 / long'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">At 0 HP with the spirit within 120 ft: drop it to 0 and rise with <strong>half your HP</strong>.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, blazingRevivalUsed: !revivalUsed } })}>{revivalUsed ? 'Reset' : 'Use'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Circle Spells reference */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Leaf size={13} /> Circle Spells</h4>
        </div>
        <div className="dnd-druid__circle-spells">
          {[2, 3, 5, 7, 9].map(lvl => (
            <div key={lvl} className={`dnd-druid__circle-row ${level >= lvl ? '' : 'dnd-druid__circle-row--locked'}`}>
              <span className="dnd-druid__circle-lvl">L{lvl}</span>
              <span className="dnd-druid__circle-names">{CIRCLE_SPELLS[lvl]}</span>
            </div>
          ))}
        </div>
      </div>

      {level >= 6 && (
        <div className="dnd-warmagic__reminders">
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Flame size={12} />
            <span><strong>Enhanced Bond</strong> — while the spirit is summoned, add a <strong>d8</strong> to one fire-damage or healing roll of a spell, and your ranged spells can originate from the spirit.</span>
          </div>
        </div>
      )}
    </div>
  );
}
