import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Path of the Giant — Combat-tab tracker. Giant has no per-rest resource pools
 * (everything keys off being raging), so this block surfaces the combat features
 * level-gated, computes the Mighty Impel save DC live, and keeps the one piece of
 * per-rage state worth holding: the Elemental Cleaver damage type (swappable as a
 * bonus action). Extra Cleaver damage scales to 2d6 at 14th (Demiurgic Colossus).
 */
const CLEAVER_TYPES = ['acid', 'cold', 'fire', 'thunder', 'lightning'];

export default function GiantBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const strMod = abilityMod(abilities.STR || 10);
  const isRaging = cf.active || false;

  const hasCleaver = level >= 6;
  const hasImpel = level >= 10;
  const hasColossus = level >= 14;
  const cleaverType = cf.cleaverType || null;
  const cleaverDice = hasColossus ? '2d6' : '1d6';
  const impelDC = 8 + pb + strMod;

  const setCleaver = (type) => onUpdate({ classFeature: { ...cf, cleaverType: cleaverType === type ? null : type } });

  return (
    <div className="dnd-giant">
      {/* Giant's Havoc (3rd) */}
      <div className="dnd-giant__section">
        <div className="dnd-giant__header">
          <h4 className="dnd-giant__subtitle">Giant's Havoc</h4>
          <span className="dnd-giant__lvl">Lvl 3</span>
        </div>
        <p className="dnd-giant__note">
          While raging: <strong>Crushing Throw</strong> adds your Rage Damage to successful Strength-based thrown attacks, and <strong>Giant Stature</strong> gives <strong>+{hasColossus ? 10 : 5} ft reach</strong> and makes you {hasColossus ? 'Large or Huge' : 'Large'}.
        </p>
        {!isRaging && <p className="dnd-giant__inactive-note">Activate Rage to gain these benefits</p>}
      </div>

      {/* Elemental Cleaver (6th) — per-rage damage type */}
      {hasCleaver && (
        <div className="dnd-giant__section">
          <div className="dnd-giant__header">
            <h4 className="dnd-giant__subtitle">Elemental Cleaver</h4>
            <span className="dnd-giant__lvl">Lvl 6</span>
          </div>
          <p className="dnd-giant__note">
            Infused weapon deals an extra <strong>{cleaverDice}</strong> of the chosen type and gains thrown (20/60). Bonus action to swap type while raging.
          </p>
          <div className="dnd-giant__cleaver-tabs">
            {CLEAVER_TYPES.map(t => (
              <button
                key={t}
                className={`dnd-giant__cleaver-tab dnd-giant__cleaver-tab--${t} ${cleaverType === t ? 'dnd-giant__cleaver-tab--active' : ''}`}
                onClick={() => setCleaver(t)}
              >{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Mighty Impel (10th) */}
      {hasImpel && (
        <div className="dnd-giant__section">
          <div className="dnd-giant__header">
            <h4 className="dnd-giant__subtitle">Mighty Impel</h4>
            <span className="dnd-giant__lvl">Lvl 10</span>
          </div>
          <p className="dnd-giant__note">
            Bonus action while raging: move one {hasColossus ? 'Large or smaller' : 'Medium or smaller'} creature within reach to a space within 30 ft. Unwilling creatures make a Strength save.
          </p>
          <div className="dnd-giant__resource-row">
            <span>Save DC</span>
            <span className="dnd-giant__dc">{impelDC}</span>
          </div>
        </div>
      )}

      {/* Demiurgic Colossus (14th) */}
      {hasColossus && (
        <div className="dnd-giant__section">
          <div className="dnd-giant__header">
            <h4 className="dnd-giant__subtitle">Demiurgic Colossus</h4>
            <span className="dnd-giant__lvl">Lvl 14</span>
          </div>
          <p className="dnd-giant__note">
            Reach <strong>+10 ft</strong>, size up to <strong>Large or Huge</strong>, Mighty Impel affects Large creatures, and Elemental Cleaver deals <strong>2d6</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
