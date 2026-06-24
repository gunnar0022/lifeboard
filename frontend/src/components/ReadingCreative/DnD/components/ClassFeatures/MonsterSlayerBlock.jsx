import { Target, Eye, Shield, Swords, Ban, X } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { UsePool, OnceToggle } from './trackers';

/**
 * Monster Slayer — Combat tab. The designated quarry is the hub: an editable
 * target that, once set, lights up everything keyed to it — Slayer's Prey's
 * +1d6, Supernatural Defense (+1d6 to saves/escape, 7th), and Slayer's Counter
 * (reaction strike, 15th). Hunter's Sense (WIS / long) and Magic-User's Nemesis
 * (1 / short) use the shared trackers.
 */
const ACCENT = 'var(--dnd-class-ranger)';

export default function MonsterSlayerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const wisMod = Math.max(1, abilityMod(character.abilities?.WIS || 10));
  const spellDC = 8 + proficiencyBonus(level) + abilityMod(character.abilities?.WIS || 10);

  const quarry = cf.quarry || '';
  const hasQuarry = quarry.trim().length > 0;
  const senseUsed = cf.huntersSenseUsed || 0;

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Quarry hub */}
      <div className={`dnd-sig dnd-sig--quarry ${hasQuarry ? 'dnd-sig--locked' : ''}`}>
        <div className="dnd-sig__token"><Target size={20} /></div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><Target size={13} /> Slayer's Prey</span>
          <div className="dnd-sig__target-row">
            <input className="dnd-field dnd-field--sm dnd-sig__target" value={quarry} placeholder="Designate quarry (bonus action)…"
              onChange={e => patchCf({ quarry: e.target.value })} />
            {hasQuarry && (
              <button className="dnd-sig__clear" title="Clear quarry" onClick={() => patchCf({ quarry: '' })}><X size={13} /></button>
            )}
          </div>
          <div className="dnd-sig__chips">
            <span className={`dnd-sig__chip ${hasQuarry ? 'dnd-sig__chip--on' : ''}`}>+1d6 first hit / turn</span>
            {level >= 7 && <span className={`dnd-sig__chip ${hasQuarry ? 'dnd-sig__chip--on' : ''}`}>+1d6 saves &amp; escapes</span>}
            {level >= 15 && <span className={`dnd-sig__chip ${hasQuarry ? 'dnd-sig__chip--on' : ''}`}>Counter-strike on its save</span>}
          </div>
        </div>
      </div>

      {/* Linked-benefit detail (only meaningful with a quarry) */}
      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className={`dnd-warmagic__reminder ${hasQuarry ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Shield size={12} />
            <span><strong>Supernatural Defense</strong> — add <strong>1d6</strong> when your quarry forces a save, or to checks to escape its grapple.</span>
          </div>
        )}
        {level >= 15 && (
          <div className={`dnd-warmagic__reminder ${hasQuarry ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Swords size={12} />
            <span><strong>Slayer's Counter</strong> — reaction: when your quarry forces a save, strike it first; on a hit your save auto-succeeds.</span>
          </div>
        )}
      </div>

      <UsePool icon={<Eye size={13} />} title="Hunter's Sense" used={senseUsed} max={wisMod}
        note="Action: learn a creature's immunities, resistances & vulnerabilities. Long rest."
        onUse={() => patchCf({ huntersSenseUsed: Math.min(wisMod, senseUsed + 1) })}
        onRestore={() => patchCf({ huntersSenseUsed: Math.max(0, senseUsed - 1) })} />

      {level >= 11 && (
        <OnceToggle icon={<Ban size={13} />} title="Magic-User's Nemesis" used={cf.nemesisUsed || false}
          note={`Reaction vs. a caster/teleporter within 60 ft.: WIS save DC ${spellDC} or its spell/teleport is wasted.`}
          onToggle={() => patchCf({ nemesisUsed: !cf.nemesisUsed })} />
      )}
    </div>
  );
}
