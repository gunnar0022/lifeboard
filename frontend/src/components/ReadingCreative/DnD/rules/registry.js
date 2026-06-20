/**
 * The D&D rules registry — the single read surface for the rules tree.
 *
 * Phase 1 (adapter): this assembles nodes from the EXISTING legacy data
 * (`classProgression.js`, `dndUtils.js`) without moving any of it yet. Every
 * consumer (sheet, creation, level-up, encyclopedia) should read through here,
 * so later phases can relocate the underlying data per-class with no caller
 * changes. React-free by design — nodes name their tracker via `blockId`.
 *
 * Ids are currently the display name (what `character.meta` already stores), so
 * the registry drops in without an id-translation layer.
 */

import {
  CLASS_PROGRESSION, SUBCLASS_PROGRESSION, RACE_PROGRESSION, SUBRACE_PROGRESSION,
  getClassFeatures, getSubclassFeatures, getRaceFeatures, RACES,
} from '../classProgression';
import { CLASS_CASTER_PROFILE, CLASS_FEATURE_DEFAULTS, SUBCLASS_LISTS, CLASS_NAMES } from '../dndUtils';

// ── blockId tables (strings only; resolved to components in
//    components/ClassFeatures/registry.js) ──────────────────────────────────
export const CLASS_BLOCK_BY_TYPE = {
  rage: 'RageTracker',
  wild_shape: 'WildShapeTracker',
  cunning_action: 'CunningActionPanel',
  action_surge: 'FighterResources',
  spell_slots: 'WizardBlock',
  pact_magic: 'WarlockBlock',
  bardic_inspiration: 'BardBlock',
  channel_divinity: 'ClericBlock',
  ki_points: 'MonkBlock',
  divine_smite: 'PaladinBlock',
  sorcery_points: 'SorcererBlock',
  ranger_spells: 'RangerBlock',
};

export const SUBCLASS_BLOCK_BY_NAME = {
  'Rune Knight': 'RuneKnightBlock',
  'Assassin': 'AssassinBlock',
  'Circle of Stars': 'CircleOfStarsBlock',
  'Circle of Spores': 'CircleOfSporesBlock',
  'Path of the Ancestral Guardian': 'AncestralGuardianBlock',
  'War Magic': 'WarMagicBlock',
  'The Archfey': 'ArchfeyBlock',
};

// Small per-class facts the legacy data never stored. These move into the
// per-class modules in P3; for now they live here so the registry is complete.
const CLASS_META = {
  Barbarian: { hitDie: 'd12', subclassLabel: 'Primal Path',          subclassLevel: 3 },
  Bard:      { hitDie: 'd8',  subclassLabel: 'Bard College',         subclassLevel: 3, spellList: 'bard' },
  Cleric:    { hitDie: 'd8',  subclassLabel: 'Divine Domain',        subclassLevel: 1, spellList: 'cleric' },
  Druid:     { hitDie: 'd8',  subclassLabel: 'Druid Circle',         subclassLevel: 2, spellList: 'druid' },
  Fighter:   { hitDie: 'd10', subclassLabel: 'Martial Archetype',    subclassLevel: 3 },
  Monk:      { hitDie: 'd8',  subclassLabel: 'Monastic Tradition',   subclassLevel: 3 },
  Paladin:   { hitDie: 'd10', subclassLabel: 'Sacred Oath',          subclassLevel: 3, spellList: 'paladin' },
  Ranger:    { hitDie: 'd10', subclassLabel: 'Ranger Conclave',      subclassLevel: 3, spellList: 'ranger' },
  Rogue:     { hitDie: 'd8',  subclassLabel: 'Roguish Archetype',    subclassLevel: 3 },
  Sorcerer:  { hitDie: 'd6',  subclassLabel: 'Sorcerous Origin',     subclassLevel: 1, spellList: 'sorcerer' },
  Warlock:   { hitDie: 'd8',  subclassLabel: 'Otherworldly Patron',  subclassLevel: 1, spellList: 'warlock' },
  Wizard:    { hitDie: 'd6',  subclassLabel: 'Arcane Tradition',     subclassLevel: 2, spellList: 'wizard' },
  Artificer: { hitDie: 'd8',  subclassLabel: 'Artificer Specialist', subclassLevel: 3, spellList: 'artificer' },
};

const emptyOverview = { tagline: null, overview: null, definingFeature: null, lore: null };

// ── Node builders ───────────────────────────────────────────────────────────
function buildClassNode(name) {
  const meta = CLASS_META[name] || {};
  const trackerSeed = CLASS_FEATURE_DEFAULTS[name] || null;
  const cp = CLASS_CASTER_PROFILE[name];
  return {
    id: name, name, type: 'class',
    parentId: null,
    childIds: (SUBCLASS_LISTS[name] || []).map(s => s.name),
    // Normalize the legacy profile's `casterType` to the schema's `type`.
    caster: cp ? { ability: cp.ability, type: cp.casterType, preparation: cp.preparation } : null,
    hitDie: meta.hitDie || null,
    trackerSeed,
    blockId: trackerSeed ? (CLASS_BLOCK_BY_TYPE[trackerSeed.type] || null) : null,
    spellList: meta.spellList || null,
    subclassLabel: meta.subclassLabel || 'Subclass',
    subclassLevel: meta.subclassLevel || 3,
    helpers: {},        // P3
    creation: null,     // P4
    progression: CLASS_PROGRESSION[name] || [],
    ...emptyOverview,
  };
}

