import { Brain, Skull, Drama, VenetianMask } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * College of Whispers — Combat tab. Psychic Blades is the signature strike: scaling
 * psychic damage paid for with a Bardic Inspiration die (once per round), with a
 * quick-spend that draws from the base pool. Words of Terror and Mantle of Whispers
 * recharge on a short rest; Shadow Lore once per long rest, each with a live save DC.
 * Accent: shadowed purple.
 */
function bladesDice(level) {
  if (level >= 15) return '8d6';
  if (level >= 10) return '5d6';
  if (level >= 5) return '3d6';
  return '2d6';
}

export default function WhispersBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const saveDC = 8 + proficiencyBonus(level) + chaMod;
  const dice = bladesDice(level);
  const inspLeft = cf.currentUses ?? 0;

  const set = (key, val) => onUpdate({ classFeature: { ...cf, [key]: val } });
  // Psychic Blades expends a Bardic Inspiration use from the base pool.
  const strike = () => { if (inspLeft > 0) onUpdate({ classFeature: { ...cf, currentUses: inspLeft - 1 } }); };

  const RestCard = ({ icon, title, cadence, note, keyName, used }) => (
    <div className={`dnd-bardsub__card ${used ? 'dnd-bardsub__card--spent' : ''}`}>
      <div className="dnd-bardsub__head">
        <span className="dnd-bardsub__title">{icon} {title}</span>
        <span className="dnd-bardsub__badge">{cadence}</span>
      </div>
      <div className="dnd-bardsub__row">
        <span className="dnd-bardsub__note">{note}</span>
        <div className="dnd-bardsub__btns">
          {used && <button className="dnd-bardsub__btn" onClick={() => set(keyName, false)}>Reset</button>}
          <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={() => set(keyName, true)} disabled={used}>{used ? 'Spent' : 'Use'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#8b6fc7' }}>
      {/* Psychic Blades */}
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Brain size={13} /> Psychic Blades</span>
          <span className="dnd-bardsub__die">{dice}</span>
        </div>
        <div className="dnd-bardsub__row">
          <span className="dnd-bardsub__note">On a weapon hit, spend a Bardic Inspiration die to deal an extra <strong>{dice} psychic</strong> (once per round).</span>
          <div className="dnd-bardsub__btns">
            <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={strike} disabled={inspLeft <= 0}>Strike</button>
          </div>
        </div>
        <span className="dnd-bardsub__hint">{inspLeft} inspiration die{inspLeft === 1 ? '' : 's'} left</span>
      </div>

      <RestCard icon={<Drama size={13} />} title="Words of Terror" cadence="1 / short rest" keyName="wordsOfTerrorUsed" used={cf.wordsOfTerrorUsed || false}
        note={<>After 1 min alone with a humanoid: <strong>WIS save DC {saveDC}</strong> or frightened for 1 hour.</>} />

      {level >= 6 && (
        <RestCard icon={<VenetianMask size={13} />} title="Mantle of Whispers" cadence="1 / short rest" keyName="mantleWhispersUsed" used={cf.mantleWhispersUsed || false}
          note={<>Reaction: capture a dying humanoid's shadow. Spend it (action) to wear its persona for 1 hour (<strong>+5 Deception</strong>).</>} />
      )}

      {level >= 14 && (
        <RestCard icon={<Skull size={13} />} title="Shadow Lore" cadence="1 / long rest" keyName="shadowLoreUsed" used={cf.shadowLoreUsed || false}
          note={<>Action: whisper to one creature within 30 ft — <strong>WIS save DC {saveDC}</strong> or charmed and cowed for 8 hours.</>} />
      )}
    </div>
  );
}
