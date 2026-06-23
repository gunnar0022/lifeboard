import { useEffect, useRef } from 'react';

/**
 * Path of the Zealot — Combat-tab tracker. Divine Fury's bonus damage scales with
 * level and the player picks its type (necrotic/radiant) once. Fanatical Focus is
 * once per rage — it auto-resets the moment a new rage begins (cf.active edge).
 * Zealous Presence is once per long rest (see CharacterSheet.longRest). Rage Beyond
 * Death is a passive surfaced while raging.
 */
export default function ZealotBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const isRaging = cf.active || false;
  const prevActiveRef = useRef(isRaging);

  const furyType = cf.divineFuryType || 'necrotic';
  const furyBonus = Math.floor(level / 2);
  const hasFocus = level >= 6;
  const hasPresence = level >= 10;
  const hasBeyondDeath = level >= 14;
  const focusUsed = cf.fanaticalFocusUsed || false;
  const presenceUsed = cf.zealousPresenceUsed || false;

  // Fanatical Focus is once per rage — reset it when a fresh rage begins.
  useEffect(() => {
    const wasRaging = prevActiveRef.current;
    prevActiveRef.current = isRaging;
    if (isRaging && !wasRaging && cf.fanaticalFocusUsed) {
      onUpdate({ classFeature: { ...cf, fanaticalFocusUsed: false } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRaging]);

  const setType = (t) => onUpdate({ classFeature: { ...cf, divineFuryType: t } });
  const toggleFocus = () => onUpdate({ classFeature: { ...cf, fanaticalFocusUsed: !focusUsed } });
  const usePresence = () => onUpdate({ classFeature: { ...cf, zealousPresenceUsed: true } });
  const resetPresence = () => onUpdate({ classFeature: { ...cf, zealousPresenceUsed: false } });

  return (
    <div className="dnd-zealot">
      {/* Divine Fury (3rd) */}
      <div className="dnd-zealot__section">
        <div className="dnd-zealot__header">
          <h4 className="dnd-zealot__subtitle">Divine Fury</h4>
          <span className="dnd-zealot__lvl">Lvl 3</span>
        </div>
        <div className="dnd-zealot__fury">
          <span className="dnd-zealot__fury-dmg">+1d6+{furyBonus}</span>
          <div className="dnd-zealot__type-tabs">
            {['necrotic', 'radiant'].map(t => (
              <button
                key={t}
                className={`dnd-zealot__type dnd-zealot__type--${t} ${furyType === t ? 'dnd-zealot__type--active' : ''}`}
                onClick={() => setType(t)}
              >{t}</button>
            ))}
          </div>
        </div>
        <p className="dnd-zealot__note">First weapon hit on each of your turns while raging deals this extra damage.</p>
        {!isRaging && <p className="dnd-zealot__inactive-note">Activate Rage to deal Divine Fury damage</p>}
      </div>

      {/* Fanatical Focus (6th) */}
      {hasFocus && (
        <div className="dnd-zealot__section">
          <div className="dnd-zealot__header">
            <h4 className="dnd-zealot__subtitle">Fanatical Focus</h4>
            <span className="dnd-zealot__lvl">1 / rage</span>
          </div>
          <p className="dnd-zealot__note">Reroll a failed save while raging (must use the new roll).</p>
          <button
            className={`dnd-zealot__focus-btn ${focusUsed ? 'dnd-zealot__focus-btn--spent' : ''}`}
            onClick={toggleFocus}
          >
            {focusUsed ? 'Used this rage — tap to restore' : 'Available — tap when used'}
          </button>
        </div>
      )}

      {/* Zealous Presence (10th) */}
      {hasPresence && (
        <div className="dnd-zealot__section">
          <div className="dnd-zealot__header">
            <h4 className="dnd-zealot__subtitle">Zealous Presence</h4>
            <span className="dnd-zealot__lvl">1 / long rest</span>
          </div>
          <p className="dnd-zealot__note">Bonus action: up to 10 creatures within 60 ft that hear you gain advantage on attacks &amp; saves until your next turn.</p>
          <div className="dnd-zealot__uses-row">
            <button className="dnd-zealot__use" onClick={usePresence} disabled={presenceUsed}>{presenceUsed ? 'Spent' : 'Cry Out'}</button>
            {presenceUsed && <button className="dnd-zealot__reset" onClick={resetPresence}>Reset</button>}
          </div>
        </div>
      )}

      {/* Rage Beyond Death (14th) */}
      {hasBeyondDeath && (
        <div className="dnd-zealot__section">
          <div className="dnd-zealot__header">
            <h4 className="dnd-zealot__subtitle">Rage Beyond Death</h4>
            <span className="dnd-zealot__lvl">Lvl 14</span>
          </div>
          <p className="dnd-zealot__note">
            While raging, 0 HP doesn't knock you unconscious. You still roll death saves, but you don't die from failing them until your rage ends — and only if still at 0 HP.
          </p>
          {isRaging && <div className="dnd-zealot__active-note">RAGING — death is held at bay</div>}
        </div>
      )}
    </div>
  );
}
