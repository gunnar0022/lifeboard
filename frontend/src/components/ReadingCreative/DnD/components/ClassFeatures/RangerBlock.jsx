import { useEffect, useRef } from 'react';
import { Crosshair, EyeOff, HeartPulse, Footprints } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { favoredFoeDie } from '../../classProgression';

/**
 * Ranger — Combat tab. The interactive resources all scale with proficiency
 * bonus: Favored Foe (mark + bonus damage die), Nature's Veil (invisibility),
 * and Tireless (temp HP). Favored Enemy / Terrain are quick editable refs.
 */
export default function RangerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const foeDie = favoredFoeDie(level);
  const prevPbRef = useRef(null);

  // Pools that scale with proficiency bonus — grant the delta on growth.
  useEffect(() => {
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const grow = (stored, max) => stored == null ? max
      : (prev !== null && pb > prev ? Math.min(stored + (pb - prev), max) : Math.min(stored, max));
    const patch = {};
    if (cf.favoredFoe?.max !== pb) patch.favoredFoe = { max: pb, current: grow(cf.favoredFoe?.current, pb) };
    if (cf.naturesVeil?.max !== pb) patch.naturesVeil = { max: pb, current: grow(cf.naturesVeil?.current, pb) };
    if (cf.tireless?.max !== pb) patch.tireless = { max: pb, current: grow(cf.tireless?.current, pb) };
    if (Object.keys(patch).length) onUpdate({ classFeature: { ...cf, ...patch } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb]);

  const foe = cf.favoredFoe || { current: pb, max: pb };
  const veil = cf.naturesVeil || { current: pb, max: pb };
  const tireless = cf.tireless || { current: pb, max: pb };

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const use = (key, obj) => { if (obj.current > 0) patchCf({ [key]: { ...obj, current: obj.current - 1 } }); };
  const add = (key, obj) => { if (obj.current < obj.max) patchCf({ [key]: { ...obj, current: obj.current + 1 } }); };

  const pips = (obj) => (
    <div className="dnd-warmagic__pips">
      {Array.from({ length: obj.max }, (_, i) => (
        <span key={i} className={`dnd-warmagic__pip ${i < obj.current ? 'dnd-warmagic__pip--full' : ''}`} />
      ))}
    </div>
  );

  const useRow = (key, obj, label, icon, note) => (
    <div className="dnd-warmagic__section">
      <div className="dnd-warmagic__head">
        <h4 className="dnd-warmagic__subtitle">{icon} {label}</h4>
        <span className="dnd-warmagic__uses">{obj.current}/{obj.max}</span>
      </div>
      {pips(obj)}
      <div className="dnd-warmagic__row">
        <span className="dnd-warmagic__note">{note}</span>
        <div className="dnd-warmagic__btns">
          <button className="dnd-warmagic__btn" onClick={() => add(key, obj)} disabled={obj.current >= obj.max}>+</button>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => use(key, obj)} disabled={obj.current <= 0}>Use</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-ranger)' }}>
      {/* Favored enemy / terrain quick refs */}
      <div className="dnd-ranger__refs">
        <label className="dnd-ranger__ref">
          <span>Favored Enemy</span>
          <input className="dnd-field dnd-field--sm" value={cf.favoredEnemy || ''} placeholder="e.g. Undead"
            onChange={e => patchCf({ favoredEnemy: e.target.value })} />
        </label>
        <label className="dnd-ranger__ref">
          <span>Favored Terrain</span>
          <input className="dnd-field dnd-field--sm" value={cf.favoredTerrain || ''} placeholder="e.g. Forest"
            onChange={e => patchCf({ favoredTerrain: e.target.value })} />
        </label>
      </div>

      {useRow('favoredFoe', foe, `Favored Foe (1${foeDie})`, <Crosshair size={13} />,
        `Mark a creature on a hit (concentration). +1${foeDie} damage the first time you hit it each turn. Long rest.`)}

      {level >= 10 && useRow('naturesVeil', veil, "Nature's Veil", <EyeOff size={13} />,
        'Bonus action: invisible until the start of your next turn. Long rest.')}

      {level >= 10 && useRow('tireless', tireless, 'Tireless', <HeartPulse size={13} />,
        `Action: gain 1d8 + ${wisMod} temp HP. Short rests also reduce exhaustion by 1. Long rest.`)}

      <div className="dnd-warmagic__reminders">
        {level >= 5 && (
          <div className="dnd-warmagic__reminder">
            <Crosshair size={12} />
            <span><strong>Extra Attack</strong> — attack twice when you take the Attack action.</span>
          </div>
        )}
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Footprints size={12} />
            <span><strong>Roving</strong> — +5 speed plus climb &amp; swim speeds (Deft Explorer).</span>
          </div>
        )}
        {level >= 20 && (
          <div className="dnd-warmagic__reminder">
            <Crosshair size={12} />
            <span><strong>Foe Slayer</strong> — once per turn, add +{wisMod} (WIS) to an attack or damage roll vs. a favored enemy.</span>
          </div>
        )}
      </div>
    </div>
  );
}
