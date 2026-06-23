import { Flame, Shield, Wind, Eye } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';
import { DRAGON_ANCESTRY, DRAGON_COLORS } from '../../classProgression';

/**
 * Draconic Bloodline — Combat tab. Pick your dragon ancestor and the block tracks the
 * damage type that drives Elemental Affinity, shows your live unarmored AC (13 + DEX),
 * and offers quick sorcery-point spends (resistance, Draconic Presence). Dragon Wings
 * is a toggle. Sorcery points themselves live on the base Sorcerer card above.
 */
export default function DraconicBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const dexMod = abilityMod(abilities.DEX || 10);
  const chaMod = abilityMod(abilities.CHA || 10);
  const presenceDC = 8 + pb + chaMod;
  const sp = cf.currentPoints ?? 0;

  const ancestor = cf.dragonAncestor || null;
  const dmg = ancestor ? DRAGON_ANCESTRY[ancestor].damage : null;
  const wings = cf.dragonWings || false;

  const setAncestor = (c) => onUpdate({ classFeature: { ...cf, dragonAncestor: cf.dragonAncestor === c ? null : c } });
  const spend = (n) => { if (sp >= n) onUpdate({ classFeature: { ...cf, currentPoints: sp - n } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
      {/* Dragon Ancestor + Resilience */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Flame size={13} /> Dragon Ancestor</h4>
          {dmg && <span className="dnd-warmagic__chip">{dmg}</span>}
        </div>
        <div className="dnd-warmagic__pick">
          {DRAGON_COLORS.map(c => (
            <button key={c} className={`dnd-warmagic__pick-btn ${ancestor === c ? 'dnd-warmagic__pick-btn--active' : ''}`} onClick={() => setAncestor(c)}>{c}</button>
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note"><strong>Draconic Resilience</strong> — unarmored AC <strong>{13 + dexMod}</strong> (13 + DEX); +1 max HP per sorcerer level.</span>
        </div>
      </div>

      {/* Elemental Affinity */}
      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Shield size={13} /> Elemental Affinity</h4>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Add <strong>+{chaMod} (CHA)</strong> to one {dmg || 'ancestry'}-damage roll; spend 1 SP for resistance (1 hr).</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend(1)} disabled={sp < 1}>Resist −1 SP</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 14 && (
          <div className={`dnd-warmagic__reminder ${wings ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Wind size={12} />
            <span><strong>Dragon Wings</strong> — bonus action: flying speed equal to your speed. {wings ? 'Manifested.' : ''}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, dragonWings: !wings } })}>{wings ? 'Furl' : 'Unfurl'}</button>
          </div>
        )}
        {level >= 18 && (
          <div className="dnd-warmagic__reminder">
            <Eye size={12} />
            <span><strong>Draconic Presence</strong> — 5 SP, action: 60-ft aura of awe or fear, <strong>WIS save DC {presenceDC}</strong> (concentration, 1 min).</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => spend(5)} disabled={sp < 5}>−5 SP</button>
          </div>
        )}
      </div>
    </div>
  );
}
