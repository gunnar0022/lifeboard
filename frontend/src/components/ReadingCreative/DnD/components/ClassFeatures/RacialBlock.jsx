import { useEffect, useRef } from 'react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';
import { DRAGON_ANCESTRY, breathWeaponDice } from '../../classProgression';

/**
 * Combat-tab tracker for use-limited racial traits. Currently only Goliath's
 * Stone's Endurance (reaction, uses = proficiency bonus, regained on a long
 * rest). Renders nothing for races without a tracked resource. Uses scale
 * with proficiency bonus, mirroring the class trackers.
 */
export default function RacialBlock({ character, onUpdate }) {
  const race = character.meta?.race;
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const rf = character.racialFeature || {};
  const isGoliath = race === 'Goliath';
  const prevPbRef = useRef(null);

  // Keep Stone's Endurance max equal to proficiency bonus; grant new use(s) on increase.
  useEffect(() => {
    if (!isGoliath) return;
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const se = rf.stoneEndurance;
    if (se && se.maxUses === pb) return;
    const grew = prev !== null && pb > prev;
    onUpdate({
      racialFeature: {
        ...rf,
        stoneEndurance: {
          maxUses: pb,
          currentUses: se
            ? (grew ? Math.min((se.currentUses || 0) + (pb - (se.maxUses || 0)), pb) : Math.min(se.currentUses ?? pb, pb))
            : pb,
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoliath, pb]);

  if (isGoliath) {
    const se = rf.stoneEndurance || { maxUses: pb, currentUses: pb };
    const use = () => {
      if (se.currentUses <= 0) return;
      onUpdate({ racialFeature: { ...rf, stoneEndurance: { ...se, currentUses: se.currentUses - 1 } } });
    };
    return (
      <div className="dnd-racial">
        <div className="dnd-racial__resource">
          <h4 className="dnd-racial__title">STONE'S ENDURANCE</h4>
          <div className="dnd-racial__uses">{se.currentUses} / {se.maxUses}</div>
          <button className="dnd-racial__use-btn" onClick={use} disabled={se.currentUses <= 0}>
            Reduce dmg (d12 + CON)
          </button>
          <span className="dnd-racial__recharge">Long Rest</span>
        </div>
      </div>
    );
  }

  if (race === 'Dragonborn') {
    const color = rf.dragonAncestry;
    const a = color ? DRAGON_ANCESTRY[color] : null;
    const dice = breathWeaponDice(level);
    const dc = 8 + abilityMod(character.abilities?.CON || 10) + pb;
    const used = rf.breathWeaponUsed || false;
    const toggle = () => onUpdate({ racialFeature: { ...rf, breathWeaponUsed: !used } });
    return (
      <div className="dnd-racial">
        <div className="dnd-racial__resource">
          <h4 className="dnd-racial__title">BREATH WEAPON</h4>
          {a ? (
            <>
              <div className="dnd-racial__uses">{used ? 'Used' : `${dice} ${a.damage}`}</div>
              <p className="dnd-racial__note">{a.area} · {a.save} save · DC {dc}</p>
              <button className="dnd-racial__use-btn" onClick={toggle}>
                {used ? 'Reset' : 'Exhale'}
              </button>
              <span className="dnd-racial__recharge">Short or Long Rest</span>
            </>
          ) : (
            <p className="dnd-racial__note">Choose a draconic ancestry in the Features tab.</p>
          )}
        </div>
      </div>
    );
  }

  if (race === 'Half-Orc') {
    const used = rf.relentlessEnduranceUsed || false;
    const toggle = () => onUpdate({ racialFeature: { ...rf, relentlessEnduranceUsed: !used } });
    return (
      <div className="dnd-racial">
        <div className="dnd-racial__resource">
          <h4 className="dnd-racial__title">RELENTLESS ENDURANCE</h4>
          <div className="dnd-racial__uses">{used ? 'Used' : 'Ready'}</div>
          <button className="dnd-racial__use-btn" onClick={toggle}>
            {used ? 'Reset' : 'Drop to 1 HP'}
          </button>
          <span className="dnd-racial__recharge">Long Rest</span>
        </div>
      </div>
    );
  }

  if (race === 'Tabaxi') {
    const used = rf.felineAgilityUsed || false;
    const toggle = () => onUpdate({ racialFeature: { ...rf, felineAgilityUsed: !used } });
    return (
      <div className="dnd-racial">
        <div className="dnd-racial__resource">
          <h4 className="dnd-racial__title">FELINE AGILITY</h4>
          <div className="dnd-racial__uses">{used ? 'Used' : 'Ready'}</div>
          <button className="dnd-racial__use-btn" onClick={toggle}>
            {used ? 'Reset' : 'Double Speed'}
          </button>
          <span className="dnd-racial__recharge">Resets when you move 0 ft</span>
        </div>
      </div>
    );
  }

  return null;
}
