import { Target, Sparkles, CornerUpRight, Crosshair } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';
import { ARCANE_SHOT_LIST } from '../../classProgression';

/**
 * Arcane Archer — Combat tab. Arcane Shot is a tiny pool (always two uses) that
 * recharges on a short rest; the *options* are chosen on the Features tab and shown
 * here as quick-reference cards tagged by school, upgrading their text at 18th level.
 * Magic Arrow / Curving Shot / Ever-Ready Shot ride below as reminders. Save DC is
 * Intelligence-based, unlike the rest of the martial Fighter.
 */
export default function ArcaneArcherBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const intMod = abilityMod(character.abilities?.INT || 10);
  const saveDC = 8 + pb + intMod;
  const upgraded = level >= 18;

  // Arcane Shot is always two uses; the pool persists on first interaction.
  const uses = cf.arcaneShotUses || { max: 2, current: 2 };
  const known = cf.knownArcaneShots || [];

  const spend = () => { if (uses.current > 0) onUpdate({ classFeature: { ...cf, arcaneShotUses: { max: 2, current: uses.current - 1 } } }); };
  const restore = () => { if (uses.current < 2) onUpdate({ classFeature: { ...cf, arcaneShotUses: { max: 2, current: uses.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Arcane Shot uses */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Crosshair size={13} /> Arcane Shot</h4>
          <span className="dnd-warmagic__uses">{uses.current}/2</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: 2 }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < uses.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Once per turn on an Attack-action arrow · save <strong>DC {saveDC}</strong> (INT) · recharge on a short rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restore} disabled={uses.current >= 2}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spend} disabled={uses.current <= 0}>Loose</button>
          </div>
        </div>
      </div>

      {/* Chosen Arcane Shot options */}
      <div className="dnd-bm__maneuvers">
        {known.length === 0 && (
          <p className="dnd-bm__empty">No Arcane Shots chosen — pick them in the Features tab.</p>
        )}
        {known.map(name => {
          const s = ARCANE_SHOT_LIST.find(x => x.name === name);
          if (!s) return null;
          return (
            <div key={name} className="dnd-bm__maneuver">
              <div className="dnd-bm__maneuver-head">
                <span className="dnd-bm__maneuver-name">{name}</span>
                <span className="dnd-bm__tag dnd-bm__tag--school">{s.school}</span>
              </div>
              <p className="dnd-bm__maneuver-desc">{s.desc}{upgraded && <> <span className="dnd-bm__upgrade">{s.at18}</span></>}</p>
            </div>
          );
        })}
      </div>

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Magic Arrow</strong> — your fired arrows count as magical for overcoming resistance/immunity.</span>
          </div>
        )}
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <CornerUpRight size={12} />
            <span><strong>Curving Shot</strong> — bonus action to reroll a missed magic arrow against a new target within 60 ft.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Target size={12} />
            <span><strong>Ever-Ready Shot</strong> — if you roll initiative with no Arcane Shot uses, regain one.</span>
          </div>
        )}
      </div>
    </div>
  );
}
