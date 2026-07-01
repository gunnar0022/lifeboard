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
  metamagicKnown, invocationsKnown, infusionsKnown, maneuversKnown, arcaneShotsKnown, maxRunesKnown,
} from '../../classProgression';
import { maxSlotsForSources, pactSlotsForLevel } from '../../spellSlots';

const ORD = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
export const slotOrd = (n) => ORD[n] || `${n}th`;

/**
 * Prepared-spell cap = spellcasting ability mod + caster-scaled class level.
 * Shared by the Level Up reveal (chip) and LevelUpSpells (Spells sub-tab) so the
 * number can never disagree between the two surfaces.
 */
export function prepCap(casterType, classLevel, abilMod) {
  const prepLevel = casterType === 'full' ? classLevel
    : (casterType === 'half' || casterType === 'artificer') ? Math.floor(classLevel / 2)
    : classLevel;
  return Math.max(1, abilMod + prepLevel);
}

/** Features whose `level` is exactly N (i.e. newly granted at this level). */
function gainedAt(features, level) {
  return features.filter(f => (f.level || 1) === level);
}

/**
 * Build-choices whose KNOWN count scales with level. Each is authored once as a
 * single feature anchored at the level it unlocks, but the number you know grows
 * at later levels — so the Level Up reveal must re-surface the picker on those
 * "bump" levels even though the feature's own `level` is earlier.
 */
const SCALING_CHOICE = {
  metamagic:      { cap: metamagicKnown,   label: 'Metamagic option' },
  invocations:    { cap: invocationsKnown, label: 'Eldritch Invocation' },
  infusions:      { cap: infusionsKnown,   label: 'infusion' },
  maneuvers:      { cap: maneuversKnown,   label: 'maneuver' },
  'arcane-shots': { cap: arcaneShotsKnown, label: 'Arcane Shot option' },
  runes:          { cap: maxRunesKnown,    label: 'rune' },
};

/**
 * From a feature list, find scaling-choice features whose cap grew at exactly
 * `level` (vs level-1) and whose anchor is BELOW this level — the initial grant
 * at the anchor level is already surfaced by gainedAt(). Returns presentational
 * clones that keep the same `choice`/`options` (so the picker writes the same
 * storage) but swap in a compact "you learn 1 more" desc, so the reveal never
 * repeats the full feature text. The canonical node is never mutated.
 */
function scalingBumps(features, level) {
  const out = [];
  for (const f of features) {
    const sc = f.choice && SCALING_CHOICE[f.choice];
    if (!sc) continue;
    if ((f.level || 1) >= level) continue; // anchor at this level: already in gainedAt
    const now = sc.cap(level);
    const prev = sc.cap(level - 1);
    if (now > prev) {
      const delta = now - prev;
      const plural = delta > 1;
      out.push({
        ...f,
        id: `${f.id}-bump-${level}`,
        level,
        scalingBump: true,
        desc: `You learn ${delta} more ${sc.label}${plural ? 's' : ''} — now ${now} known (was ${prev}). Choose ${plural ? 'them' : 'it'} below.`,
      });
    }
  }
  return out;
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

  // ── Subclass-choice flag ──
  // Most classes pick a subclass at level 3 (Cleric/Sorcerer/Warlock at 1,
  // Druid/Wizard at 2). If the character is at/past that level without one set,
  // the level-up reveal prompts them to choose.
  const classNode = getClass(className);
  const subclassLevel = classNode?.subclassLevel || null;
  const subclassLabel = classNode?.subclassLabel || 'Subclass';
  const subclassDue = !!className && !subclass && !!subclassLevel && level >= subclassLevel;

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

  // ── Prepared-spell cap (prepared casters only) ──
  const preparation = profile?.preparation || null;
  let preparedCap = null;
  let preparedCapBefore = null;
  let preparedCapIncreased = false;
  if (preparation === 'prepared') {
    const abilMod = abilityMod(character?.abilities?.[profile.ability] || 10);
    preparedCap = prepCap(casterType, level, abilMod);
    preparedCapBefore = prepCap(casterType, level - 1, abilMod);
    preparedCapIncreased = preparedCap > preparedCapBefore;
  }

  // ── Features gained at this level ──
  const allClassFeatures = getClassFeatures(className, level);
  const allSubclassFeatures = getSubclassFeatures(subclass, level);
  const classFeatures = [...gainedAt(allClassFeatures, level), ...scalingBumps(allClassFeatures, level)];
  const subclassFeatures = [...gainedAt(allSubclassFeatures, level), ...scalingBumps(allSubclassFeatures, level)];
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
    subclassDue,
    subclassLabel,
    subclassLevel,
    race,
    subrace,
    hpGain,
    profBefore,
    profAfter,
    profIncreased,
    isCaster,
    casterType,
    preparation,
    preparedCap,
    preparedCapBefore,
    preparedCapIncreased,
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
