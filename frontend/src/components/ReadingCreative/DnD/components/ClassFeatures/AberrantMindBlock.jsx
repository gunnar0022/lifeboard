import { Brain, MessageCircle, Sparkles, Zap } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Aberrant Mind — Combat tab. Lists the always-known psionic spells, surfaces the
 * Charisma-scaled Telepathic Speech range, and tracks the higher-level SP plays:
 * Revelation in Flesh (transform toggle) and Warping Implosion (long rest, or 5 SP).
 * Sorcery points are managed on the base Sorcerer card above.
 */
const PSIONIC = {
  1: 'Arms of Hadar, Dissonant Whispers, Mind Sliver',
  3: 'Calm Emotions, Detect Thoughts',
  5: 'Hunger of Hadar, Sending',
  7: "Evard's Black Tentacles, Summon Aberration",
  9: 'Rary\'s Telepathic Bond, Telekinesis',
};

export default function AberrantMindBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const chaMod = abilityMod(abilities.CHA || 10);
  const warpDC = 8 + pb + chaMod; // sorcerer spell save DC
  const sp = cf.currentPoints ?? 0;
  const teleMiles = Math.max(1, chaMod);

  const benefits = cf.revelationBenefits || {};
  const revealing = Object.values(benefits).some(Boolean);
  const warpUsed = cf.warpingUsed || false;

  const spend = (n) => { if (sp >= n) onUpdate({ classFeature: { ...cf, currentPoints: sp - n } }); };
  // Each Revelation benefit costs 1 sorcery point to switch on (no refund on off).
  const toggleBenefit = (key) => {
    const on = !!benefits[key];
    if (!on && sp < 1) return;
    onUpdate({
      classFeature: {
        ...cf,
        revelationBenefits: { ...benefits, [key]: !on },
        currentPoints: on ? sp : sp - 1,
      },
    });
  };
  const endRevelation = () => onUpdate({ classFeature: { ...cf, revelationBenefits: {} } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
      {/* Psionic Spells */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Brain size={13} /> Psionic Spells</h4>
        </div>
        <div className="dnd-warmagic__grant">
          {[1, 3, 5, 7, 9].map(lvl => (
            <div key={lvl} className={`dnd-warmagic__grant-row ${level >= lvl ? '' : 'dnd-warmagic__grant-row--locked'}`}>
              <span className="dnd-warmagic__grant-lvl">L{lvl}</span>
              <span className="dnd-warmagic__grant-names">{PSIONIC[lvl]}</span>
            </div>
          ))}
        </div>
        <p className="dnd-warmagic__note">Always known. From 6th level (Psionic Sorcery) cast these for sorcery points equal to the spell's level (no V/S/M).</p>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <MessageCircle size={12} />
          <span><strong>Telepathic Speech</strong> — bonus action: link a creature within 30 ft for <strong>{level} min</strong>, out to <strong>{teleMiles} mi</strong>.</span>
        </div>
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Brain size={12} />
            <span><strong>Psychic Defenses</strong> — resistance to psychic damage; advantage on saves vs. charm &amp; fright.</span>
          </div>
        )}
        {level >= 14 && (
          <div className={`dnd-warmagic__reminder ${revealing ? 'dnd-warmagic__reminder--active' : ''}`} style={{ flexWrap: 'wrap' }}>
            <Sparkles size={12} />
            <span style={{ flex: '1 1 100%' }}>
              <strong>Revelation in Flesh</strong> — bonus action, 10 min. Toggle a benefit for <strong>1 SP</strong> each:
            </span>
            <div className="dnd-warmagic__pick" style={{ margin: '0.3rem 0 0', width: '100%' }}>
              {[
                { key: 'seeInvis', label: 'See Invisible' },
                { key: 'fly', label: 'Fly (hover)' },
                { key: 'swim', label: 'Swim ×2 + breathe' },
                { key: 'squeeze', label: 'Squeeze 1 in.' },
              ].map(b => (
                <button
                  key={b.key}
                  className={`dnd-warmagic__pick-btn ${benefits[b.key] ? 'dnd-warmagic__pick-btn--active' : ''}`}
                  onClick={() => toggleBenefit(b.key)}
                  disabled={!benefits[b.key] && sp < 1}
                >{b.label}</button>
              ))}
              {revealing && <button className="dnd-warmagic__btn" onClick={endRevelation}>End</button>}
            </div>
          </div>
        )}
        {level >= 18 && (
          <div className={`dnd-warmagic__reminder ${warpUsed ? 'dnd-archfey__spent' : ''}`}>
            <Zap size={12} />
            <span><strong>Warping Implosion</strong> — teleport 120 ft; creatures within 30 ft of your old space make a <strong>STR save DC {warpDC}</strong> or take 3d10 force + pull. {warpUsed ? '(spent)' : '1 / long rest.'}</span>
            <div className="dnd-warmagic__btns">
              {warpUsed
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend(5)} disabled={sp < 5} title="Use again for 5 SP">−5 SP</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, warpingUsed: true } })}>Use</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
