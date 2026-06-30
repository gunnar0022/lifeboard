import { useState } from 'react';
import { Flame, ShieldCheck, Zap, Skull, Plus, Minus } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * School of Evocation — Combat tab. Overchannel is the dangerous centerpiece: a
 * backlash meter showing the cost of the NEXT max-damage cast (free once, then
 * escalating necrotic). Sculpt Spells gets a live "how many allies are safe?"
 * dial. Empowered Evocation and Potent Cantrip ride along as reminders.
 */
export default function EvocationBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const intBonus = Math.max(1, abilityMod(character.abilities?.INT || 10));

  const uses = cf.overchannel?.uses || 0;
  const [sculptLvl, setSculptLvl] = useState(1);

  // Backlash dice-per-spell-level for the NEXT overchannel: free first, then 2d12, 3d12, …
  const nextDice = uses === 0 ? 0 : uses + 1;

  const overchannel = () => onUpdate({ classFeature: { ...cf, overchannel: { uses: uses + 1 } } });
  const resetOver = () => onUpdate({ classFeature: { ...cf, overchannel: { uses: 0 } } });

  const hasEmpowered = level >= 10;
  const hasOverchannel = level >= 14;
  const hasPotent = level >= 6;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
      {/* Sculpt Spells dial */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><ShieldCheck size={13} /> Sculpt Spells</h4>
        </div>
        <div className="dnd-sculpt">
          <span className="dnd-sculpt__label">Spell level</span>
          <div className="dnd-sculpt__stepper">
            <button className="dnd-warmagic__btn" onClick={() => setSculptLvl(l => Math.max(1, l - 1))} disabled={sculptLvl <= 1}><Minus size={11} /></button>
            <span className="dnd-sculpt__lvl">{sculptLvl}</span>
            <button className="dnd-warmagic__btn" onClick={() => setSculptLvl(l => Math.min(9, l + 1))} disabled={sculptLvl >= 9}><Plus size={11} /></button>
          </div>
          <div className="dnd-sculpt__out">
            <strong>{1 + sculptLvl}</strong> creature{1 + sculptLvl === 1 ? '' : 's'} auto-succeed &amp; take no damage
          </div>
        </div>
      </div>

      {/* Overchannel — the backlash meter */}
      {hasOverchannel && (
        <div className={`dnd-overchannel ${uses > 1 ? 'dnd-overchannel--hot' : ''}`}>
          <div className="dnd-overchannel__head">
            <h4 className="dnd-overchannel__title"><Skull size={14} /> Overchannel</h4>
            <span className="dnd-overchannel__count">used {uses}×</span>
          </div>
          <div className="dnd-overchannel__meter">
            <span className="dnd-overchannel__next">
              {nextDice === 0
                ? <>Next cast: <strong className="dnd-overchannel__safe">FREE</strong> — maximum damage, no backlash</>
                : <>Next cast backlash: <strong className="dnd-overchannel__cost">{nextDice}d12</strong> necrotic / spell level (ignores resist &amp; immunity)</>}
            </span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Max-damage a 1st–5th-level damaging spell. Backlash escalates until a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-overchannel__btn" onClick={overchannel}><Flame size={11} /> Overchannel</button>
              {uses > 0 && <button className="dnd-warmagic__btn" onClick={resetOver}>Reset</button>}
            </div>
          </div>
        </div>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {hasPotent && (
          <div className="dnd-warmagic__reminder">
            <Flame size={12} />
            <span><strong>Potent Cantrip</strong> — a creature that saves against your damaging cantrip still takes half damage (no added effect).</span>
          </div>
        )}
        {hasEmpowered && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Zap size={12} />
            <span><strong>Empowered Evocation</strong> — add <strong>+{intBonus}</strong> (INT) to one damage roll of any wizard evocation spell you cast.</span>
          </div>
        )}
      </div>
    </div>
  );
}
