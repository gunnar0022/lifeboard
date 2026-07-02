/**
 * Summons — the React-free data layer for the Combat-tab Summons sub-tab.
 *
 * Two shapes flow through here:
 *
 *  1. A *library row* (from /api/dnd/summons, snake_case) — the reusable template.
 *  2. A *live instance* (stored in character.summons) — a battlefield creature.
 *     It wraps a frozen SNAPSHOT of the template's stat fields (`block`, same
 *     snake_case shape as the row) plus live tracking (hpCurrent/temp, conditions,
 *     allegiance, dead, notes). Snapshotting means per-summon edits and later
 *     library edits never bleed into each other.
 *
 * `toStatBlock` maps a snapshot into the contract the shared CompanionStatBlock
 * already renders, so summons and class companions share one presentational block.
 */

export const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const SUMMON_CATEGORIES = [
  { id: 'conjuration', label: 'Conjuration' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'companion', label: 'Companion' },
  { id: 'undead', label: 'Undead' },
  { id: 'object', label: 'Object' },
  { id: 'custom', label: 'Custom' },
];

export const SUMMON_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

export const ALLEGIANCES = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'hostile', label: 'Hostile' },
];

// Monotonic id generator — guarantees uniqueness even when many instances are
// spawned within the same millisecond (e.g. Conjure Animals × 8).
let _uidCounter = 0;
const uid = () => Date.now() * 1000 + ((_uidCounter++) % 1000);

/** Format a speeds object ({walk:40, fly:60}) into "walk 40 ft., fly 60 ft.". */
export function formatSpeeds(speeds) {
  if (!speeds) return '—';
  if (typeof speeds === 'string') return speeds;
  const parts = Object.entries(speeds)
    .filter(([, v]) => v != null && v !== '')
    .map(([mode, v]) => (mode === 'walk' ? `${v} ft.` : `${mode} ${v} ft.`));
  return parts.length ? parts.join(', ') : '—';
}

/** Snapshot (or library row) → the block contract CompanionStatBlock renders. */
export function toStatBlock(block) {
  const b = block || {};
  return {
    size: b.size || 'Medium',
    type: b.creature_type || b.type || 'creature',
    ac: b.ac ?? 10,
    acNote: b.ac_note || '',
    hpMax: b.hp ?? 1,
    speed: formatSpeeds(b.speeds),
    abilities: b.ability_scores || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    saves: b.saves || '',
    skills: b.skills || '',
    senses: b.senses || '',
    languages: b.languages || '',
    resistances: b.resistances || '',
    immunities: b.immunities || '',
    vulnerabilities: b.vulnerabilities || '',
    conditionImmunities: b.condition_immunities || '',
    hitDiceText: b.hit_dice || '',
    traits: b.traits || [],
    actions: b.actions || [],
    reactions: b.reactions || [],
  };
}

/** The stat fields we snapshot from a library row onto a live instance. */
const SNAPSHOT_FIELDS = [
  'name', 'category', 'size', 'creature_type', 'cr', 'ac', 'ac_note', 'hp',
  'hp_formula', 'hit_dice', 'speeds', 'ability_scores', 'saves', 'skills',
  'senses', 'languages', 'resistances', 'immunities', 'vulnerabilities',
  'condition_immunities', 'traits', 'actions', 'reactions',
  'requires_concentration', 'source_spell', 'description', 'source',
];

/** A blank stat-block draft with every field the summon editor + API expect. */
export function blankSummonDraft() {
  return {
    name: '', category: 'conjuration', size: 'Medium', creature_type: 'beast',
    cr: '', ac: 10, ac_note: '', hp: 1, hp_formula: '', hit_dice: '',
    speeds: { walk: 30 },
    ability_scores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    saves: '', skills: '', senses: '', languages: '', resistances: '',
    immunities: '', vulnerabilities: '', condition_immunities: '',
    traits: [], actions: [], reactions: [],
    requires_concentration: false, source_spell: '', description: '',
    source: 'Homebrew', is_custom: true,
  };
}

/** Library row → editable draft (fills any missing fields from the blank). */
export function rowToDraft(row) {
  return { ...blankSummonDraft(), ...row };
}

/** Draft → API payload (numeric coercion, ensure JSON-able objects). */
export function draftToPayload(d) {
  return {
    ...d,
    ac: Number(d.ac) || 0,
    hp: Number(d.hp) || 1,
    speeds: d.speeds || {},
    ability_scores: d.ability_scores || {},
    traits: d.traits || [],
    actions: d.actions || [],
    reactions: d.reactions || [],
    requires_concentration: !!d.requires_concentration,
    is_custom: d.is_custom == null ? true : !!d.is_custom,
  };
}

/** Build a live instance from a library row (or a raw draft snapshot). */
export function spawnInstance(row, { name, index } = {}) {
  const block = {};
  for (const k of SNAPSHOT_FIELDS) block[k] = row[k];
  const baseName = name || row.name || 'Summon';
  return {
    id: uid(),
    templateId: row.id ?? null,
    name: index ? `${baseName} ${index}` : baseName,
    block,
    hpCurrent: row.hp ?? 1,
    hpTemp: 0,
    conditions: [],
    allegiance: 'friendly',
    dead: false,
    notes: '',
  };
}

/** Spawn N instances, numbering copies when count > 1. */
export function spawnInstances(row, count = 1, name) {
  const n = Math.max(1, Math.min(50, Number(count) || 1));
  return Array.from({ length: n }, (_, i) =>
    spawnInstance(row, { name, index: n > 1 ? i + 1 : 0 }));
}

/**
 * Apply an HP delta with 5e temp-HP rules: damage depletes temp HP first, healing
 * never exceeds max. Returns the changed { hpCurrent, hpTemp }. Shared by the
 * summon card and the class-companion card.
 */
export function applyHpDelta({ hpCurrent, hpTemp, hpMax }, delta) {
  if (delta < 0) {
    const dmg = -delta;
    const temp = hpTemp || 0;
    if (temp > 0) {
      if (dmg <= temp) return { hpCurrent, hpTemp: temp - dmg };
      return { hpTemp: 0, hpCurrent: Math.max(0, hpCurrent - (dmg - temp)) };
    }
    return { hpCurrent: Math.max(0, hpCurrent - dmg), hpTemp: temp };
  }
  return { hpCurrent: Math.max(0, Math.min(hpMax, hpCurrent + delta)), hpTemp: hpTemp || 0 };
}
