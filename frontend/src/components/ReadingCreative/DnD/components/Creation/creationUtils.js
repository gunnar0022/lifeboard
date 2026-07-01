import { RACE_ABILITY_BONUSES, SUBRACE_ABILITY_BONUSES } from '../../rules/data/abilityBonuses';
import { CLASS_CREATION } from '../../rules/classes/creation';
import { getClass } from '../../rules/registry';
import { loadItemIndex, resolveStartingItems } from '../../rules/startingEquipment';
import { abilityMod, hpForClassLevel, subclassHpBonus, hitDieNumber } from '../../dndUtils';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const strip = (arr, remove) => (arr || []).filter(x => !remove.includes(x));
export const dedupAdd = (arr, add) => Array.from(new Set([...(arr || []), ...add]));

/** Summed default racial ability bonuses for a race (+ optional subrace). */
export function racialBonusesFor(race, subrace) {
  const out = {};
  const merge = (m) => { if (m) for (const k of Object.keys(m)) out[k] = (out[k] || 0) + m[k]; };
  merge(RACE_ABILITY_BONUSES[race]);
  merge(SUBRACE_ABILITY_BONUSES[subrace]);
  return out;
}

/** Recompute the ability totals from a three-layer build. */
export function recomputeAbilities(build) {
  const abilities = {};
  ABILITIES.forEach(ab => {
    abilities[ab] = (build.base?.[ab] ?? 8) + (build.racial?.[ab] || 0) + (build.asi?.[ab] || 0);
  });
  return abilities;
}

/**
 * Draft patch that seeds the racial layer of the ability build from a race +
 * subrace (clamped to the panel's +2 cap) and keeps the ability totals in sync.
 * The player can still adjust the racial layer freely on the Abilities step.
 */
export function racialLayerPatch(draft, race, subrace) {
  const raw = racialBonusesFor(race, subrace);
  const racial = {};
  ABILITIES.forEach(ab => { racial[ab] = Math.min(2, raw[ab] || 0); });
  const build = {
    base: { ...(draft.abilityBuild?.base || {}) },
    racial,
    asi: { ...(draft.abilityBuild?.asi || {}) },
  };
  return { abilityBuild: build, abilities: recomputeAbilities(build) };
}

const emptyGrants = () => ({ saves: [], armor: [], weapons: [], tools: [], skills: [] });

/**
 * Placeholder starting-equipment items for a class + the player's choices. These
 * hold the raw PHB equipment strings by name and are tagged `_fromClass`;
 * `finalizeDraft` resolves them against the item library into data-rich,
 * library-backed instances just before persisting. Kept name-only here so
 * class/choice switches stay synchronous (no library fetch mid-edit).
 */
function buildClassItems(className, classEquip) {
  const c = CLASS_CREATION[className];
  if (!c) return [];
  const out = [];
  let i = 0;
  (c.startingEquipment || []).forEach((grp, gi) => {
    const names = grp.kind === 'fixed' ? grp.items : (grp.options[classEquip?.[gi] ?? 0] || []);
    names.forEach(name => {
      out.push({ id: `cls-${Date.now()}-${gi}-${i++}`, name, quantity: 1, equipped: false, _fromClass: true });
    });
  });
  return out;
}

/**
 * Full draft patch that applies a class's level-1 grants: saving throws + armor/
 * weapon/tool proficiencies + the player's chosen skills and equipment. Strips the
 * previously-applied class grants first (via the stored `_classGrants` snapshot and
 * the `_fromClass` item tag) so switching class never leaves stale entries.
 */
export function classSetupPatch(draft, className, classSkills, classEquip) {
  const c = CLASS_CREATION[className];
  const prev = draft._classGrants || emptyGrants();
  const skills = classSkills || [];
  const grants = {
    saves: c?.savingThrows || [],
    armor: c?.armor || [],
    weapons: c?.weapons || [],
    tools: c?.tools || [],
    skills,
  };
  const keptItems = (draft.items || []).filter(it => !it._fromClass);
  return {
    saveProficiencies: dedupAdd(strip(draft.saveProficiencies, prev.saves), grants.saves),
    skillProficiencies: dedupAdd(strip(draft.skillProficiencies, prev.skills), grants.skills),
    proficiencies: {
      ...(draft.proficiencies || {}),
      armor: dedupAdd(strip(draft.proficiencies?.armor || [], prev.armor), grants.armor),
      weapons: dedupAdd(strip(draft.proficiencies?.weapons || [], prev.weapons), grants.weapons),
      tools: dedupAdd(strip(draft.proficiencies?.tools || [], prev.tools), grants.tools),
    },
    items: [...keptItems, ...buildClassItems(className, classEquip)],
    _classGrants: grants,
    _classSkills: skills,
    _classEquip: classEquip || {},
  };
}

/**
 * Final pass before persisting: fill a fallback name, seed level-1 HP from the
 * class hit die + CON, resolve the class-granted equipment against the item
 * library into data-rich instances, and drop the creation-only scaffolding.
 *
 * Async because it fetches the items library to turn the placeholder gear into
 * library-backed instances (refType/refId) that drive AC and weapon attacks.
 */
export async function finalizeDraft(draft) {
  const meta = { ...draft.meta, name: draft.meta.name?.trim() || 'New Character' };
  const out = { ...draft, meta };

  const die = getClass(meta.className)?.hitDie;
  if (die) {
    const conMod = abilityMod(draft.abilities?.CON || 10);
    const hp = hpForClassLevel(die, 1, conMod) + subclassHpBonus(meta.subclass, 1);
    out.combat = { ...(draft.combat || {}), hpMax: hp, hpCurrent: hp, hitDiceType: hitDieNumber(die) };
  }

  // Resolve the placeholder class gear against the library; leave any other
  // items (user-added free-form) untouched. Then drop the creation scaffolding.
  const allItems = out.items || [];
  const kept = allItems.filter(it => !it._fromClass);
  const classNames = allItems.filter(it => it._fromClass).map(it => it.name);
  const resolved = resolveStartingItems(classNames, await loadItemIndex());
  out.items = [...kept, ...resolved].map(({ _fromClass, ...it }) => it);

  delete out._classGrants;
  delete out._classSkills;
  delete out._classEquip;
  return out;
}
