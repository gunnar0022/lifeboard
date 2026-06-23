import { Crown, Heart, Drama, Sparkles } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * College of Glamour — Combat tab. Mantle of Inspiration spends a base Bardic
 * Inspiration die and grants scaling temporary HP (shown live) to a Charisma-mod
 * number of allies. Enthralling Performance, Mantle of Majesty, and Unbreakable
 * Majesty are rest-limited presences with a save DC. Accent: fey magenta.
 */
function mantleTemp(level) {
  if (level >= 15) return 14;
  if (level >= 10) return 11;
  if (level >= 5) return 8;
  return 5;
}

export default function GlamourBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const allies = Math.max(1, chaMod);
  const saveDC = 8 + proficiencyBonus(level) + chaMod;
  const temp = mantleTemp(level);

  const enthrallingUsed = cf.enthrallingUsed || false;
  const majestyUsed = cf.mantleMajestyUsed || false;
  const unbreakableUsed = cf.unbreakableMajestyUsed || false;

  const set = (key, val) => onUpdate({ classFeature: { ...cf, [key]: val } });

  const RestCard = ({ icon, title, cadence, note, used, keyName }) => (
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
    <div className="dnd-bardsub" style={{ '--accent': '#d96ab5' }}>
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Heart size={13} /> Mantle of Inspiration</span>
        </div>
        <div className="dnd-bardsub__chips">
          <span className="dnd-bardsub__chip dnd-bardsub__chip--big">{temp} temp HP</span>
          <span className="dnd-bardsub__chip">×{allies} all{allies === 1 ? 'y' : 'ies'}</span>
        </div>
        <p className="dnd-bardsub__note">
          Bonus action, spend a Bardic Inspiration die: chosen allies within 60 ft each gain the temp HP and can <strong>immediately move</strong> their speed without provoking.
        </p>
      </div>

      <RestCard icon={<Sparkles size={13} />} title="Enthralling Performance" cadence="1 / short rest" keyName="enthrallingUsed" used={enthrallingUsed}
        note={<>After a 1-min performance: up to {allies} humanoid{allies === 1 ? '' : 's'} within 60 ft, <strong>WIS save DC {saveDC}</strong> or charmed for 1 hour.</>} />

      {level >= 6 && (
        <RestCard icon={<Crown size={13} />} title="Mantle of Majesty" cadence="1 / long rest" keyName="mantleMajestyUsed" used={majestyUsed}
          note={<>Bonus action: cast <strong>Command</strong> free for 1 min (each turn). Creatures you've charmed auto-fail the save.</>} />
      )}

      {level >= 14 && (
        <RestCard icon={<Drama size={13} />} title="Unbreakable Majesty" cadence="1 / short rest" keyName="unbreakableMajestyUsed" used={unbreakableUsed}
          note={<>Bonus action, 1 min: the first attack against you each turn forces a <strong>CHA save DC {saveDC}</strong> — on a failure it can't attack you.</>} />
      )}
    </div>
  );
}
