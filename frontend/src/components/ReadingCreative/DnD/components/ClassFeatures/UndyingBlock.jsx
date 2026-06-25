import { HeartPulse, Skull, Hourglass, Sparkles } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { OnceToggle } from './trackers';

/**
 * The Undying — Combat tab. A deathless self-healer: Among the Dead wards off
 * undead, Defy Death restores HP when you cheat death (once / long rest), and
 * Indestructible Life is a bonus-action self-heal (once / short or long rest).
 * Undying Nature is a passive reminder. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';

export default function UndyingBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const conMod = abilityMod(character.abilities?.CON || 10);
  const defyHeal = Math.max(1, conMod);
  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Skull size={12} />
          <span><strong>Among the Dead</strong> — know Spare the Dying; advantage on saves vs. disease. An undead that targets you directly must make a WIS save vs. your spell DC or pick a new target.</span>
        </div>
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Hourglass size={12} />
            <span><strong>Undying Nature</strong> — hold your breath indefinitely; no need for food, water, or sleep. Age 1 year per 10; immune to magical aging.</span>
          </div>
        )}
      </div>

      {/* Defy Death — heal on cheating death */}
      {level >= 6 && (
        <OnceToggle
          icon={<HeartPulse size={13} />} title="Defy Death" rest="long rest"
          used={!!cf.defyDeathUsed}
          note={<>Regain <strong>1d8 + {defyHeal}</strong> (CON) HP when you succeed on a death save or stabilize a creature with Spare the Dying.</>}
          onToggle={() => patch({ defyDeathUsed: !cf.defyDeathUsed })}
        />
      )}

      {/* Indestructible Life — bonus-action self heal */}
      {level >= 14 && (
        <OnceToggle
          icon={<Sparkles size={13} />} title="Indestructible Life" rest="short or long rest"
          used={!!cf.indestructibleLifeUsed}
          note={<>Bonus action: regain <strong>1d8 + {level}</strong> HP. Reattach a severed body part if you put it back in place.</>}
          onToggle={() => patch({ indestructibleLifeUsed: !cf.indestructibleLifeUsed })}
        />
      )}
    </div>
  );
}
