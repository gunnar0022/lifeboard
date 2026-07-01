/**
 * Starting-equipment resolver — turns the human-readable equipment strings in
 * `rules/classes/creation.js` into character item instances backed by the shared
 * items library (dnd_items). A library-backed instance carries `refType:'item'`
 * + `refId` (plus kind/slot/quantity), so it feeds the same AC / weapon-attack
 * derivation as anything added from the Equipment tab. Anything with no clean
 * library match (packs, foci, "any simple weapon" placeholders) falls back to a
 * free-form instance, exactly like the pre-refactor behaviour.
 *
 * React-free so it stays unit-testable and reusable from the creation flow.
 */

import { EQUIPPABLE_KINDS, WEAPON_KINDS, defaultSlotForKind } from './items';

// Count words the PHB equipment lists use as a quantity prefix ("Two handaxes").
const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// Ammunition lives in the library as 20-count bundles ("Arrows (20)"). The loose
// nouns the lists use ("20 bolts", "quiver of 20 arrows") map onto those bundles;
// the leading count describes the bundle, so a match always means one bundle.
const AMMO_ALIASES = {
  arrow: 'Arrows (20)', arrows: 'Arrows (20)',
  bolt: 'Crossbow Bolts (20)', bolts: 'Crossbow Bolts (20)',
  bullet: 'Sling Bullets (20)', bullets: 'Sling Bullets (20)',
};

// Phrases whose wording differs enough from the canonical library name that a
// case-insensitive / singularised match won't catch them.
const NAME_ALIASES = {
  'wooden shield': 'Shield',
  'studded leather armor': 'Studded Leather',
};

/** Build a `lowercased name -> row` lookup from library rows. */
export function indexItemRows(rows) {
  const map = new Map();
  (rows || []).forEach(r => { if (r && r.name) map.set(String(r.name).toLowerCase(), r); });
  return map;
}

/** Fetch the whole items library and index it by name. Empty map on failure. */
export async function loadItemIndex() {
  try {
    const rows = await fetch('/api/dnd/items?limit=500').then(r => r.json());
    return indexItemRows(Array.isArray(rows) ? rows : []);
  } catch {
    return new Map();
  }
}

// A compound entry ("Light crossbow and 20 bolts", "Leather armor, longbow, and
// 20 arrows") splits into its individual pieces.
function splitParts(raw) {
  return String(raw)
    .replace(/,?\s+and\s+/gi, ',') // "X, and Y" / "X and Y" -> "X,Y"
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// Lowercase and shed the noise that never affects a match: "(if proficient)"
// riders and the "quiver of" preamble before ammo.
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\bquiver of\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Peel a leading count ("two handaxes" -> {qty:2, rest:'handaxes'}). Defaults to 1.
function parseQty(norm) {
  const m = norm.match(/^(\d+|[a-z]+)\s+(.+)$/);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : NUMBER_WORDS[m[1]];
    if (n) return { qty: n, rest: m[2] };
  }
  return { qty: 1, rest: norm };
}

// Resolve a normalized noun phrase to a library row. `forceQty` marks ammo
// bundles, whose count is already baked into the row.
function matchRow(rest, index) {
  if (AMMO_ALIASES[rest]) return { row: index.get(AMMO_ALIASES[rest].toLowerCase()), forceQty: 1 };
  if (NAME_ALIASES[rest]) return { row: index.get(NAME_ALIASES[rest].toLowerCase()) };
  if (index.has(rest)) return { row: index.get(rest) };
  const singular = rest.replace(/s$/, '');
  if (index.has(singular)) return { row: index.get(singular) };
  return null;
}

let _counter = 0;
const nextId = () => `cls-${Date.now()}-${_counter++}`;

// A library-backed instance, mirroring EquipmentTab's addFromLibrary shape.
function libInstance(row, quantity) {
  const inst = {
    id: nextId(), refType: 'item', refId: row.id, name: row.name, kind: row.kind,
    equipped: false, slot: defaultSlotForKind(row.kind), quantity, notes: '',
    _fromClass: true,
  };
  if (row.has_charges) inst.charges = row.max_charges;
  if (row.has_toggle) inst.active = false;
  return inst;
}

// A free-form instance for anything the library doesn't carry.
function freeInstance(name) {
  return { id: nextId(), name, quantity: 1, equipped: false, notes: '', _fromClass: true };
}

/** Resolve one raw equipment string into one or more item instances. */
export function resolveEquipmentName(raw, index) {
  const out = [];
  for (const part of splitParts(raw)) {
    const { qty, rest } = parseQty(normalize(part));
    if (!rest) continue;
    const match = index ? matchRow(rest, index) : null;
    if (match && match.row) out.push(libInstance(match.row, match.forceQty ?? qty));
    else out.push(freeInstance(part));
  }
  return out;
}

// Auto-equip the unambiguous core so a fresh character opens with a working AC
// and at least one attack: armor -> body, shield -> off hand, first weapon ->
// main hand. One item per core slot; the rest stays carried for the player to
// sort out on the Equipment tab.
function autoEquip(instances) {
  const taken = new Set();
  for (const inst of instances) {
    if (inst.refType !== 'item' || !EQUIPPABLE_KINDS.has(inst.kind)) continue;
    let slot = null;
    if (inst.kind === 'armor') slot = 'body';
    else if (inst.kind === 'shield') slot = 'off hand';
    else if (WEAPON_KINDS.has(inst.kind)) slot = 'main hand';
    if (slot && !taken.has(slot)) {
      inst.equipped = true;
      inst.slot = slot;
      taken.add(slot);
    }
  }
}

/**
 * Resolve an ordered list of raw equipment strings into item instances, with the
 * core defensive/offensive gear auto-equipped.
 */
export function resolveStartingItems(rawNames, index) {
  const instances = [];
  (rawNames || []).forEach(raw => instances.push(...resolveEquipmentName(raw, index)));
  autoEquip(instances);
  return instances;
}
