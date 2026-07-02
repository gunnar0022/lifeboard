import { Heart, PawPrint } from 'lucide-react';
import CompanionStatBlock from './CompanionStatBlock';
import { applyHpDelta } from '../../rules/shared/summons';

/**
 * CompanionCard — Combat-tab wrapper around a computed companion stat block.
 * Adds the one thing a summoned creature needs tracked at the table: live hit
 * points (damage / heal, temp HP, depletes temp first like the hero's StatBlock).
 * Live state lives in classFeature.companion ({ name, hpCurrent, hpTemp }); the
 * stat numbers themselves stay derived, so a level-up recomputes them cleanly.
 *
 * `headerExtra` (controls like a variant/essence picker) and `children`
 * (level-gated extras) let each subclass compose around the shared core.
 */
export default function CompanionCard({
  block, character, onUpdate, accent = 'var(--dnd-class-ranger)',
  title = 'Companion', icon = <PawPrint size={14} />, headerExtra = null, children = null,
}) {
  const cf = character.classFeature || {};
  const comp = cf.companion || {};
  const hpMax = block.hpMax;
  const hpCurrent = Math.min(comp.hpCurrent ?? hpMax, hpMax);
  const hpTemp = comp.hpTemp || 0;
  const hpPct = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0;
  const barColor = hpPct > 60 ? 'var(--dnd-hp-healthy)' : hpPct > 25 ? 'var(--dnd-hp-wounded)' : 'var(--dnd-hp-critical)';

  const patch = (fields) => onUpdate({ classFeature: { ...cf, companion: { ...comp, ...fields } } });

  const adjustHp = (delta) => patch(applyHpDelta({ hpCurrent, hpTemp, hpMax }, delta));

  const hpSlot = (
    <div className="dnd-companion__hp">
      <div className="dnd-companion__hp-head">
        <span className="dnd-companion__stat-lbl"><Heart size={11} /> HP</span>
        <span className="dnd-companion__hp-num">
          {hpCurrent}<span className="dnd-companion__hp-max">/{hpMax}</span>
          {hpTemp > 0 && <span className="dnd-companion__hp-temp-num"> +{hpTemp}</span>}
        </span>
      </div>
      <div className="dnd-companion__hp-bar">
        <div className="dnd-companion__hp-fill" style={{ width: `${Math.min(100, hpPct)}%`, background: barColor }} />
      </div>
      <div className="dnd-companion__hp-btns">
        <button onClick={() => adjustHp(-5)}>−5</button>
        <button onClick={() => adjustHp(-1)}>−1</button>
        <button onClick={() => adjustHp(1)}>+1</button>
        <button onClick={() => adjustHp(5)}>+5</button>
        <input type="number" className="dnd-companion__temp-input" value={hpTemp} title="Temp HP"
          onChange={e => patch({ hpTemp: Math.max(0, parseInt(e.target.value) || 0) })} />
      </div>
    </div>
  );

  return (
    <div className="dnd-companion" style={{ '--block-accent': accent }}>
      <div className="dnd-companion__header">
        <span className="dnd-companion__title">{icon} {title}</span>
        {headerExtra}
      </div>

      <input
        className="dnd-field dnd-companion__name"
        value={comp.name || ''}
        placeholder={`Name your ${block.type}…`}
        onChange={e => patch({ name: e.target.value })}
      />

      <CompanionStatBlock block={block} accent={accent} hpSlot={hpSlot} />

      {children}
    </div>
  );
}
