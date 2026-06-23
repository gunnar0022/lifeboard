import { useEffect, useRef } from 'react';
import { Flame, Wand2 } from 'lucide-react';
import { sorceryPoints, METAMAGIC_OPTIONS } from '../../classProgression';

// Flexible Casting — sorcery-point cost to create a spell slot (and back).
const SLOT_COST = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };

/**
 * Sorcerer — Combat tab. Sorcery points are a spendable pool (scales to level)
 * powering Metamagic and Flexible Casting. Chosen Metamagic options (picked on
 * the Features tab) are listed with their costs for quick reference.
 */
export default function SorcererBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const max = sorceryPoints(level);
  const metamagic = cf.metamagic || [];
  const prevMaxRef = useRef(null);

  useEffect(() => {
    const prev = prevMaxRef.current;
    prevMaxRef.current = max;
    const cur = cf.currentPoints;
    if (cf.maxPoints !== max || cur == null) {
      const grew = prev !== null && max > prev;
      const currentPoints = cur == null ? max
        : grew ? Math.min(cur + (max - (cf.maxPoints || 0)), max) : Math.min(cur, max);
      onUpdate({ classFeature: { ...cf, maxPoints: max, currentPoints } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max]);

  const sp = cf.currentPoints ?? max;
  const setSp = (n) => onUpdate({ classFeature: { ...cf, currentPoints: Math.max(0, Math.min(max, n)) } });

  if (max === 0) {
    return (
      <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
        <div className="dnd-warmagic__reminder">
          <Flame size={12} />
          <span>Font of Magic (sorcery points) unlocks at 2nd level.</span>
        </div>
      </div>
    );
  }

  // Which slots you can afford to create right now via Flexible Casting.
  const affordable = Object.entries(SLOT_COST).filter(([, c]) => c <= sp).map(([lvl]) => lvl);

  // Spend a fixed metamagic cost from the pool (variable-cost options like
  // Twinned Spell are adjusted with the Sorcery Points stepper instead).
  const useMeta = (cost) => {
    const n = parseInt(cost, 10);
    if (!Number.isNaN(n) && sp >= n) setSp(sp - n);
  };

  return (
    <div className="dnd-warmagic dnd-ki" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Flame size={13} /> Sorcery Points</h4>
          <span className="dnd-warmagic__uses">{sp}/{max}</span>
        </div>
        <div className="dnd-ki__counter">
          <button className="dnd-warmagic__btn" onClick={() => setSp(sp - 1)} disabled={sp <= 0}>−</button>
          <div className="dnd-warmagic__pips dnd-ki__pips">
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < sp ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <button className="dnd-warmagic__btn" onClick={() => setSp(sp + 1)} disabled={sp >= max}>+</button>
        </div>
        <span className="dnd-warmagic__note">
          Flexible Casting — create a slot for 1st=2, 2nd=3, 3rd=5, 4th=6, 5th=7 SP.
          {affordable.length > 0 && <> You can afford up to <strong>{['', '1st', '2nd', '3rd', '4th', '5th'][Math.max(...affordable.map(Number))]}</strong> now.</>}
        </span>
      </div>

      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Wand2 size={13} /> Metamagic</h4>
        </div>
        {metamagic.length === 0 ? (
          <span className="dnd-warmagic__note">Choose Metamagic options on the Features tab.</span>
        ) : (
          <div className="dnd-meta">
            {metamagic.map(name => {
              const o = METAMAGIC_OPTIONS.find(x => x.name === name);
              const n = parseInt(o?.cost, 10);
              const fixed = !Number.isNaN(n);
              return (
                <div key={name} className="dnd-meta__row">
                  <div className="dnd-meta__top">
                    <span className="dnd-meta__name">{name}</span>
                    <span className="dnd-meta__cost">{o?.cost}</span>
                    <button
                      className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-meta__use"
                      onClick={() => useMeta(o?.cost)}
                      disabled={!fixed || sp < n}
                      title={fixed ? `Spend ${n} sorcery point${n === 1 ? '' : 's'}` : 'Variable cost — use the Sorcery Points stepper'}
                    >
                      {fixed ? `Use −${n}` : 'Use'}
                    </button>
                  </div>
                  <p className="dnd-meta__desc">{o?.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
