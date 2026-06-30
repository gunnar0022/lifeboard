import { Eye, Shuffle, Copy, Eraser } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * School of Enchantment — Combat tab. Hypnotic Gaze is the centerpiece: lock eyes
 * with a victim, name them, and the card pulses while you hold them dazed (and
 * maintain it each turn). Instinctive Charm, Split Enchantment, and Alter
 * Memories ride along as level-gated reminders.
 */
export default function EnchantmentBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const chaMod = Math.max(1, abilityMod(character.abilities?.CHA || 10));

  const gaze = cf.hypnoticGaze || { active: false, target: '' };

  const setGaze = (next) => onUpdate({ classFeature: { ...cf, hypnoticGaze: { ...gaze, ...next } } });
  const lockEyes = () => setGaze({ active: true });
  const release = () => setGaze({ active: false });

  const hasInstinctive = level >= 6;
  const hasSplit = level >= 10;
  const hasAlter = level >= 14;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-bard)' }}>
      {/* Hypnotic Gaze */}
      <div className={`dnd-gaze ${gaze.active ? 'dnd-gaze--locked' : ''}`}>
        <div className="dnd-gaze__icon"><Eye size={18} /></div>
        <div className="dnd-gaze__body">
          <h4 className="dnd-gaze__title">Hypnotic Gaze</h4>
          {gaze.active ? (
            <input
              className="dnd-gaze__input"
              placeholder="enthralled creature…"
              value={gaze.target}
              onChange={(e) => setGaze({ target: e.target.value })}
            />
          ) : (
            <span className="dnd-warmagic__note">Action: a creature within 5 ft makes a WIS save or is dazed (speed 0, incapacitated) until end of your next turn. Maintain each turn; 1 / target / long rest.</span>
          )}
        </div>
        {gaze.active
          ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={release}>Release</button>
          : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={lockEyes}>Enthrall</button>}
      </div>
      {gaze.active && (
        <span className="dnd-gaze__upkeep">♥ Hold their gaze — use your action each turn to maintain (ends if they take damage or you step away).</span>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {hasInstinctive && (
          <div className="dnd-warmagic__reminder">
            <Shuffle size={12} />
            <span><strong>Instinctive Charm</strong> — reaction when a creature within 30 ft attacks you: WIS save or it must target the nearest other creature instead. On a success, no reuse on it until a long rest.</span>
          </div>
        )}
        {hasSplit && (
          <div className="dnd-warmagic__reminder">
            <Copy size={12} />
            <span><strong>Split Enchantment</strong> — a single-target enchantment spell (1st+) can target a second creature.</span>
          </div>
        )}
        {hasAlter && (
          <div className="dnd-warmagic__reminder">
            <Eraser size={12} />
            <span><strong>Alter Memories</strong> — a charmed creature can be left unaware it was charmed; once, an action forces an INT save or it forgets up to <strong>{1 + chaMod}</strong> hours (1 + CHA) of the charm.</span>
          </div>
        )}
      </div>
    </div>
  );
}
