import { Bomb, Crosshair, Flame, ShieldPlus, Wand2, Plus, Heart } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { buildCannon, CANNON_TYPES } from '../../rules/shared/companions';

/**
 * Artillerist — Combat tab. The Eldritch Cannon is an HP-tracked emplacement:
 * deploy a cannon, pick its type (Flamethrower / Force Ballista / Protector),
 * track its HP (= 5 × level), and dismiss or — from 9th — detonate it. Fortified
 * Position (15th) raises the cap to two cannons. Arcane Firearm and the half-cover
 * aura ride as reminders. State: classFeature.cannons = [{ id, type, hpCurrent }].
 */
const ACCENT = 'var(--dnd-class-artificer)';
const TYPE_ICON = { flamethrower: <Flame size={14} />, ballista: <Crosshair size={14} />, protector: <ShieldPlus size={14} /> };
const newId = () => `cn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function CannonCard({ cannon, ctx, level, onChange, onRemove, canDetonate }) {
  const block = buildCannon(cannon.type, ctx);
  const hpMax = block.hpMax;
  const hpCurrent = Math.min(cannon.hpCurrent ?? hpMax, hpMax);
  const hpPct = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0;
  const barColor = hpPct > 60 ? 'var(--dnd-hp-healthy)' : hpPct > 25 ? 'var(--dnd-hp-wounded)' : 'var(--dnd-hp-critical)';
  const adjustHp = (d) => onChange({ ...cannon, hpCurrent: Math.max(0, Math.min(hpMax, hpCurrent + d)) });

  return (
    <div className="dnd-cannon">
      <div className="dnd-cannon__pick">
        {CANNON_TYPES.map(t => (
          <button key={t.id}
            className={`dnd-warmagic__pick-btn ${cannon.type === t.id ? 'dnd-warmagic__pick-btn--active' : ''}`}
            onClick={() => onChange({ ...cannon, type: t.id })}>
            {t.label.replace('Force ', '')}
          </button>
        ))}
      </div>

      <div className="dnd-cannon__top">
        <span className="dnd-cannon__title">{TYPE_ICON[cannon.type]} {block.label}</span>
        <span className="dnd-cannon__ac">AC {block.ac}</span>
      </div>

      <div className="dnd-companion__hp">
        <div className="dnd-companion__hp-head">
          <span className="dnd-companion__stat-lbl"><Heart size={11} /> HP</span>
          <span className="dnd-companion__hp-num">{hpCurrent}<span className="dnd-companion__hp-max">/{hpMax}</span></span>
        </div>
        <div className="dnd-companion__hp-bar">
          <div className="dnd-companion__hp-fill" style={{ width: `${Math.min(100, hpPct)}%`, background: barColor }} />
        </div>
        <div className="dnd-companion__hp-btns">
          <button onClick={() => adjustHp(-5)}>−5</button>
          <button onClick={() => adjustHp(-1)}>−1</button>
          <button onClick={() => adjustHp(1)}>+1</button>
          <button onClick={() => adjustHp(5)}>+5</button>
        </div>
      </div>

      <p className="dnd-cannon__activation"><strong>Activate (bonus action):</strong> {block.action}</p>

      <div className="dnd-cannon__btns">
        <button className="dnd-warmagic__btn" onClick={onRemove}>Dismiss</button>
        {canDetonate && (
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={onRemove} title="Destroy the cannon: 3d8 force in 20 ft">
            <Bomb size={11} /> Detonate
          </button>
        )}
      </div>
    </div>
  );
}

export default function ArtilleristBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const intMod = abilityMod(character.abilities?.INT || 10);
  const ctx = { level, intMod, spellDC: 8 + pb + intMod };

  const cannons = cf.cannons || [];
  const maxCannons = level >= 15 ? 2 : 1;

  const patch = (next) => onUpdate({ classFeature: { ...cf, cannons: next } });
  const deploy = () => patch([...cannons, { id: newId(), type: 'flamethrower', hpCurrent: 5 * level }]);
  const change = (id, updated) => patch(cannons.map(c => c.id === id ? updated : c));
  const remove = (id) => patch(cannons.filter(c => c.id !== id));

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-artificer__bench">
        <div className="dnd-artificer__bench-head">
          <h4 className="dnd-warmagic__subtitle"><Crosshair size={14} /> Eldritch Cannon</h4>
          <span className="dnd-warmagic__uses">{cannons.length}/{maxCannons} deployed</span>
        </div>

        {cannons.length === 0 ? (
          <p className="dnd-artificer__hint">No cannon deployed. Create one as an action (then once per long rest, or by expending a spell slot).</p>
        ) : (
          <div className="dnd-cannon__list">
            {cannons.map(c => (
              <CannonCard
                key={c.id} cannon={c} ctx={ctx} level={level}
                onChange={(u) => change(c.id, u)} onRemove={() => remove(c.id)}
                canDetonate={level >= 9}
              />
            ))}
          </div>
        )}

        {cannons.length < maxCannons && (
          <button className="dnd-artificer__add" onClick={deploy}>
            <Plus size={13} /> Deploy cannon
          </button>
        )}
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 5 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wand2 size={12} />
            <span><strong>Arcane Firearm</strong> — your sigil-carved wand/staff/rod is your focus; casting an artificer spell through it adds <strong>1d8</strong> to one damage roll.</span>
          </div>
        )}
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <Bomb size={12} />
            <span><strong>Explosive Cannon</strong> — cannon damage rolls already include +1d8. Detonate (action) destroys a cannon: each creature within 20 ft makes a DEX save (your DC) for 3d8 force (half on success).</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldPlus size={12} />
            <span><strong>Fortified Position</strong> — you and allies have half cover within 10 ft of a cannon, and you can field two at once.</span>
          </div>
        )}
      </div>
    </div>
  );
}
