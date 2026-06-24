import { Crosshair, Moon, Brain, Swords, Ghost } from 'lucide-react';
import { abilityMod, formatMod } from '../../dndUtils';

/**
 * Gloom Stalker — Combat tab. No per-rest pools; the identity is the turn-one
 * ambush, so this block headlines a Dread Ambusher panel: the live initiative
 * bonus (= WIS) as a struck token, with the first-turn burst broken into chips.
 * Umbral Sight / Iron Mind / Stalker's Flurry / Shadowy Dodge ride as reminders.
 */
const ACCENT = 'var(--dnd-class-ranger)';

export default function GloomStalkerBlock({ character }) {
  const level = character.meta?.level || 3;
  const initBonus = abilityMod(character.abilities?.WIS || 10);

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-sig dnd-sig--shadow">
        <div className="dnd-sig__token">{formatMod(initBonus)}</div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><Crosshair size={13} /> Dread Ambusher</span>
          <span className="dnd-sig__desc">
            Add <strong>{formatMod(initBonus)}</strong> (WIS) to initiative. On your <strong>first turn</strong> of combat:
          </span>
          <div className="dnd-sig__chips">
            <span className="dnd-sig__chip">+10 ft speed</span>
            <span className="dnd-sig__chip">+1 weapon attack</span>
            <span className="dnd-sig__chip">+1d8 on hit</span>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Moon size={12} />
          <span><strong>Umbral Sight</strong> — darkvision 60 ft. (+30 if innate); while in darkness you're invisible to creatures relying on darkvision.</span>
        </div>
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Brain size={12} />
            <span><strong>Iron Mind</strong> — proficiency in Wisdom saving throws (or INT/CHA if already proficient).</span>
          </div>
        )}
        {level >= 11 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Stalker's Flurry</strong> — once per turn, when you miss with a weapon attack, make another weapon attack as part of the same action.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Ghost size={12} />
            <span><strong>Shadowy Dodge</strong> — reaction: impose disadvantage on an attacker that doesn't have advantage (use before you know the result).</span>
          </div>
        )}
      </div>
    </div>
  );
}
