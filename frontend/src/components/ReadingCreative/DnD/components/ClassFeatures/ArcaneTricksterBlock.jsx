import { Sparkles, Hand, EyeOff, Crosshair, Wand2 } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Arcane Trickster — Combat tab. Spell slots / cantrips / known spells live on the
 * Spells tab (the subclass registers as a third-caster), so this surfaces the live
 * Intelligence save DC as a pointer and reminders the trickery: Mage Hand Legerdemain,
 * Magical Ambush, Versatile Trickster, and the once-per-long-rest Spell Thief. Accent: rogue.
 */
export default function ArcaneTricksterBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const saveDC = 8 + proficiencyBonus(level) + intMod;
  const atk = proficiencyBonus(level) + intMod;
  const atkStr = atk >= 0 ? `+${atk}` : `${atk}`;
  const thiefUsed = cf.spellThiefUsed || false;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Spellcasting pointer */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Wizard Spellcasting (INT)</h4>
        </div>
        <div className="dnd-ek__dcs">
          <span className="dnd-ek__dc">Save DC <strong>{saveDC}</strong></span>
          <span className="dnd-ek__dc">Attack <strong>{atkStr}</strong></span>
        </div>
        <p className="dnd-warmagic__note">Mage Hand + enchantment/illusion wizard spells. Manage them on the <strong>Spells tab</strong>.</p>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Hand size={12} />
          <span><strong>Mage Hand Legerdemain</strong> — invisible hand: plant/lift items in others' pockets, pick locks &amp; disarm traps at range, controlled by your Cunning Action.</span>
        </div>
        {level >= 9 && (
          <div className="dnd-warmagic__reminder">
            <EyeOff size={12} />
            <span><strong>Magical Ambush</strong> — if you're hidden when you cast a spell on a creature, it has disadvantage on saves against it this turn.</span>
          </div>
        )}
        {level >= 13 && (
          <div className="dnd-warmagic__reminder">
            <Crosshair size={12} />
            <span><strong>Versatile Trickster</strong> — bonus action: a creature within 5 ft of your Mage Hand grants you advantage on attacks against it this turn.</span>
          </div>
        )}
        {level >= 17 && (
          <div className={`dnd-warmagic__reminder ${thiefUsed ? 'dnd-archfey__spent' : ''}`}>
            <Wand2 size={12} />
            <span><strong>Spell Thief</strong> — reaction vs a spell on you: caster saves (your <strong>DC {saveDC}</strong>) or you negate it and steal the spell for 8 hours. {thiefUsed ? '(spent)' : '1 / long rest.'}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, spellThiefUsed: !thiefUsed } })}>{thiefUsed ? 'Reset' : 'Use'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
