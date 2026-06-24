import { Bug, Dices, Wind, Sparkles } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { UsePool } from './trackers';

/**
 * Swarmkeeper — Combat tab. The Gathered Swarm panel is the centerpiece: a
 * rollable appearance and the three once-per-turn assist modes laid out with
 * their live scaling values + save DC, folding in the 11th-level Mighty Swarm
 * upgrades. Writhing Tide and Swarming Dispersal (both PB / long rest) use the
 * shared pool tracker.
 */
const ACCENT = 'var(--dnd-class-ranger)';
const APPEARANCES = ['Swarming insects', 'Miniature twig blights', 'Fluttering birds', 'Playful pixies'];

export default function SwarmkeeperBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const spellDC = 8 + pb + abilityMod(character.abilities?.WIS || 10);
  const mighty = level >= 11;
  const swarmDie = mighty ? '1d8' : '1d6';

  const appearance = cf.swarmAppearance ?? APPEARANCES[0];
  const writhing = cf.writhingTideUsed || 0;
  const dispersal = cf.swarmDispersalUsed || 0;

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const roll = () => patchCf({ swarmAppearance: APPEARANCES[Math.floor(Math.random() * APPEARANCES.length)] });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-sig dnd-sig--swarm">
        <div className="dnd-sig__token"><Bug size={20} /></div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><Bug size={13} /> Gathered Swarm</span>
          <div className="dnd-sig__target-row">
            <input className="dnd-field dnd-field--sm dnd-sig__target" value={appearance} placeholder="Swarm appearance…"
              onChange={e => patchCf({ swarmAppearance: e.target.value })} />
            <button className="dnd-sig__clear" title="Roll appearance (d4)" onClick={roll}><Dices size={14} /></button>
          </div>
          <span className="dnd-sig__desc">Once per turn, right after you hit a creature, choose one:</span>
          <div className="dnd-swarm__modes">
            <div className="dnd-swarm__mode">
              <span className="dnd-swarm__mode-name">Sting</span>
              <span className="dnd-swarm__mode-val">{swarmDie} piercing to the target</span>
            </div>
            <div className="dnd-swarm__mode">
              <span className="dnd-swarm__mode-name">Shove</span>
              <span className="dnd-swarm__mode-val">STR save DC {spellDC} or moved 15 ft{mighty ? ' + knocked prone' : ''}</span>
            </div>
            <div className="dnd-swarm__mode">
              <span className="dnd-swarm__mode-name">Shift</span>
              <span className="dnd-swarm__mode-val">you move 5 ft{mighty ? ' + half cover until your next turn' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {level >= 7 && (
        <UsePool icon={<Wind size={13} />} title="Writhing Tide" used={writhing} max={pb}
          note="Bonus action: fly 10 ft & hover for 1 min (or until incapacitated). Long rest."
          onUse={() => patchCf({ writhingTideUsed: Math.min(pb, writhing + 1) })}
          onRestore={() => patchCf({ writhingTideUsed: Math.max(0, writhing - 1) })} />
      )}

      {level >= 15 && (
        <UsePool icon={<Sparkles size={13} />} title="Swarming Dispersal" used={dispersal} max={pb}
          note="Reaction when you take damage: resist it, vanish, and teleport up to 30 ft. Long rest."
          onUse={() => patchCf({ swarmDispersalUsed: Math.min(pb, dispersal + 1) })}
          onRestore={() => patchCf({ swarmDispersalUsed: Math.max(0, dispersal - 1) })} />
      )}
    </div>
  );
}
