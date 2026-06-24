import { Flame, Wind, ShieldHalf, Sparkles } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { buildDrake, DRAKE_ESSENCES } from '../../rules/shared/companions';
import CompanionCard from './CompanionCard';

/**
 * Drakewarden — Combat tab. The drake card (shared CompanionCard, computed stat
 * block) carries an essence picker and a summon/recharge state on top of live
 * HP. Below it sit the two real resources: Drake's Breath (1 / long rest, or a
 * 3rd-level+ slot) with a damage-type picker and scaling dice, and — at 15th —
 * the Reflexive Resistance reaction pool (proficiency-bonus uses / long rest).
 */
const ACCENT = 'var(--dnd-class-ranger)';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DrakewardenBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const comp = cf.companion || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const spellDC = 8 + pb + wisMod;
  const ctx = { level, pb, wisMod };

  const essence = comp.essence || 'fire';
  const summoned = comp.summoned ?? true;
  const drakeBlock = buildDrake(essence, ctx);

  const setComp = (fields) => onUpdate({ classFeature: { ...cf, companion: { ...comp, ...fields } } });
  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  const essencePicker = (
    <div className="dnd-warmagic__pick dnd-companion__pick">
      {DRAKE_ESSENCES.map(e => (
        <button key={e}
          className={`dnd-warmagic__pick-btn ${essence === e ? 'dnd-warmagic__pick-btn--active' : ''}`}
          onClick={() => setComp({ essence: e })}>{cap(e)}</button>
      ))}
    </div>
  );

  // Drake's Breath — single long-rest use.
  const breathUsed = cf.drakeBreathUsed || false;
  const breathType = cf.drakeBreathType || essence;
  const breathDice = level >= 15 ? '10d6' : '8d6';

  // Reflexive Resistance — PB uses per long rest.
  const reflexUsed = cf.reflexUsed || 0;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Summon state */}
      <div className="dnd-companion__summon">
        <button
          className={`dnd-warmagic__btn ${summoned ? 'dnd-warmagic__btn--spend' : ''}`}
          onClick={() => setComp({ summoned: !summoned })}
        >{summoned ? 'Dismiss' : 'Summon'}</button>
        <span className="dnd-warmagic__note">
          {summoned ? 'Drake is summoned (shares your initiative, acts after you).'
            : 'Drake not summoned.'} Re-summon once per long rest, or expend a spell slot.
        </span>
      </div>

      {summoned && (
        <CompanionCard block={drakeBlock} character={character} onUpdate={onUpdate} accent={ACCENT}
          title="Drake Companion" icon={<Flame size={14} />} headerExtra={essencePicker} />
      )}

      {/* Drake's Breath (11th) */}
      {level >= 11 && (
        <div className={`dnd-warmagic__section ${breathUsed ? 'dnd-archfey__spent' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Wind size={13} /> Drake's Breath</h4>
            <span className="dnd-warmagic__uses">{breathUsed ? 'spent' : '1 / long'}</span>
          </div>
          <div className="dnd-companion__pick dnd-warmagic__pick">
            {DRAKE_ESSENCES.map(e => (
              <button key={e}
                className={`dnd-warmagic__pick-btn ${breathType === e ? 'dnd-warmagic__pick-btn--active' : ''}`}
                onClick={() => patchCf({ drakeBreathType: e })}>{cap(e)}</button>
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">
              Action: 30-ft. cone, DEX save <strong>DC {spellDC}</strong> — <strong>{breathDice} {breathType}</strong>, half on a save.
            </span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend"
                onClick={() => patchCf({ drakeBreathUsed: !breathUsed })}>{breathUsed ? 'Reset' : 'Use'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reflexive Resistance (15th) */}
      {level >= 15 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><ShieldHalf size={13} /> Reflexive Resistance</h4>
            <span className="dnd-warmagic__uses">{pb - reflexUsed}/{pb}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: pb }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < pb - reflexUsed ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction: when you or the drake (within 30 ft.) take damage, gain resistance to that instance. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => patchCf({ reflexUsed: Math.max(0, reflexUsed - 1) })} disabled={reflexUsed <= 0}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patchCf({ reflexUsed: Math.min(pb, reflexUsed + 1) })} disabled={reflexUsed >= pb}>Use</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Bond of Fang and Scale</strong> — drake flies &amp; grows to Medium (rideable); Bite +1d6 {essence}; you gain <strong>resistance to {essence}</strong>.</span>
          </div>
        )}
      </div>
    </div>
  );
}
