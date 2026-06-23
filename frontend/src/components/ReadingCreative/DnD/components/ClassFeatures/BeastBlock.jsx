import { useEffect, useRef } from 'react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Path of the Beast — Combat-tab tracker. Surfaces the per-rage Form of the Beast
 * weapon choice (with live Strength-based attack/damage), the Bestial Soul
 * adaptation chosen each rest, and the two proficiency-bonus-limited resources you
 * spend in a fight: Infectious Fury (10th) and Call the Hunt (14th). Use maxes
 * follow proficiency bonus and refill on a long rest (see CharacterSheet.longRest).
 */
const FORMS = {
  Bite: { die: '1d8', dmg: 'piercing', note: 'Below half HP: regain HP = proficiency bonus once per turn when you damage a creature.' },
  Claws: { die: '1d6', dmg: 'slashing', note: 'When you Attack with a claw, make one extra claw attack as part of the action.' },
  Tail: { die: '1d8', dmg: 'piercing', note: 'Reach. Reaction when a creature within 10 ft hits you: roll d8, add it to your AC vs. that attack.' },
};

function fmt(mod) { return mod >= 0 ? `+${mod}` : `${mod}`; }

export default function BeastBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const strMod = abilityMod(abilities.STR || 10);
  const conMod = abilityMod(abilities.CON || 10);
  const isRaging = cf.active || false;
  const prevPbRef = useRef(null);

  const beastForm = cf.beastForm || 'Claws';
  const bestialSoul = cf.bestialSoul || null;
  const hasBestialSoul = level >= 6;
  const hasInfectiousFury = level >= 10;
  const hasCallTheHunt = level >= 14;

  const infectiousFury = cf.infectiousFury || { maxUses: pb, currentUses: pb };
  const callTheHunt = cf.callTheHunt || { maxUses: pb, currentUses: pb };
  const furyDC = 8 + conMod + pb;
  const huntCreatures = Math.max(1, conMod);

  // Keep PB-scaled use maxes in sync; grant the new use(s) when PB grows on level-up.
  useEffect(() => {
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const grew = prev !== null && pb > prev;
    const updates = {};
    const sync = (key) => {
      const r = cf[key];
      if (!r || r.maxUses !== pb) {
        updates[key] = {
          maxUses: pb,
          currentUses: r ? (grew ? Math.min((r.currentUses || 0) + (pb - (r.maxUses || 0)), pb) : Math.min(r.currentUses ?? pb, pb)) : pb,
        };
      }
    };
    if (level >= 10) sync('infectiousFury');
    if (level >= 14) sync('callTheHunt');
    if (Object.keys(updates).length) onUpdate({ classFeature: { ...cf, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, level]);

  const setForm = (form) => onUpdate({ classFeature: { ...cf, beastForm: form } });
  const setSoul = (benefit) => onUpdate({ classFeature: { ...cf, bestialSoul: bestialSoul === benefit ? null : benefit } });
  const spend = (key, res) => {
    if (res.currentUses <= 0) return;
    onUpdate({ classFeature: { ...cf, [key]: { ...res, currentUses: res.currentUses - 1 } } });
  };
  const reset = (key, res) => onUpdate({ classFeature: { ...cf, [key]: { ...res, currentUses: res.maxUses } } });

  const form = FORMS[beastForm];

  return (
    <div className="dnd-beast">
      {/* Form of the Beast (3rd) — per-rage weapon choice */}
      <div className="dnd-beast__section">
        <div className="dnd-beast__header">
          <h4 className="dnd-beast__subtitle">Form of the Beast</h4>
          <span className="dnd-beast__lvl">Lvl 3</span>
        </div>
        <div className="dnd-beast__form-tabs">
          {Object.keys(FORMS).map(f => (
            <button
              key={f}
              className={`dnd-beast__form-tab ${beastForm === f ? 'dnd-beast__form-tab--active' : ''}`}
              onClick={() => setForm(f)}
            >{f}</button>
          ))}
        </div>
        <div className="dnd-beast__form-stats">
          <span className="dnd-beast__form-attack">{fmt(strMod)} to hit</span>
          <span className="dnd-beast__form-dmg">{form.die}{fmt(strMod)} {form.dmg}</span>
        </div>
        <p className="dnd-beast__note">{form.note}</p>
        {!isRaging && <p className="dnd-beast__inactive-note">Activate Rage to manifest your natural weapon</p>}
      </div>

      {/* Bestial Soul (6th) — adaptation chosen each rest */}
      {hasBestialSoul && (
        <div className="dnd-beast__section">
          <div className="dnd-beast__header">
            <h4 className="dnd-beast__subtitle">Bestial Soul</h4>
            <span className="dnd-beast__lvl">Lvl 6</span>
          </div>
          <p className="dnd-beast__note">Natural weapons count as magical. Choose one benefit until your next rest:</p>
          <div className="dnd-beast__adapt">
            {[
              { key: 'swim', label: 'Swim + breathe underwater' },
              { key: 'climb', label: 'Climb (even ceilings)' },
              { key: 'jump', label: 'Extend jumps (Athletics)' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`dnd-beast__adapt-btn ${bestialSoul === opt.key ? 'dnd-beast__adapt-btn--active' : ''}`}
                onClick={() => setSoul(opt.key)}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Infectious Fury (10th) — PB uses */}
      {hasInfectiousFury && (
        <div className="dnd-beast__section">
          <div className="dnd-beast__header">
            <h4 className="dnd-beast__subtitle">Infectious Fury</h4>
            <span className="dnd-beast__uses">{infectiousFury.currentUses}/{infectiousFury.maxUses}</span>
          </div>
          <p className="dnd-beast__note">
            On a natural-weapon hit while raging: WIS save <strong>DC {furyDC}</strong> or the target makes a melee attack against a creature of your choice, or takes <strong>2d12 psychic</strong> damage.
          </p>
          <div className="dnd-beast__uses-row">
            <button className="dnd-beast__use-btn" onClick={() => spend('infectiousFury', infectiousFury)} disabled={infectiousFury.currentUses <= 0}>Use</button>
            <button className="dnd-beast__reset-btn" onClick={() => reset('infectiousFury', infectiousFury)}>Reset</button>
          </div>
        </div>
      )}

      {/* Call the Hunt (14th) — PB uses */}
      {hasCallTheHunt && (
        <div className="dnd-beast__section">
          <div className="dnd-beast__header">
            <h4 className="dnd-beast__subtitle">Call the Hunt</h4>
            <span className="dnd-beast__uses">{callTheHunt.currentUses}/{callTheHunt.maxUses}</span>
          </div>
          <p className="dnd-beast__note">
            On entering rage: choose up to <strong>{huntCreatures}</strong> willing creature{huntCreatures === 1 ? '' : 's'} within 30 ft. Gain <strong>5 temp HP</strong> each. They add 1d6 damage once per turn on a hit until the rage ends.
          </p>
          <div className="dnd-beast__uses-row">
            <button className="dnd-beast__use-btn" onClick={() => spend('callTheHunt', callTheHunt)} disabled={callTheHunt.currentUses <= 0}>Use</button>
            <button className="dnd-beast__reset-btn" onClick={() => reset('callTheHunt', callTheHunt)}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
