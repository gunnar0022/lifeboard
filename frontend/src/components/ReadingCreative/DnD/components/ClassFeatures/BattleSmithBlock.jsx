import { useEffect, useRef } from 'react';
import { Bot, Zap, Swords, Heart, Sparkles } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { buildSteelDefender } from '../../rules/shared/companions';
import CompanionCard from './CompanionCard';

/**
 * Battle Smith — Combat tab. The HP-tracked Steel Defender card headlines
 * (stats scale with level + INT; +2 AC at 15th), summoned/dismissed via the
 * shared CompanionCard. Below it, Arcane Jolt rides as a once-per-turn reaction
 * pool (INT uses, 2d6 → 4d6 force/heal), with Battle Ready / Extra Attack as
 * reminders. Live state lives in classFeature.companion + classFeature.arcaneJolt.
 */
const ACCENT = 'var(--dnd-class-artificer)';

export default function BattleSmithBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const intMod = abilityMod(character.abilities?.INT || 10);
  const improved = level >= 15;

  const block = buildSteelDefender({ level, pb, spellAtk: pb + intMod, intMod, improved });

  const joltMax = Math.max(1, intMod);
  const jolt = cf.arcaneJolt || { current: 0, max: joltMax };
  const joltDice = improved ? '4d6' : '2d6';
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = joltMax;
    if (level >= 9 && cf.arcaneJolt?.max !== joltMax) {
      const stored = cf.arcaneJolt?.current;
      const next = stored == null ? joltMax
        : (p != null && joltMax > p ? Math.min(stored + (joltMax - p), joltMax) : Math.min(stored, joltMax));
      onUpdate({ classFeature: { ...cf, arcaneJolt: { max: joltMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joltMax, level]);

  const stepJolt = (d) =>
    onUpdate({ classFeature: { ...cf, arcaneJolt: { ...jolt, current: Math.max(0, Math.min(jolt.max, jolt.current + d)) } } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <CompanionCard
        block={block} character={character} onUpdate={onUpdate} accent={ACCENT}
        title="Steel Defender" icon={<Bot size={14} />}
      >
        <p className="dnd-companion__hint">
          Shares your initiative, acts right after you (Dodge unless you spend a bonus action to command it). Mending restores 2d6 HP; revive within 1 hr with smith's tools + a spell slot. Re-form on a long rest.
        </p>
      </CompanionCard>

      {/* Arcane Jolt (9th) */}
      {level >= 9 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Zap size={13} /> Arcane Jolt</h4>
            <span className="dnd-warmagic__uses">{jolt.current}/{jolt.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: jolt.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < jolt.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">
              On your magic-weapon hit or the defender's hit (once per turn): <strong>+{joltDice} force</strong>, or heal <strong>{joltDice}</strong> within 30 ft. Long rest.
            </span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepJolt(1)} disabled={jolt.current >= jolt.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepJolt(-1)} disabled={jolt.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Swords size={12} />
          <span><strong>Battle Ready</strong> — proficiency with martial weapons; attack &amp; damage with magic weapons use your INT modifier (+{intMod}).</span>
        </div>
        {level >= 5 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Extra Attack</strong> — attack twice when you take the Attack action.</span>
          </div>
        )}
        {improved && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Improved Defender</strong> — Arcane Jolt deals/heals 4d6; the defender has +2 AC and its Deflect Attack deals 1d4 + {intMod} force to the attacker.</span>
          </div>
        )}
        {level < 9 && (
          <div className="dnd-warmagic__reminder">
            <Heart size={12} />
            <span><strong>Arcane Jolt</strong> unlocks at 9th level.</span>
          </div>
        )}
      </div>
    </div>
  );
}
