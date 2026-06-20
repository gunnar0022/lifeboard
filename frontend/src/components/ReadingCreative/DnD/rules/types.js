/**
 * D&D rules-tree node schema (see REFACTOR_PLAN.md).
 *
 * These are JSDoc typedefs only — no runtime. They document the canonical shape
 * every race / subrace / class / subclass node assembles into, so the character
 * sheet, character creation, level-up, and the encyclopedia can all read one
 * standardized surface (`rules/registry.js`).
 *
 * IMPORTANT: this module (and all of `rules/`) must stay React-free. Nodes
 * reference their Combat-tab tracker by `blockId` *string*, resolved to an
 * actual component in `components/ClassFeatures/registry.js`.
 */

/**
 * A single level-gated feature on a node's progression.
 * @typedef {Object} FeatureEntry
 * @property {string} id
 * @property {string} name
 * @property {number} [level]              Unlock level (defaults to 1 if absent).
 * @property {string} source              Class/subclass/race name (badge label).
 * @property {string} desc                Full mechanical text.
 * @property {boolean} [combat]           Has a Combat-tab tracker.
 * @property {string} [choice]            Inline build-choice id (e.g. 'metamagic').
 * @property {string[]} [options]         Options for that picker.
 * @property {Object[]} [spells]          Racial/granted spells, if any.
 */

/**
 * Caster configuration (null for non-casters).
 * @typedef {Object} CasterProfile
 * @property {('STR'|'DEX'|'CON'|'INT'|'WIS'|'CHA')} ability
 * @property {('full'|'half'|'third'|'artificer'|'pact')} type
 * @property {('prepared'|'known')} preparation
 */

/**
 * Fields shared by every node type.
 * @typedef {Object} BaseNode
 * @property {string} id                  Canonical id (currently the display name).
 * @property {string} name
 * @property {('class'|'subclass'|'race'|'subrace')} type
 * @property {?string} parentId           Tree edge UP (subclass→class, subrace→race).
 * @property {string[]} childIds          Tree edges DOWN.
 * @property {FeatureEntry[]} progression Level-gated features (class/subclass) or traits (race).
 * // ── overview layer (creation lands here; encyclopedia headlines with it) ──
 * @property {?string} tagline
 * @property {?string} overview
 * @property {?{name:string,desc:string}} definingFeature
 * // ── lore layer (encyclopedia "fluff"; authored in P4) ──
 * @property {?Object} lore
 */

/**
 * @typedef {BaseNode & {
 *   caster: ?CasterProfile,
 *   hitDie: ?string,
 *   trackerSeed: ?Object,           // seed for character.classFeature (was CLASS_FEATURE_DEFAULTS)
 *   blockId: ?string,               // Combat-tab tracker component key
 *   spellList: ?string,             // tag joining to DB spells (feature 3.5)
 *   subclassLabel: string,          // 'Arcane Tradition', 'Sacred Oath'...
 *   subclassLevel: number,          // level at which the subclass is chosen
 *   helpers: Object,                // co-located scaling fns (populated in P3)
 *   creation: ?Object,              // structured creation data (populated in P4)
 * }} ClassNode
 */

/**
 * @typedef {BaseNode & {
 *   blockId: ?string,
 *   implemented: boolean,           // DERIVED: has progression or a block (never stored)
 * }} SubclassNode
 */

/**
 * @typedef {BaseNode & {
 *   abilityBonuses: Object,         // default racial ASI, e.g. { DEX: 2 } (authored in P4)
 *   blockId: ?string,
 *   speed: ?number,
 *   size: ?string,
 *   creatureType: ?string,
 * }} RaceNode
 */

/**
 * @typedef {BaseNode & {
 *   abilityBonuses: Object,
 * }} SubraceNode
 */

/** @typedef {ClassNode | SubclassNode | RaceNode | SubraceNode} Node */

export {}; // keep this a module
