import { Sparkles, Brain, Wand2, Footprints, Crosshair } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Fey Wanderer — Combat tab. No companion and no per-rest martial pool, but two
 * genuine resources at high levels: a free Summon Fey (1 / long rest) at 11th
 * and free Misty Steps (WIS-mod / long rest) at 15th — both pip-tracked. The
 * once-per-turn psychic rider and the charm/fright control ride above as
 * reminders (nothing to spend). Fey Wanderer Magic spells live on the Spells tab.
 */
const ACCENT = 'var(--dnd-class-ranger)';

export default function FeyWandererBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const wisMod = Math.max(1, abilityMod(character.abilities?.WIS || 10));
  const dreadDie = level >= 11 ? '1d6' : '1d4';

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  // Summon Fey — single free cast / long rest.
  const feyUsed = cf.summonFeyUsed || false;
  // Misty Wanderer — WIS-mod free Misty Steps / long rest.
  const mistyUsed = cf.mistyStepUsed || 0;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Crosshair size={12} />
          <span><strong>Dreadful Strikes</strong> — on a hit, deal an extra <strong>{dreadDie} psychic</strong> (once per turn per creature).</span>
        </div>
        <div className="dnd-warmagic__reminder">
          <Sparkles size={12} />
          <span><strong>Otherworldly Glamour</strong> — add <strong>+{wisMod}</strong> (WIS) to every Charisma check.</span>
        </div>
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Brain size={12} />
            <span><strong>Beguiling Twist</strong> — advantage vs. charmed/frightened; reaction to redirect a charm/fright (WIS save vs. your DC) when someone within 120 ft. resists one.</span>
          </div>
        )}
      </div>

      {/* Fey Reinforcements (11th) */}
      {level >= 11 && (
        <div className={`dnd-warmagic__section ${feyUsed ? 'dnd-archfey__spent' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Wand2 size={13} /> Fey Reinforcements</h4>
            <span className="dnd-warmagic__uses">{feyUsed ? 'spent' : '1 / long'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Cast <strong>Summon Fey</strong> free (no material component). You may drop concentration → 1-minute duration.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend"
                onClick={() => patchCf({ summonFeyUsed: !feyUsed })}>{feyUsed ? 'Reset' : 'Cast'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Misty Wanderer (15th) */}
      {level >= 15 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Footprints size={13} /> Misty Wanderer</h4>
            <span className="dnd-warmagic__uses">{wisMod - mistyUsed}/{wisMod}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: wisMod }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < wisMod - mistyUsed ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Cast <strong>Misty Step</strong> free (WIS-mod / long rest); you may bring one willing creature within 5 ft.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => patchCf({ mistyStepUsed: Math.max(0, mistyUsed - 1) })} disabled={mistyUsed <= 0}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patchCf({ mistyStepUsed: Math.min(wisMod, mistyUsed + 1) })} disabled={mistyUsed >= wisMod}>Use</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
