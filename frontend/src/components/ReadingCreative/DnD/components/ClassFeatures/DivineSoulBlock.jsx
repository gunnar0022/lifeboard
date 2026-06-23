import { Sun, Dices, HeartPulse, Feather } from 'lucide-react';

/**
 * Divine Soul — Combat tab. Pick your affinity and the block shows the always-known
 * spell it grants (plus the cleric-list access reminder). Favored by the Gods is a
 * short-rest 2d4 boon, Angelic Form a wings toggle, and Unearthly Recovery a long-rest
 * heal. Sorcery points live on the base Sorcerer card above.
 */
const AFFINITY = {
  good: 'Cure Wounds',
  evil: 'Inflict Wounds',
  law: 'Bless',
  chaos: 'Bane',
  neutrality: 'Protection from Evil and Good',
};

export default function DivineSoulBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const affinity = cf.divineAffinity || null;
  const favoredUsed = cf.favoredUsed || false;
  const wings = cf.angelicWings || false;
  const recoveryUsed = cf.unearthlyUsed || false;
  const halfMax = Math.floor((character.combat?.hpMax || 0) / 2);

  const setAffinity = (a) => onUpdate({ classFeature: { ...cf, divineAffinity: cf.divineAffinity === a ? null : a } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
      {/* Divine Magic */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sun size={13} /> Divine Magic</h4>
          {affinity && <span className="dnd-warmagic__chip">{AFFINITY[affinity]}</span>}
        </div>
        <div className="dnd-warmagic__pick">
          {Object.keys(AFFINITY).map(a => (
            <button key={a} className={`dnd-warmagic__pick-btn ${affinity === a ? 'dnd-warmagic__pick-btn--active' : ''}`} onClick={() => setAffinity(a)}>{a}</button>
          ))}
        </div>
        <p className="dnd-warmagic__note">You can learn spells from the <strong>cleric</strong> list as well; your affinity grants its spell free of your spells known.</p>
      </div>

      {/* Favored by the Gods */}
      <div className={`dnd-warmagic__section ${favoredUsed ? 'dnd-archfey__spent' : ''}`}>
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Dices size={13} /> Favored by the Gods</h4>
          <span className="dnd-warmagic__uses">{favoredUsed ? 'spent' : '1 / short'}</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">On a failed save or missed attack, add <strong>2d4</strong> to the roll.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, favoredUsed: !favoredUsed } })}>{favoredUsed ? 'Reset' : 'Use'}</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <HeartPulse size={12} />
            <span><strong>Empowered Healing</strong> — spend 1 SP to reroll any number of a healing spell's dice (once per turn), for you or an ally within 5 ft.</span>
          </div>
        )}
        {level >= 14 && (
          <div className={`dnd-warmagic__reminder ${wings ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Feather size={12} />
            <span><strong>Angelic Form</strong> — bonus action: spectral wings, flying speed 30 ft. {wings ? 'Manifested.' : ''}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, angelicWings: !wings } })}>{wings ? 'Furl' : 'Unfurl'}</button>
          </div>
        )}
        {level >= 18 && (
          <div className={`dnd-warmagic__reminder ${recoveryUsed ? 'dnd-archfey__spent' : ''}`}>
            <HeartPulse size={12} />
            <span><strong>Unearthly Recovery</strong> — bonus action below half HP: regain <strong>{halfMax || 'half max'} HP</strong>. {recoveryUsed ? '(spent)' : '1 / long rest.'}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, unearthlyUsed: !recoveryUsed } })}>{recoveryUsed ? 'Reset' : 'Use'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
