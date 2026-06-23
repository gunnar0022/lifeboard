import { Sparkles, Sword, Zap, Wind, Flame } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Eldritch Knight — Combat tab. The actual spell slots / cantrips / known spells
 * live on the Spells tab (the subclass registers as a third-caster), so here we
 * surface the live Intelligence save DC as a pointer, let you name your one or two
 * bonded weapons, and reminder the martial-caster tricks (War Magic, Eldritch
 * Strike, Arcane Charge, Improved War Magic).
 */
export default function EldritchKnightBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const saveDC = 8 + proficiencyBonus(level) + intMod;
  const atk = proficiencyBonus(level) + intMod;
  const atkStr = atk >= 0 ? `+${atk}` : `${atk}`;
  const bonded = cf.bondedWeapons || ['', ''];

  const setBond = (i, val) => {
    const next = [bonded[0] || '', bonded[1] || ''];
    next[i] = val;
    onUpdate({ classFeature: { ...cf, bondedWeapons: next } });
  };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Spellcasting pointer */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Wizard Spellcasting (INT)</h4>
        </div>
        <div className="dnd-ek__dcs">
          <span className="dnd-ek__dc">Save DC <strong>{saveDC}</strong></span>
          <span className="dnd-ek__dc">Attack <strong>{atkStr}</strong></span>
        </div>
        <p className="dnd-warmagic__note">Manage slots, cantrips, and known spells on the <strong>Spells tab</strong>.</p>
      </div>

      {/* Weapon Bond */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sword size={13} /> Weapon Bond</h4>
        </div>
        <div className="dnd-ek__bonds">
          {[0, 1].map(i => (
            <input
              key={i}
              className="dnd-field dnd-ek__bond-input"
              value={bonded[i] || ''}
              placeholder={`Bonded weapon ${i + 1}`}
              onChange={e => setBond(i, e.target.value)}
            />
          ))}
        </div>
        <p className="dnd-warmagic__note">Can't be disarmed (unless incapacitated); summon one to hand as a bonus action.</p>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>War Magic</strong> — cast a cantrip with your action, then make one weapon attack as a bonus action.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Flame size={12} />
            <span><strong>Eldritch Strike</strong> — a weapon hit gives the target disadvantage on its next save vs. your spells (before your next turn ends).</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Wind size={12} />
            <span><strong>Arcane Charge</strong> — Action Surge also lets you teleport up to 30 ft.</span>
          </div>
        )}
        {level >= 18 && (
          <div className="dnd-warmagic__reminder">
            <Zap size={12} />
            <span><strong>Improved War Magic</strong> — cast any spell with your action, then make one weapon attack as a bonus action.</span>
          </div>
        )}
      </div>
    </div>
  );
}
