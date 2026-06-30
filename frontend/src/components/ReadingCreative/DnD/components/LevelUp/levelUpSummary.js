/**
 * Pure "what do I gain at level N" calculator. Drives both the celebratory
 * Level Up reveal and the static recap — same numbers, so they never disagree.
 *
 * Everything is derived from the target level (N) and the character's class /
 * subclass / race, comparing level N against N-1. HP uses the sheet's fixed
 * "take the average" rule (no rolling), matching the auto-HP the sheet applies.
 */
import {
  abilityMod, proficiencyBonus, hpForClassLevel, subclassHpBonus, casterProfileFor,
} from '../../dndUtils';
import { getClass } from '../../rules/registry';
import {
  getClassFeatures, getSubclassFeatures, getRaceFeatures, getRacialSpells,
} from '../../classProgression';
import { maxSlotsForSources, pactSlotsForLevel } from '../../spellSlots';

const ORD = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
export const slotOrd = (n) => ORD[n] || `${n}th`;

/** Features whose `level` is exactly N (i.e. newly granted at this level). */
function gainedAt(features, level) {
  return features.filter(f => (f.level || 1) === level);
}

/** Standard (non-pact) slot increases between two levels for a caster type. */
function standardSlotDeltas(casterType, level) {
  const after = maxSlotsForSources([{ casterType, classLevel: level }]);
  const before = maxSlotsForSources([{ casterType, classLevel: level - 1 }]);
  const levels = new Set([...Object.keys(after), ...Object.keys(before)].map(Number));
  const deltas = [];
  [...levels].sort((a, b) => a - b).forEach(L => {
    const a = after[String(L)] || 0;
    const b = before[String(L)] || 0;
    if (a > b) deltas.push({ slotLevel: L, before: b, after: a, isNew: b === 0 });
  });
  return deltas;
}

/** Pact-magic changes (count and/or slot level) between two levels. */
function pactSlotDeltas(level) {
  const after = pactSlotsForLevel(level);
  const before = pactSlotsForLevel(level - 1);
  const out = [];
  if (after.slotLevel > before.slotLevel) {
    out.push({ kind: 'pactLevel', before: before.slotLevel, after: after.slotLevel });
  }
  if (after.count > before.count) {
    out.push({ kind: 'pactCount', before: before.count, after: after.count });
  }
  return { deltas: out, after };
}

export function levelUpSummary(character, level) {
  const meta = character?.meta || {};
  const className = meta.className;
  const subclass = meta.subclass;
  const race = meta.race;
  const subrace = meta.subrace;
  const conMod = abilityMod(character?.abilities?.CON || 10);

  // ── HP ──
  const die = getClass(className)?.hitDie;
  let hpGain = null;
  if (die) {
    const after = hpForClassLevel(die, level, conMod) + subclassHpBonus(subclass, level);
    const before = hpForClassLevel(die, level - 1, conMod) + subclassHpBonus(subclass, level - 1);
    hpGain = Math.max(0, after - before);
  }

  // ── Proficiency bonus ──
  const profBefore = proficiencyBonus(level - 1);
  const profAfter = proficiencyBonus(level);
  const profIncreased = profAfter > profBefore;

  // ── Spell slots ──
  const profile = casterProfileFor(className, subclass);
  const isCaster = !!profile;
  const casterType = profile?.casterType || null;
  let slotDeltas = [];
  let pact = null;
  if (isCaster) {
    if (casterType === 'pact') {
      const p = pactSlotDeltas(level);
      pact = { ...p.after, deltas: p.deltas };
      slotDeltas = []; // pact reported separately
    } else {
      slotDeltas = standardSlotDeltas(casterType, level);
    }
  }
  const slotsChanged = slotDeltas.length > 0 || (pact && pact.deltas.length > 0);

  // ── Features gained at this level ──
  const classFeatures = gainedAt(getClassFeatures(className, level), level);
  const subclassFeatures = gainedAt(getSubclassFeatures(subclass, level), level);
  const raceFeatures = gainedAt(getRaceFeatures(race, subrace), level);
  // Racial spells newly unlocked at this level (level-gated bloodline magic, etc.)
  const racialSpellsNow = getRacialSpells(race, subrace, level);
  const racialSpellsPrev = new Set(getRacialSpells(race, subrace, level - 1).map(s => s.name));
  const newRacialSpells = racialSpellsNow
    .filter(s => !racialSpellsPrev.has(s.name))
    .map(s => ({ id: `racial-spell-${s.name}`, name: s.name, level, desc: 'Racial spell now available — see the Combat tab to use it.' }));

  const featureCount =
    classFeatures.length + subclassFeatures.length + raceFeatures.length + newRacialSpells.length;

  return {
    level,
    className,
    subclass,
    race,
    subrace,
    hpGain,
    profBefore,
    profAfter,
    profIncreased,
    isCaster,
    casterType,
    preparation: profile?.preparation || null,
    slotDeltas,
    pact,
    slotsChanged,
    features: {
      class: classFeatures,
      subclass: subclassFeatures,
      race: [...raceFeatures, ...newRacialSpells],
    },
    featureCount,
  };
}
