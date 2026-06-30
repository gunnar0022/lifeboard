import { useEffect, useRef } from 'react';
import { proficiencyBonus, abilityMod, formatMod } from '../../dndUtils';
import { DRAGON_ANCESTRY, breathWeaponDice, getRacialSpells, getRacialAttacks } from '../../classProgression';

const ACTION_LABEL = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };

/**
 * Combat-tab racial section. Renders, in order:
 *   1. Natural weapons / racial attacks (Tabaxi claws, Uma thundering rush, …),
 *      data-driven from race trait `attack` descriptors — to-hit/damage are
 *      computed here from the character's abilities and proficiency.
 *   2. Use-limited racial resources (Goliath Stone's Endurance, Dragonborn
 *      Breath Weapon, Half-Orc Relentless Endurance, Tabaxi Feline Agility,
 *      and generic level-gated racial spells).
 * Renders nothing for races without either.
 */
export default function RacialBlock({ character, onUpdate }) {
  const race = character.meta?.race;
  const subrace = character.meta?.subrace;
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const abilities = character.abilities || {};
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

  // ── 1. Racial natural attacks (data-driven) ──────────────────────────────
  const attacks = getRacialAttacks(race, subrace).map(atk => {
    const mod = abilityMod(abilities[atk.ability] || 10);
    const toHit = mod + (atk.proficient ? pb : 0) + (atk.expertise ? pb : 0);
    let dmg = atk.damage;
    if (atk.addAbilityToDamage) dmg += ` ${formatMod(mod)}`;
    if (atk.damageType) dmg += ` ${atk.damageType}`;
    return { ...atk, toHit, dmgText: dmg };
  });

  const attacksSection = attacks.length > 0 && (
    <div className="dnd-racial-attacks">
      <h3 className="dnd-section-title">Racial Attacks</h3>
      <div className="dnd-attacks__list">
        {attacks.map(atk => (
          <div key={atk.traitId} className="dnd-attacks__card dnd-attacks__card--racial">
            <div className="dnd-attacks__header">
              <span className="dnd-attacks__name">{atk.name}</span>
              {atk.actionType && (
                <span className="dnd-attacks__range-tag dnd-attacks__range-tag--melee">
                  {ACTION_LABEL[atk.actionType] || atk.actionType}
                </span>
              )}
              <span className="dnd-attacks__hit">{formatMod(atk.toHit)} to hit</span>
            </div>
            <div className="dnd-attacks__damage">{atk.dmgText}</div>
            {atk.note && <div className="dnd-attacks__props">{atk.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  // ── 2. Use-limited racial resources ──────────────────────────────────────
  let resourceSection = null;

  if (isGoliath) {
    const se = rf.stoneEndurance || { maxUses: pb, currentUses: pb };
    const use = () => {
      if (se.currentUses <= 0) return;
      onUpdate({ racialFeature: { ...rf, stoneEndurance: { ...se, currentUses: se.currentUses - 1 } } });
    };
    resourceSection = (
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
  } else if (race === 'Dragonborn') {
    const color = rf.dragonAncestry;
    const a = color ? DRAGON_ANCESTRY[color] : null;
    const dice = breathWeaponDice(level);
    const dc = 8 + abilityMod(abilities.CON || 10) + pb;
    const used = rf.breathWeaponUsed || false;
    const toggle = () => onUpdate({ racialFeature: { ...rf, breathWeaponUsed: !used } });
    resourceSection = (
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
  } else if (race === 'Half-Orc') {
    const used = rf.relentlessEnduranceUsed || false;
    const toggle = () => onUpdate({ racialFeature: { ...rf, relentlessEnduranceUsed: !used } });
    resourceSection = (
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
  } else if (race === 'Tabaxi') {
    const used = rf.felineAgilityUsed || false;
    const toggle = () => onUpdate({ racialFeature: { ...rf, felineAgilityUsed: !used } });
    resourceSection = (
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
  } else {
    // Generic level-gated racial spells (Fairy, Tiefling bloodlines, Genasi variants)
    const spells = getRacialSpells(race, subrace, level);
    if (spells.length > 0) {
      const spellUses = rf.spellUses || {};
      const spellCounts = rf.spellCounts || {};
      const toggleUse = (name) => onUpdate({ racialFeature: { ...rf, spellUses: { ...spellUses, [name]: !spellUses[name] } } });
      const usePb = (name) => {
        const cur = spellCounts[name] ?? pb;
        if (cur <= 0) return;
        onUpdate({ racialFeature: { ...rf, spellCounts: { ...spellCounts, [name]: cur - 1 } } });
      };
      resourceSection = (
        <div className="dnd-racial">
          {spells.map(sp => {
            if (sp.uses === 'pb') {
              const cur = spellCounts[sp.name] ?? pb;
              return (
                <div key={sp.name} className="dnd-racial__resource">
                  <h4 className="dnd-racial__title">{sp.name}</h4>
                  <div className="dnd-racial__uses">{cur} / {pb}</div>
                  <button className="dnd-racial__use-btn" onClick={() => usePb(sp.name)} disabled={cur <= 0}>Cast</button>
                  <span className="dnd-racial__recharge">Long Rest</span>
                </div>
              );
            }
            const used = !!spellUses[sp.name];
            return (
              <div key={sp.name} className="dnd-racial__resource">
                <h4 className="dnd-racial__title">{sp.name}</h4>
                <div className="dnd-racial__uses">{used ? 'Used' : 'Ready'}</div>
                <button className="dnd-racial__use-btn" onClick={() => toggleUse(sp.name)}>{used ? 'Reset' : 'Cast'}</button>
                <span className="dnd-racial__recharge">Long Rest</span>
              </div>
            );
          })}
        </div>
      );
    }
  }

  if (!attacksSection && !resourceSection) return null;

  return (
    <>
      {attacksSection}
      {resourceSection}
    </>
  );
}
