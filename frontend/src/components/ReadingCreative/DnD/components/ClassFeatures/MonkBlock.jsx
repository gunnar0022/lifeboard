import { useEffect, useRef } from 'react';
import { Wind, Footprints, Shield, Zap } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { martialArtsDie, kiPoints, unarmoredMovement } from '../../classProgression';

/**
 * Monk — Combat tab. Ki is a spendable point pool (not magic): the counter
 * scales to monk level and quick-spend chips let you burn ki on the common
 * features. Ki recharges on a short or long rest.
 */
export default function MonkBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const max = kiPoints(level);
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const kiDC = 8 + proficiencyBonus(level) + wisMod;
  const die = martialArtsDie(level);
  const move = unarmoredMovement(level);
  const prevMaxRef = useRef(null);

  // Keep the ki pool synced to monk level; grant new point(s) when it rises.
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

  const ki = cf.currentPoints ?? max;
  const setKi = (n) => onUpdate({ classFeature: { ...cf, currentPoints: Math.max(0, Math.min(max, n)) } });
  const spend = (cost) => { if (ki >= cost) setKi(ki - cost); };

  const chips = [
    { label: 'Flurry of Blows', cost: 1, icon: <Zap size={11} /> },
    { label: 'Patient Defense', cost: 1, icon: <Shield size={11} /> },
    { label: 'Step of the Wind', cost: 1, icon: <Footprints size={11} /> },
    { label: 'Stunning Strike', cost: 1, icon: <Zap size={11} />, min: 5 },
    { label: 'Empty Body', cost: 4, icon: <Wind size={11} />, min: 18 },
  ].filter(c => !c.min || level >= c.min);

  if (max === 0) {
    return (
      <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-monk)' }}>
        <div className="dnd-warmagic__reminder">
          <Zap size={12} />
          <span><strong>Martial Arts</strong> die <strong>1{die}</strong>. Ki unlocks at 2nd level.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dnd-warmagic dnd-ki" style={{ '--block-accent': 'var(--dnd-class-monk)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Wind size={13} /> Ki Points</h4>
          <span className="dnd-warmagic__uses">{ki}/{max} · DC {kiDC}</span>
        </div>
        <div className="dnd-ki__counter">
          <button className="dnd-warmagic__btn" onClick={() => setKi(ki - 1)} disabled={ki <= 0}>−</button>
          <div className="dnd-warmagic__pips dnd-ki__pips">
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < ki ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <button className="dnd-warmagic__btn" onClick={() => setKi(ki + 1)} disabled={ki >= max}>+</button>
        </div>
        <div className="dnd-ki__chips">
          {chips.map(c => (
            <button key={c.label} className="dnd-ki__chip" onClick={() => spend(c.cost)} disabled={ki < c.cost}>
              {c.icon}{c.label} <span className="dnd-ki__cost">{c.cost}</span>
            </button>
          ))}
        </div>
        <span className="dnd-warmagic__note">Recharges on a short or long rest.</span>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Zap size={12} />
          <span><strong>Martial Arts</strong> die <strong>1{die}</strong> · <strong>Unarmored Movement</strong> +{move} ft.</span>
        </div>
      </div>
    </div>
  );
}
