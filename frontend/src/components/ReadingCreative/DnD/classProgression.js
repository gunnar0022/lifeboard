/**
 * Compat barrel — the legacy import surface. The actual rules data now lives in
 * rules/data/* (progression) and rules/shared/* (option lists + scaling), and is
 * read through rules/registry.js. This file just re-exports everything so the
 * existing `from './classProgression'` imports across the app keep working, plus
 * defines the three feature getters the Features tab uses.
 *
 * New code should import from rules/registry.js, not here.
 */

// ── Progression data ──
import { CLASS_PROGRESSION } from './rules/classes';
import { SUBCLASS_PROGRESSION } from './rules/subclasses';
export { CLASS_PROGRESSION, SUBCLASS_PROGRESSION };
export {
  RACES, RACE_PROGRESSION, SUBRACE_PROGRESSION,
  getSubraces, getRaceFeatures, getRacialSpells,
} from './rules/races';

// ── Shared option lists + scaling helpers ──
export { FIGHTING_STYLES } from './rules/shared/fightingStyles';
export { RUNE_LIST, maxRunesKnown, maxRuneInvocations, giantsMightDie, giantsMightSize } from './rules/shared/runes';
export { DRAGON_ANCESTRY, DRAGON_COLORS, breathWeaponDice } from './rules/shared/dragonAncestry';
export { METAMAGIC_OPTIONS, metamagicKnown } from './rules/shared/metamagic';
export { PACT_BOONS } from './rules/shared/pactBoons';
export * from './rules/shared/scaling';

// ── Feature getters (used by the Features tab + registry) ──
/** Base-class + subclass features unlocked at level <= the given level (sorted). */
export function getUnlockedFeatures(className, subclass, level) {
  return [...getClassFeatures(className, level), ...getSubclassFeatures(subclass, level)]
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}

export function getClassFeatures(className, level) {
  const lvl = level || 1;
  return (CLASS_PROGRESSION[className] || [])
    .filter(f => (f.level || 1) <= lvl)
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}

export function getSubclassFeatures(subclass, level) {
  const lvl = level || 1;
  return (SUBCLASS_PROGRESSION[subclass]?.features || [])
    .filter(f => (f.level || 1) <= lvl)
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}
