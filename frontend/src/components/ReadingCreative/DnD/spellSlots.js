/**
 * Spell slot progression engine — single source of truth for how many spell
 * slots a caster has at a given class + level.
 *
 * Design goal: the public surface takes an ARRAY of caster *sources*
 * ({ casterType, classLevel }). Today every character has exactly one source,
 * but shaping the API around a list now means multiclass spellcasting can be
 * layered in later (sum each source's "effective caster level", then index the
 * full-caster table) without changing any callers.
 */

// ── Caster archetypes ──────────────────────────────────────────────────────
export const CASTER_TYPES = {
  full: { id: 'full', label: 'Full Caster' },        // Wizard, Cleric, Druid, Bard, Sorcerer
  half: { id: 'half', label: 'Half Caster' },        // Paladin, Ranger
  third: { id: 'third', label: 'Third Caster' },     // Eldritch Knight, Arcane Trickster
  artificer: { id: 'artificer', label: 'Artificer' },// Artificer (half, rounded up, slots at L1)
  pact: { id: 'pact', label: 'Pact Magic' },         // Warlock
};

// Each row is [L1..L9]; index 0 = character level 1. Trailing zeros omitted.
const FULL = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

// Half casters (Paladin / Ranger) — no slots at level 1.
const HALF = [
  [], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
  [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];

// Artificer — half-caster slots rounded up, so it gets a slot at level 1.
const ARTIFICER = [
  [2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
  [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];

// Third casters (Eldritch Knight / Arcane Trickster) — first slots at level 3.
const THIRD = [
  [], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3],
  [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3],
  [4, 3, 3, 1], [4, 3, 3, 1],
];

// Pact magic (Warlock) — [slotCount, slotLevel] by Warlock level.
const PACT = [
  [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
];

const TABLES = { full: FULL, half: HALF, artificer: ARTIFICER, third: THIRD };

function clampLevel(level) {
  return Math.max(1, Math.min(20, level | 0));
}

/**
 * Effective caster level a single source contributes to the *full-caster*
 * table — used only for multiclass slot-combining (future). Single-class
 * casters use their own table directly via maxSlotsForSources().
 */
export function effectiveCasterLevel({ casterType, classLevel }) {
  const lvl = clampLevel(classLevel);
  switch (casterType) {
    case 'full': return lvl;
    case 'artificer': return Math.ceil(lvl / 2);
    case 'half': return Math.floor(lvl / 2);
    case 'third': return Math.floor(lvl / 3);
    default: return 0; // pact magic never combines into the normal table
  }
}

/**
 * Max standard spell slots for a set of caster sources.
 * Returns { '1': n, '2': n, ... } including only levels with >0 slots.
 * Pact-magic sources are excluded (they have their own pool).
 */
export function maxSlotsForSources(sources = []) {
  const standard = sources.filter(s => s && s.casterType && s.casterType !== 'pact');
  if (standard.length === 0) return {};

  let row;
  if (standard.length === 1) {
    // Single class — use its own table directly (correct low-level rounding).
    const s = standard[0];
    const table = TABLES[s.casterType] || FULL;
    row = table[clampLevel(s.classLevel) - 1] || [];
  } else {
    // Multiclass — sum effective levels, index the full-caster table.
    const total = standard.reduce((sum, s) => sum + effectiveCasterLevel(s), 0);
    row = FULL[clampLevel(total) - 1] || [];
  }

  const out = {};
  row.forEach((count, i) => {
    if (count > 0) out[String(i + 1)] = count;
  });
  return out;
}

/** Pact slot pool for a Warlock level: { count, slotLevel } (0/0 if none). */
export function pactSlotsForLevel(level) {
  const row = PACT[clampLevel(level) - 1];
  if (!row) return { count: 0, slotLevel: 0 };
  return { count: row[0], slotLevel: row[1] };
}

// ── Upcast / cantrip scaling ────────────────────────────────────────────────
// Spells may carry structured scaling: { kind, per } where `per` is a dice or
// flat string applied once per `step` levels above the spell's base level.
// We compute a concrete preview so the player can *feel* the upcast.

const DICE_RE = /^\s*(\d+)\s*d\s*(\d+)\s*$/i;

/** Parse "8d6" -> { count: 8, die: 6 }, else null. */
export function parseDice(str) {
  if (!str) return null;
  const m = String(str).match(DICE_RE);
  if (!m) return null;
  return { count: parseInt(m[1], 10), die: parseInt(m[2], 10) };
}

/**
 * Compute how a spell scales when cast at `castLevel`.
 *  - spell: needs { level, damage?, scaling_kind?, scaling_per_level? }
 *  - castLevel: the slot/effect level it's being cast at
 * Returns { steps, computed, note } where `computed` is a ready-to-show string
 * (e.g. "10d6") when we can math it, and `note` is the descriptive fallback.
 */
export function computeScaling(spell, castLevel) {
  const base = spell.level || 0;
  // Cantrips step up at character levels 5/11/17; leveled spells step per slot
  // level above the spell's base level.
  const steps = base === 0
    ? (castLevel >= 5 ? 1 : 0) + (castLevel >= 11 ? 1 : 0) + (castLevel >= 17 ? 1 : 0)
    : Math.max(0, castLevel - base);
  const kind = spell.scaling_kind;
  const per = spell.scaling_per_level;

  if (!kind || !per || steps <= 0) {
    return { steps, computed: null, kind: kind || null, per: per || null };
  }

  // Damage / healing dice — try to fold into the base dice for a real number.
  if (kind === 'damage' || kind === 'healing') {
    const baseDice = parseDice(spell.damage);
    const perDice = parseDice(per);
    if (baseDice && perDice && baseDice.die === perDice.die) {
      const total = baseDice.count + perDice.count * steps;
      return { steps, computed: `${total}d${baseDice.die}`, kind, per };
    }
    if (perDice) {
      return { steps, computed: `+${perDice.count * steps}d${perDice.die}`, kind, per };
    }
  }

  // Flat numeric scaling (targets, distance, etc).
  const num = parseInt(per, 10);
  if (!Number.isNaN(num)) {
    return { steps, computed: `+${num * steps}`, kind, per };
  }

  return { steps, computed: null, kind, per };
}

export const SCALING_KINDS = [
  { id: '', label: 'None' },
  { id: 'damage', label: 'Damage dice' },
  { id: 'healing', label: 'Healing dice' },
  { id: 'targets', label: 'Targets' },
  { id: 'distance', label: 'Distance/Area' },
  { id: 'duration', label: 'Duration' },
  { id: 'challenge_rating', label: 'Challenge Rating' },
];

const SCALING_UNIT = {
  damage: 'damage', healing: 'healing', targets: 'target(s)',
  distance: 'ft', duration: '', challenge_rating: 'CR',
};

/** Human label for a scaling result, e.g. "10d6 damage" or "+2 target(s)". */
export function scalingLabel(result) {
  if (!result || !result.computed) return null;
  const unit = SCALING_UNIT[result.kind] || '';
  return unit ? `${result.computed} ${unit}` : result.computed;
}
