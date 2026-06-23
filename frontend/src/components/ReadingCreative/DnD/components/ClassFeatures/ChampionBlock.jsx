import { Crosshair, Dumbbell, Swords, HeartPulse } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Champion — Combat tab. No resources to spend; the draw is a widening crit range
 * (19–20 → 18–20 at 15th) and, at 18th, Survivor's start-of-turn regeneration. So
 * this block headlines the live crit threshold and computes the Survivor heal, with
 * Remarkable Athlete / Additional Fighting Style as reminders.
 */
export default function ChampionBlock({ character }) {
  const level = character.meta?.level || 3;
  const conMod = abilityMod(character.abilities?.CON || 10);
  const critLow = level >= 15 ? 18 : 19;
  const survivorHeal = 5 + conMod;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      <div className="dnd-warmagic__section dnd-champ__crit-card">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Crosshair size={13} /> {level >= 15 ? 'Superior' : 'Improved'} Critical</h4>
        </div>
        <div className="dnd-champ__crit">
          <span className="dnd-champ__crit-range">{critLow}–20</span>
          <span className="dnd-champ__crit-label">crits on a d20</span>
        </div>
      </div>

      {level >= 18 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><HeartPulse size={13} /> Survivor</h4>
            <span className="dnd-warmagic__uses">+{survivorHeal}/turn</span>
          </div>
          <p className="dnd-warmagic__note">At the start of your turn, regain <strong>{survivorHeal} HP</strong> (5 + CON) if you're at half HP or less (and not at 0).</p>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Dumbbell size={12} />
            <span><strong>Remarkable Athlete</strong> — add half proficiency (round up) to STR/DEX/CON checks that don't already use it; longer running jumps.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Additional Fighting Style</strong> — you know a second Fighting Style.</span>
          </div>
        )}
      </div>
    </div>
  );
}
