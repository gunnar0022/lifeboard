import { useState } from 'react';
import { Skull, Heart, Plus, Minus, X, Bone, ShieldOff, Crown } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';

const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * School of Necromancy — Combat tab. Two engines drive the reaper: Grim Harvest,
 * a quick life-drain calculator that pours stolen HP straight into your pool, and
 * the Undead Thralls roster — your shambling minions, each bearing the +wizard-
 * level HP and +proficiency damage your magic grants. Inured to Undeath and
 * Command Undead ride along as reminders.
 */
export default function NecromancyBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const pb = proficiencyBonus(level);
  const combat = character.combat || {};

  const [harvestLvl, setHarvestLvl] = useState(1);
  const [isNecro, setIsNecro] = useState(true);
  const harvestHp = harvestLvl * (isNecro ? 3 : 2);

  const thralls = cf.thralls || [];
  const setThralls = (next) => onUpdate({ classFeature: { ...cf, thralls: next } });

  const reap = () => {
    const max = combat.hpMax || 0;
    const next = Math.min(max, (combat.hpCurrent || 0) + harvestHp);
    onUpdate({ combat: { ...combat, hpCurrent: next } });
  };

  const addThrall = (name, baseHp) => {
    const max = baseHp + level; // Undead Thralls: +wizard level to HP max
    setThralls([...thralls, { id: uid(), name, hp: max, max }]);
  };
  const updateThrall = (id, patch) => setThralls(thralls.map(t => t.id === id ? { ...t, ...patch } : t));
  const removeThrall = (id) => setThralls(thralls.filter(t => t.id !== id));
  const damageThrall = (t, d) => updateThrall(t.id, { hp: Math.max(0, Math.min(t.max, (t.hp || 0) + d)) });

  const hasThralls = level >= 6;
  const hasInured = level >= 10;
  const hasCommand = level >= 14;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      {/* Grim Harvest — life reaper */}
      <div className="dnd-reaper">
        <div className="dnd-reaper__head">
          <h4 className="dnd-reaper__title"><Skull size={14} /> Grim Harvest</h4>
          <span className="dnd-reaper__yield"><Heart size={12} /> +{harvestHp} HP</span>
        </div>
        <div className="dnd-reaper__controls">
          <span className="dnd-reaper__lbl">Spell level</span>
          <div className="dnd-sculpt__stepper">
            <button className="dnd-warmagic__btn" onClick={() => setHarvestLvl(l => Math.max(1, l - 1))} disabled={harvestLvl <= 1}><Minus size={11} /></button>
            <span className="dnd-sculpt__lvl">{harvestLvl}</span>
            <button className="dnd-warmagic__btn" onClick={() => setHarvestLvl(l => Math.min(9, l + 1))} disabled={harvestLvl >= 9}><Plus size={11} /></button>
          </div>
          <button className={`dnd-reaper__toggle ${isNecro ? 'dnd-reaper__toggle--on' : ''}`} onClick={() => setIsNecro(v => !v)}
            title="Necromancy spells reap 3× the level instead of 2×">
            {isNecro ? 'Necromancy ×3' : 'Other ×2'}
          </button>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Once per turn when a spell (1st+) kills a creature (not constructs/undead), drain life.</span>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={reap} disabled={(combat.hpCurrent || 0) >= (combat.hpMax || 0)}>Reap</button>
        </div>
      </div>

      {/* Undead Thralls roster */}
      {hasThralls && (
        <div className="dnd-thralls">
          <div className="dnd-thralls__head">
            <h4 className="dnd-warmagic__subtitle"><Bone size={13} /> Undead Thralls</h4>
            <span className="dnd-thralls__bonus">+{level} HP · +{pb} dmg</span>
          </div>
          {thralls.length > 0 && (
            <div className="dnd-thralls__list">
              {thralls.map(t => (
                <div key={t.id} className={`dnd-thrall ${t.hp <= 0 ? 'dnd-thrall--down' : ''}`}>
                  <input className="dnd-thrall__name" value={t.name} onChange={(e) => updateThrall(t.id, { name: e.target.value })} />
                  <div className="dnd-thrall__hp">
                    <button className="dnd-warmagic__btn" onClick={() => damageThrall(t, -1)}><Minus size={10} /></button>
                    <span className="dnd-thrall__hpnum">{t.hp}<small>/{t.max}</small></span>
                    <button className="dnd-warmagic__btn" onClick={() => damageThrall(t, 1)}><Plus size={10} /></button>
                  </div>
                  <button className="dnd-thrall__remove" onClick={() => removeThrall(t.id)} title="Dismiss"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="dnd-thralls__add">
            <button className="dnd-warmagic__btn" onClick={() => addThrall('Skeleton', 13)}>+ Skeleton</button>
            <button className="dnd-warmagic__btn" onClick={() => addThrall('Zombie', 22)}>+ Zombie</button>
            <button className="dnd-warmagic__btn" onClick={() => addThrall('Undead', 10)}>+ Other</button>
          </div>
        </div>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {hasInured && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldOff size={12} />
            <span><strong>Inured to Undeath</strong> — resistance to necrotic damage, and your HP maximum can't be reduced.</span>
          </div>
        )}
        {hasCommand && (
          <div className="dnd-warmagic__reminder">
            <Crown size={12} />
            <span><strong>Command Undead</strong> — action: an undead within 60 ft makes a CHA save or obeys you. INT 8+ rolls with advantage; INT 12+ can re-save each hour to break free.</span>
          </div>
        )}
      </div>
    </div>
  );
}
