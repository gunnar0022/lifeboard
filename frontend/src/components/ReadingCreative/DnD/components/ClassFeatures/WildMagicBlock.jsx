import { useEffect, useRef } from 'react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Path of Wild Magic — Combat-tab tracker. The centerpiece is the Wild Surge
 * d8 table: it rolls automatically when you enter rage (via the cf.active edge),
 * can be re-rolled (Unstable Backlash, 10th), and at 14th (Controlled Surge) rolls
 * twice so you choose the effect — doubles let you pick any. It also tracks the two
 * proficiency-bonus pools, Magic Awareness and Bolstering Magic, which refill on a
 * long rest (see CharacterSheet.longRest).
 */
const WILD_MAGIC = {
  1: 'Each chosen creature within 30 ft: CON save or 1d12 necrotic. You gain 1d12 temp HP.',
  2: 'Teleport up to 30 ft. Repeat as a bonus action each turn until rage ends.',
  3: 'A spirit appears by a creature within 30 ft, then explodes (DEX save, 1d6 force). Resummon as a bonus action.',
  4: 'A held weapon deals force damage and gains light + thrown (20/60); it returns to your hand each turn.',
  5: 'Whenever a creature hits you, it takes 1d6 force damage until your rage ends.',
  6: 'Protective lights: +1 AC to you and to allies within 10 ft until your rage ends.',
  7: 'Vines grow: ground within 15 ft is difficult terrain for your enemies until rage ends.',
  8: 'A creature within 30 ft: CON save or 1d6 radiant and blinded until your next turn. Repeat as a bonus action.',
};
const d8 = () => Math.floor(Math.random() * 8) + 1;

export default function WildMagicBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
  const conMod = abilityMod(abilities.CON || 10);
  const dc = 8 + pb + conMod;
  const isRaging = cf.active || false;
  const controlled = level >= 14;
  const hasBolstering = level >= 6;
  const hasBacklash = level >= 10;

  const prevPbRef = useRef(null);
  const prevActiveRef = useRef(isRaging);

  const magicAwareness = cf.magicAwareness || { maxUses: pb, currentUses: pb };
  const bolsteringMagic = cf.bolsteringMagic || { maxUses: pb, currentUses: pb };
  const surge = cf.wildSurge || { current: null, options: null };

  // Build a surge result honoring Controlled Surge (roll twice, choose; doubles → any).
  const buildSurge = () => {
    if (controlled) {
      const a = d8(), b = d8();
      return a === b
        ? { current: null, options: [1, 2, 3, 4, 5, 6, 7, 8] }
        : { current: null, options: [a, b] };
    }
    return { current: d8(), options: null };
  };

  // Keep PB pools in sync; grant new use(s) when PB grows on level-up.
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
    sync('magicAwareness');
    if (level >= 6) sync('bolsteringMagic');
    if (Object.keys(updates).length) onUpdate({ classFeature: { ...cf, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, level]);

  // Auto-roll Wild Surge the moment rage begins.
  useEffect(() => {
    const wasRaging = prevActiveRef.current;
    prevActiveRef.current = isRaging;
    if (isRaging && !wasRaging) {
      onUpdate({ classFeature: { ...cf, wildSurge: buildSurge() } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRaging]);

  const rollSurge = () => onUpdate({ classFeature: { ...cf, wildSurge: buildSurge() } });
  const chooseSurge = (n) => onUpdate({ classFeature: { ...cf, wildSurge: { current: n, options: null } } });
  const spend = (key, res) => {
    if (res.currentUses <= 0) return;
    onUpdate({ classFeature: { ...cf, [key]: { ...res, currentUses: res.currentUses - 1 } } });
  };
  const reset = (key, res) => onUpdate({ classFeature: { ...cf, [key]: { ...res, currentUses: res.maxUses } } });

  return (
    <div className="dnd-wild">
      {/* Wild Surge (3rd) */}
      <div className="dnd-wild__section dnd-wild__surge">
        <div className="dnd-wild__header">
          <h4 className="dnd-wild__subtitle">Wild Surge</h4>
          <span className="dnd-wild__dc">save DC {dc}</span>
        </div>

        {surge.options ? (
          <>
            <p className="dnd-wild__prompt">{controlled ? 'Choose your effect:' : 'Result:'}</p>
            <div className="dnd-wild__choices">
              {surge.options.map((n, i) => (
                <button key={`${n}-${i}`} className="dnd-wild__choice" onClick={() => chooseSurge(n)}>
                  <span className="dnd-wild__choice-num">{n}</span>
                  <span className="dnd-wild__choice-text">{WILD_MAGIC[n]}</span>
                </button>
              ))}
            </div>
          </>
        ) : surge.current ? (
          <div className="dnd-wild__result">
            <span className="dnd-wild__result-num">{surge.current}</span>
            <span className="dnd-wild__result-text">{WILD_MAGIC[surge.current]}</span>
          </div>
        ) : (
          <p className="dnd-wild__empty">{isRaging ? 'Roll your surge.' : 'A surge rolls automatically when you rage.'}</p>
        )}

        <div className="dnd-wild__roll-row">
          <button className="dnd-wild__roll" onClick={rollSurge}>
            {controlled ? 'Roll ×2' : 'Roll d8'}
          </button>
          {hasBacklash && (
            <span className="dnd-wild__backlash">Unstable Backlash: re-roll as a reaction when imperiled.</span>
          )}
        </div>
      </div>

      {/* Magic Awareness (3rd) */}
      <div className="dnd-wild__section">
        <div className="dnd-wild__header">
          <h4 className="dnd-wild__subtitle">Magic Awareness</h4>
          <span className="dnd-wild__uses">{magicAwareness.currentUses}/{magicAwareness.maxUses}</span>
        </div>
        <p className="dnd-wild__note">Action: sense spells &amp; magic items within 60 ft (and their school) until end of your next turn.</p>
        <div className="dnd-wild__uses-row">
          <button className="dnd-wild__use" onClick={() => spend('magicAwareness', magicAwareness)} disabled={magicAwareness.currentUses <= 0}>Use</button>
          <button className="dnd-wild__reset" onClick={() => reset('magicAwareness', magicAwareness)}>Reset</button>
        </div>
      </div>

      {/* Bolstering Magic (6th) */}
      {hasBolstering && (
        <div className="dnd-wild__section">
          <div className="dnd-wild__header">
            <h4 className="dnd-wild__subtitle">Bolstering Magic</h4>
            <span className="dnd-wild__uses">{bolsteringMagic.currentUses}/{bolsteringMagic.maxUses}</span>
          </div>
          <p className="dnd-wild__note">Action, touch one creature: a d3 to attacks &amp; checks for 10 min, or restore one spell slot (level = d3 roll).</p>
          <div className="dnd-wild__uses-row">
            <button className="dnd-wild__use" onClick={() => spend('bolsteringMagic', bolsteringMagic)} disabled={bolsteringMagic.currentUses <= 0}>Use</button>
            <button className="dnd-wild__reset" onClick={() => reset('bolsteringMagic', bolsteringMagic)}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