function buildSubclassNode(name, classNameFallback) {
  const data = SUBCLASS_PROGRESSION[name];
  const progression = data?.features || [];
  const blockId = SUBCLASS_BLOCK_BY_NAME[name] || null;
  return {
    id: name, name, type: 'subclass',
    parentId: data?.className || classNameFallback || null,
    childIds: [],
    blockId,
    implemented: progression.length > 0 || !!blockId,
    progression,
    ...emptyOverview,
  };
}

function buildRaceNode(name) {
  const data = RACE_PROGRESSION[name] || {};
  return {
    id: name, name, type: 'race',
    parentId: null,
    childIds: data.subraces || [],
    abilityBonuses: {}, // P4
    speed: null, size: null, creatureType: null,
    blockId: null,      // racial trackers render via RacialBlock outside this dispatch
    progression: data.traits || [],
    ...emptyOverview,
  };
}

function buildSubraceNode(name) {
  const data = SUBRACE_PROGRESSION[name] || {};
  return {
    id: name, name, type: 'subrace',
    parentId: data.race || null,
    childIds: [],
    abilityBonuses: {}, // P4
    progression: data.traits || [],
    ...emptyOverview,
  };
}

// ── Assemble the registry once ──────────────────────────────────────────────
const NODES = new Map();
const ROOTS = { class: [], race: [] };

(function assemble() {
  for (const name of CLASS_NAMES) {
    NODES.set(name, buildClassNode(name));
    ROOTS.class.push(name);
  }
  // Subclasses: iterate the menu so every listed subclass exists as a node
  // (even unimplemented ones, for the encyclopedia/creation), with class context.
  for (const [className, list] of Object.entries(SUBCLASS_LISTS)) {
    for (const { name } of list) {
      if (!NODES.has(name)) NODES.set(name, buildSubclassNode(name, className));
    }
  }
  // Any progression-only subclass not in a menu (defensive).
  for (const name of Object.keys(SUBCLASS_PROGRESSION)) {
    if (!NODES.has(name)) NODES.set(name, buildSubclassNode(name));
  }
  for (const name of RACES) {
    NODES.set(name, buildRaceNode(name));
    ROOTS.race.push(name);
  }
  for (const name of Object.keys(SUBRACE_PROGRESSION)) {
    if (!NODES.has(name)) NODES.set(name, buildSubraceNode(name));
  }
})();

// ── Query API ───────────────────────────────────────────────────────────────
export function getNode(id) { return NODES.get(id) || null; }

function getOfType(id, type) {
  const n = NODES.get(id);
  return n && n.type === type ? n : null;
}
export const getClass = (id) => getOfType(id, 'class');
export const getSubclass = (id) => getOfType(id, 'subclass');
export const getRace = (id) => getOfType(id, 'race');
export const getSubrace = (id) => getOfType(id, 'subrace');

/** Top of each tree: getRoots('class') or getRoots('race'). */
export function getRoots(kind) {
  return (ROOTS[kind] || []).map(id => NODES.get(id)).filter(Boolean);
}

/** Resolve a node's childIds into nodes. */
export function getChildren(id) {
  const n = NODES.get(id);
  if (!n) return [];
  return n.childIds.map(cid => NODES.get(cid)).filter(Boolean);
}

/** Resolve a node's parent node. */
export function getParent(id) {
  const n = NODES.get(id);
  return n && n.parentId ? (NODES.get(n.parentId) || null) : null;
}

/**
 * The shared surface character creation and the encyclopedia both read.
 * Creation renders shallow (overview + definingFeature); the encyclopedia
 * renders deep (+ lore + full progression + children). Same data, one truth.
 */
export function getNodeDetail(id) {
  const n = NODES.get(id);
  if (!n) return null;
  return {
    id: n.id,
    name: n.name,
    type: n.type,
    parentId: n.parentId,
    tagline: n.tagline,
    overview: n.overview,
    definingFeature: n.definingFeature,
    lore: n.lore,
    progression: n.progression || [],
    creation: n.creation || null,
    abilityBonuses: n.abilityBonuses || undefined,
    children: getChildren(id).map(c => ({ id: c.id, name: c.name, type: c.type })),
    parent: getParent(id) ? { id: n.parentId, name: NODES.get(n.parentId).name } : null,
  };
}

/** Whether a subclass is implemented (has progression or a tracker). */
export function isSubclassImplemented(name) {
  const n = getSubclass(name);
  return !!(n && n.implemented);
}

// ── Feature queries ─────────────────────────────────────────────────────────
/**
 * Class + subclass + race features unlocked at level <= L (the Features tab).
 * @param {{className?:string, subclass?:string, race?:string, subrace?:string}} sel
 */
export function getUnlockedFeatures(sel, level) {
  const { className, subclass, race, subrace } = sel || {};
  return [
    ...getClassFeatures(className, level),
    ...getSubclassFeatures(subclass, level),
    ...getRaceFeatures(race, subrace),
  ].sort((a, b) => (a.level || 1) - (b.level || 1));
}

/**
 * Features unlocked at EXACTLY level L — the level-up diff (feature 2).
 * Race traits (level 1) only surface on the jump to level 1.
 */
export function featuresUnlockedAt(sel, level) {
  const { className, subclass, race, subrace } = sel || {};
  const all = [
    ...getClassFeatures(className, level),
    ...getSubclassFeatures(subclass, level),
    ...getRaceFeatures(race, subrace),
  ];
  return all.filter(f => (f.level || 1) === level)
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}
