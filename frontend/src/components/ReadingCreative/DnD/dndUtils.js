/** D&D 5e utility functions and constants. */

export function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonus(level) {
  return Math.floor((level - 1) / 4) + 2;
}

// Parse a hit die ('d8' or 8) to its number. Returns null if unparseable.
export function hitDieNumber(hitDie) {
  if (!hitDie) return null;
  const n = typeof hitDie === 'number' ? hitDie : parseInt(String(hitDie).replace(/\D/g, ''), 10);
  return n || null;
}

// Fixed-value max HP (PHB "take the average" — no rolling):
//   level 1   = max die + CON mod
//   each level after = (die/2 + 1) + CON mod   (d6→4, d8→5, d10→6, d12→7)
export function hpForClassLevel(hitDie, level, conMod) {
  const die = hitDieNumber(hitDie);
  if (!die) return null;
  const lvl = Math.max(1, level || 1);
  const avgPerLevel = die / 2 + 1;
  return Math.max(1, die + conMod + (lvl - 1) * (avgPerLevel + conMod));
}

/**
 * Extra max HP granted by a subclass, layered on top of the class HP formula.
 * Draconic Bloodline's Draconic Resilience adds +1 at 1st level and +1 each
 * sorcerer level thereafter — i.e. +level total.
 */
export function subclassHpBonus(subclass, level) {
  if (subclass === 'Draconic Bloodline') return Math.max(1, level || 1);
  return 0;
}

export function skillMod(abilities, skillAbility, profBonus, isProficient, isExpert) {
  const base = abilityMod(abilities[skillAbility]);
  if (isExpert) return base + profBonus * 2;
  if (isProficient) return base + profBonus;
  return base;
}

export function passivePerception(abilities, profBonus, isProficient) {
  return 10 + skillMod(abilities, 'WIS', profBonus, isProficient, false);
}

export const SKILLS = [
  { name: 'Acrobatics', ability: 'DEX' },
  { name: 'Animal Handling', ability: 'WIS' },
  { name: 'Arcana', ability: 'INT' },
  { name: 'Athletics', ability: 'STR' },
  { name: 'Deception', ability: 'CHA' },
  { name: 'History', ability: 'INT' },
  { name: 'Insight', ability: 'WIS' },
  { name: 'Intimidation', ability: 'CHA' },
  { name: 'Investigation', ability: 'INT' },
  { name: 'Medicine', ability: 'WIS' },
  { name: 'Nature', ability: 'INT' },
  { name: 'Perception', ability: 'WIS' },
  { name: 'Performance', ability: 'CHA' },
  { name: 'Persuasion', ability: 'CHA' },
  { name: 'Religion', ability: 'INT' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' },
  { name: 'Survival', ability: 'WIS' },
];

// CSS variable names for class colors (resolved at render time via getComputedStyle)
export const CLASS_COLOR_VARS = {
  Barbarian: '--dnd-class-barbarian',
  Rogue: '--dnd-class-rogue',
  Fighter: '--dnd-class-fighter',
  Wizard: '--dnd-class-wizard',
  Warlock: '--dnd-class-warlock',
  Sorcerer: '--dnd-class-sorcerer',
  Cleric: '--dnd-class-cleric',
  Druid: '--dnd-class-druid',
  Paladin: '--dnd-class-paladin',
  Ranger: '--dnd-class-ranger',
  Bard: '--dnd-class-bard',
  Monk: '--dnd-class-monk',
  Artificer: '--dnd-class-artificer',
};

// Returns var(--dnd-class-xxx) for use in inline styles
export function classColor(className) {
  const v = CLASS_COLOR_VARS[className];
  return v ? `var(${v})` : 'var(--dnd-border)';
}

// Legacy constant — still exported so CLASS_NAMES works, but prefer classColor() for styles
export const CLASS_COLORS = {
  Barbarian: 'var(--dnd-class-barbarian)',
  Rogue: 'var(--dnd-class-rogue)',
  Fighter: 'var(--dnd-class-fighter)',
  Wizard: 'var(--dnd-class-wizard)',
  Warlock: 'var(--dnd-class-warlock)',
  Sorcerer: 'var(--dnd-class-sorcerer)',
  Cleric: 'var(--dnd-class-cleric)',
  Druid: 'var(--dnd-class-druid)',
  Paladin: 'var(--dnd-class-paladin)',
  Ranger: 'var(--dnd-class-ranger)',
  Bard: 'var(--dnd-class-bard)',
  Monk: 'var(--dnd-class-monk)',
  Artificer: 'var(--dnd-class-artificer)',
};

export const CLASS_NAMES = Object.keys(CLASS_COLORS);

export const CLASS_FEATURE_DEFAULTS = {
  Barbarian: {
    type: 'rage', maxUses: 2, currentUses: 2, active: false,
    bonusDamage: 2, resistances: ['bludgeoning', 'piercing', 'slashing'],
    extraWhileActive: '',
  },
  Rogue: {
    type: 'cunning_action', sneakAttackDamage: '1d6',
  },
  Fighter: {
    type: 'action_surge',
    fightingStyle: '',
    actionSurge: { maxUses: 1, currentUses: 1, rechargeOn: 'short' },
    secondWind: { maxUses: 1, currentUses: 1, rechargeOn: 'short', healDice: '1d10' },
    indomitable: { maxUses: 0, currentUses: 0, rechargeOn: 'long' },
  },
  Wizard: {
    type: 'spell_slots',
    arcaneRecovery: { maxUses: 1, currentUses: 1, rechargeOn: 'long' },
  },
  Warlock: {
    type: 'pact_magic',
    pactBoon: '',
  },
  Sorcerer: {
    type: 'sorcery_points', maxPoints: 1, currentPoints: 1,
  },
  Cleric: {
    type: 'channel_divinity', maxUses: 1, currentUses: 1, rechargeOn: 'short',
  },
  Druid: {
    type: 'wild_shape', maxUses: 2, currentUses: 2, active: false, rechargeOn: 'short',
  },
  Paladin: {
    type: 'divine_smite',
    layOnHands: { maxPool: 5, currentPool: 5 },
  },
  Ranger: {
    type: 'ranger_spells',
  },
  Bard: {
    type: 'bardic_inspiration', maxUses: 1, currentUses: 1, dieDamage: 'd6', rechargeOn: 'long',
  },
  Monk: {
    type: 'ki_points', maxPoints: 1, currentPoints: 1,
  },
  Artificer: {
    type: 'artificer_infusions',
    knownInfusions: [],                       // names chosen on the Features tab
    infusedItems: [],                         // active: [{ id, infusion, itemName, attuned }]
    magicalTinkering: { current: 0 },         // active tinkered objects
    flashOfGenius: { current: 0, max: 0 },    // reaction uses (= INT mod)
    spellStoring: { spell: '', current: 0, max: 0 },
  },
};

export const SUBCLASS_LISTS = {
  Barbarian: [
    { name: 'Path of the Berserker', implemented: true },
    { name: 'Path of the Totem Warrior', implemented: true },
    { name: 'Path of the Ancestral Guardian', implemented: true },
    { name: 'Path of the Storm Herald', implemented: true },
    { name: 'Path of the Zealot', implemented: true },
    { name: 'Path of the Battlerager', implemented: true },
    { name: 'Path of the Beast', implemented: true },
    { name: 'Path of the Giant', implemented: true },
    { name: 'Path of Wild Magic', implemented: true },
  ],
  Fighter: [
    { name: 'Champion', implemented: true },
    { name: 'Battle Master', implemented: true },
    { name: 'Eldritch Knight', implemented: true },
    { name: 'Arcane Archer', implemented: true },
    { name: 'Cavalier', implemented: true },
    { name: 'Samurai', implemented: true },
    { name: 'Echo Knight', implemented: true },
    { name: 'Psi Warrior', implemented: true },
    { name: 'Rune Knight', implemented: true },
    { name: 'Banneret (Purple Dragon Knight)', implemented: true },
  ],
  Rogue: [
    { name: 'Thief', implemented: true },
    { name: 'Assassin', implemented: true },
    { name: 'Arcane Trickster', implemented: true },
    { name: 'Mastermind', implemented: true },
    { name: 'Swashbuckler', implemented: true },
    { name: 'Inquisitive', implemented: true },
    { name: 'Scout', implemented: true },
    { name: 'Phantom', implemented: true },
    { name: 'Soulknife', implemented: true },
  ],
  Wizard: [
    { name: 'School of Abjuration', implemented: false },
    { name: 'School of Conjuration', implemented: false },
    { name: 'School of Divination', implemented: false },
    { name: 'School of Enchantment', implemented: false },
    { name: 'School of Evocation', implemented: false },
    { name: 'School of Illusion', implemented: false },
    { name: 'School of Necromancy', implemented: false },
    { name: 'School of Transmutation', implemented: false },
    { name: 'Bladesinging', implemented: false },
    { name: 'War Magic', implemented: true },
    { name: 'Chronurgy Magic', implemented: false },
    { name: 'Graviturgy Magic', implemented: false },
    { name: 'Order of Scribes', implemented: false },
  ],
  Druid: [
    { name: 'Circle of the Land', implemented: true },
    { name: 'Circle of the Moon', implemented: true },
    { name: 'Circle of Dreams', implemented: true },
    { name: 'Circle of the Shepherd', implemented: true },
    { name: 'Circle of Spores', implemented: true },
    { name: 'Circle of Stars', implemented: true },
    { name: 'Circle of Wildfire', implemented: true },
  ],
  Cleric: [
    { name: 'Knowledge Domain', implemented: false },
    { name: 'Life Domain', implemented: false },
    { name: 'Light Domain', implemented: false },
    { name: 'Nature Domain', implemented: false },
    { name: 'Tempest Domain', implemented: false },
    { name: 'Trickery Domain', implemented: false },
    { name: 'War Domain', implemented: false },
    { name: 'Death Domain', implemented: false },
    { name: 'Forge Domain', implemented: false },
    { name: 'Grave Domain', implemented: false },
    { name: 'Order Domain', implemented: false },
    { name: 'Peace Domain', implemented: false },
    { name: 'Twilight Domain', implemented: false },
  ],
  Paladin: [
    { name: 'Oath of Devotion', implemented: true },
    { name: 'Oath of the Ancients', implemented: true },
    { name: 'Oath of Vengeance', implemented: true },
    { name: 'Oath of Conquest', implemented: true },
    { name: 'Oath of the Crown', implemented: true },
    { name: 'Oath of Redemption', implemented: true },
    { name: 'Oath of Glory', implemented: true },
    { name: 'Oath of the Watchers', implemented: true },
    { name: 'Oathbreaker', implemented: true },
  ],
  Ranger: [
    { name: 'Hunter', implemented: true },
    { name: 'Beast Master', implemented: true },
    { name: 'Gloom Stalker', implemented: true },
    { name: 'Horizon Walker', implemented: true },
    { name: 'Monster Slayer', implemented: true },
    { name: 'Fey Wanderer', implemented: true },
    { name: 'Swarmkeeper', implemented: true },
    { name: 'Drakewarden', implemented: true },
  ],
  Warlock: [
    { name: 'The Archfey', implemented: true },
    { name: 'The Fiend', implemented: false },
    { name: 'The Great Old One', implemented: false },
    { name: 'The Celestial', implemented: false },
    { name: 'The Hexblade', implemented: false },
    { name: 'The Fathomless', implemented: false },
    { name: 'The Genie', implemented: false },
    { name: 'The Undead', implemented: false },
  ],
  Sorcerer: [
    { name: 'Draconic Bloodline', implemented: true },
    { name: 'Wild Magic', implemented: false },
    { name: 'Divine Soul', implemented: true },
    { name: 'Shadow Magic', implemented: false },
    { name: 'Storm Sorcery', implemented: false },
    { name: 'Aberrant Mind', implemented: true },
    { name: 'Clockwork Soul', implemented: true },
  ],
  Bard: [
    { name: 'College of Lore', implemented: true },
    { name: 'College of Valor', implemented: true },
    { name: 'College of Glamour', implemented: true },
    { name: 'College of Swords', implemented: true },
    { name: 'College of Whispers', implemented: true },
    { name: 'College of Creation', implemented: true },
    { name: 'College of Eloquence', implemented: true },
    { name: 'College of Spirits', implemented: true },
  ],
  Monk: [
    { name: 'Way of the Open Hand', implemented: false },
    { name: 'Way of Shadow', implemented: false },
    { name: 'Way of the Four Elements', implemented: false },
    { name: 'Way of the Drunken Master', implemented: false },
    { name: 'Way of the Kensei', implemented: false },
    { name: 'Way of the Sun Soul', implemented: false },
    { name: 'Way of the Astral Self', implemented: false },
    { name: 'Way of Mercy', implemented: false },
  ],
  Artificer: [
    { name: 'Alchemist', implemented: true },
    { name: 'Armorer', implemented: true },
    { name: 'Artillerist', implemented: true },
    { name: 'Battle Smith', implemented: true },
  ],
};

export const NEW_CHARACTER_DATA = {
  meta: {
    name: 'New Character', race: '', className: '', level: 1,
    subclass: '', background: '', alignment: '', appearance: '',
    languages: ['Common'], speed: 30, size: 'Medium', bodyType: '',
  },
  abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
  saveProficiencies: [],
  skillProficiencies: [],
  skillExpertise: [],
  proficiencies: { armor: [], weapons: [], tools: [] },
  combat: {
    ac: 10, acSource: '', hpMax: 10, hpCurrent: 10, hpTemp: 0,
    hitDiceType: 8, hitDiceRemaining: 1,
    deathSaves: { successes: 0, failures: 0 },
  },
  attacks: [],
  features: [],
  classFeature: null,
  items: [],
  coins: { CP: 0, SP: 0, EP: 0, GP: 0, PP: 0 },
  customBoxes: [
    { title: 'Personality', fields: [
      { label: 'Trait', value: '' },
      { label: 'Ideal', value: '' },
      { label: 'Bond', value: '' },
      { label: 'Flaw', value: '' },
    ]},
  ],
  spellcasting: null,
};

// ---- Character sheet tab registry -------------------------------------
// The single source of truth for which tabs exist. New features become a new
// entry here and slot into the per-character tab config automatically.
export const TAB_REGISTRY = [
  { id: 'combat', label: 'Combat' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'stats', label: 'Stats' },
  { id: 'features', label: 'Features' },
  { id: 'spells', label: 'Spells' },
  { id: 'info', label: 'Info' },
  { id: 'encyclopedia', label: 'Encyclopedia' },
  { id: 'notes', label: 'Notes', requiresCampaign: true },
];

// Whether a tab should be enabled by default for a given character.
function defaultTabEnabled(tabId, character, hasCampaign) {
  if (tabId === 'spells') return !!character?.spellcasting;
  if (tabId === 'notes') return hasCampaign;
  return true;
}

// Build the initial ordered tab config from the registry.
export function defaultTabsConfig(character, hasCampaign) {
  return TAB_REGISTRY.map(t => ({ id: t.id, enabled: defaultTabEnabled(t.id, character, hasCampaign) }));
}

// Reconcile a stored config against the current registry: drop unknown tabs,
// append registry tabs added since the character was created. Returns a new
// array, or the same reference if nothing changed.
export function reconcileTabsConfig(config, character, hasCampaign) {
  if (!Array.isArray(config)) return defaultTabsConfig(character, hasCampaign);
  const known = new Set(config.map(t => t.id));
  const valid = config.filter(t => TAB_REGISTRY.some(r => r.id === t.id));
  const missing = TAB_REGISTRY
    .filter(r => !known.has(r.id))
    .map(r => ({ id: r.id, enabled: defaultTabEnabled(r.id, character, hasCampaign) }));
  if (valid.length === config.length && missing.length === 0) return config;
  return [...valid, ...missing];
}

// ── Spellcasting ────────────────────────────────────────────────────────────
// New shape (slots are DERIVED from class+level via spellSlots.js; we persist
// only what the formula can't know — expended counts, the spell lists, and any
// bonus slots granted by items/feats):
//   {
//     ability, casterType, preparation,   // 'prepared' | 'known'
//     slotsExpended: { '1': 0, ... },     // per standard slot level
//     pact: { expended: 0 },              // pact-magic pool only
//     extraSlots: [ { id, label, level, max, expended, recharge } ],
//     cantrips: [ids], prepared: [ids], known: [ids],
//     alwaysPrepared: [ids],              // pinned, excluded from prepared cap
//     grantedSpells: [ { id, spellId, source, useType, max, used, recharge,
//                        canUseSlots, castLevel } ],
//     spellOrder: { cantrips, prepared, known },
//     concentratingOn: null,
//   }

// Maps a class to its caster archetype + how it accesses spells.
// (Subclass third-casters — Eldritch Knight / Arcane Trickster — are layered
//  in where those subclasses are authored.)
export const CLASS_CASTER_PROFILE = {
  Wizard:    { ability: 'INT', casterType: 'full',      preparation: 'prepared' },
  Cleric:    { ability: 'WIS', casterType: 'full',      preparation: 'prepared' },
  Druid:     { ability: 'WIS', casterType: 'full',      preparation: 'prepared' },
  Bard:      { ability: 'CHA', casterType: 'full',      preparation: 'known' },
  Sorcerer:  { ability: 'CHA', casterType: 'full',      preparation: 'known' },
  Paladin:   { ability: 'CHA', casterType: 'half',      preparation: 'prepared' },
  Ranger:    { ability: 'WIS', casterType: 'half',      preparation: 'known' },
  Artificer: { ability: 'INT', casterType: 'artificer', preparation: 'prepared' },
  Warlock:   { ability: 'CHA', casterType: 'pact',      preparation: 'known' },
};

// Subclasses that grant their own spellcasting (third-casters). Resolved when the
// base class isn't a caster — e.g. an Eldritch Knight Fighter or Arcane Trickster
// Rogue. They cast from the wizard list using Intelligence, learning spells.
export const SUBCLASS_CASTER_PROFILE = {
  'Eldritch Knight': { ability: 'INT', casterType: 'third', preparation: 'known' },
  'Arcane Trickster': { ability: 'INT', casterType: 'third', preparation: 'known' },
};

/** Resolve the caster profile for a character: class first, then subclass. */
export function casterProfileFor(className, subclass) {
  return CLASS_CASTER_PROFILE[className] || SUBCLASS_CASTER_PROFILE[subclass] || null;
}

/** True if the class has class-granted spellcasting (drives the main slot area). */
export function isCasterClass(className) {
  return !!CLASS_CASTER_PROFILE[className];
}

const _emptySpellcasting = (profile) => ({
  ability: profile.ability,
  casterType: profile.casterType,
  preparation: profile.preparation,
  classLevel: null,            // null → follow character level (multiclass-ready hook)
  slotsExpended: {},
  pact: { expended: 0 },
  extraSlots: [],
  cantrips: [],
  prepared: [],
  known: [],
  alwaysPrepared: [],
  grantedSpells: [],
  spellOrder: { cantrips: [], prepared: [], known: [] },
  concentratingOn: null,
});

export const SPELLCASTING_DEFAULTS = Object.fromEntries(
  Object.entries(CLASS_CASTER_PROFILE).map(([cls, prof]) => [cls, _emptySpellcasting(prof)])
);
// Non-casters
['Barbarian', 'Fighter', 'Rogue', 'Monk'].forEach(c => { SPELLCASTING_DEFAULTS[c] = null; });

/** Build a blank spellcasting blob for a caster profile (public wrapper). */
export function buildEmptySpellcasting(profile) {
  return profile ? _emptySpellcasting(profile) : null;
}

// Seed blobs for subclass third-casters (used when the subclass is chosen).
export const SUBCLASS_SPELLCASTING_DEFAULTS = Object.fromEntries(
  Object.entries(SUBCLASS_CASTER_PROFILE).map(([name, prof]) => [name, _emptySpellcasting(prof)])
);

/**
 * Upgrade any stored spellcasting blob (old or new shape) to the current shape.
 * Old shape used: type, slots:{lvl:{max,expended}}, pactSlots:{max,current,level},
 * preparedSpells, knownSpells, specialSlots[].
 */
export function normalizeSpellcasting(sc, className) {
  if (!sc) return sc;
  const profile = CLASS_CASTER_PROFILE[className] || null;
  // casterType & preparation are class-authoritative: the class profile wins
  // over anything stored, so the slot system can't drift when the class changes.
  const casterType = profile?.casterType || sc.casterType ||
    (sc.type === 'pact_magic' ? 'pact' : 'full');
  const preparation = profile?.preparation || sc.preparation ||
    (sc.type === 'known' ? 'known' : 'prepared');
  const ability = sc.ability || profile?.ability || 'INT';
  const base = _emptySpellcasting({ ability, casterType, preparation });

  // Already new shape — fill missing keys, then force class-authoritative fields.
  if (sc.slotsExpended || sc.grantedSpells || sc.preparation) {
    return {
      ...base,
      ...sc,
      casterType,
      preparation,
      pact: { ...base.pact, ...(sc.pact || {}) },
      spellOrder: { ...base.spellOrder, ...(sc.spellOrder || {}) },
    };
  }

  // ── Migrate old shape ──
  const slotsExpended = {};
  if (sc.slots) {
    Object.entries(sc.slots).forEach(([lvl, s]) => {
      if (s && s.expended) slotsExpended[lvl] = s.expended;
    });
  }
  const extraSlots = (sc.specialSlots || []).map((s, i) => ({
    id: `legacy-${i}`,
    label: s.source_label || 'Special',
    level: 1,
    max: s.charges || 1,
    expended: s.charges_used || 0,
    recharge: s.recharge_condition || 'Long Rest',
  }));
  const pactExpended = sc.pactSlots
    ? Math.max(0, (sc.pactSlots.max || 0) - (sc.pactSlots.current ?? sc.pactSlots.max ?? 0))
    : 0;

  return {
    ...base,
    classLevel: sc.classLevel ?? null,
    slotsExpended,
    pact: { expended: pactExpended },
    extraSlots,
    cantrips: sc.cantrips || [],
    prepared: sc.preparedSpells || [],
    known: sc.knownSpells || [],
    alwaysPrepared: sc.alwaysPrepared || [],
    grantedSpells: sc.grantedSpells || [],
    spellOrder: {
      cantrips: sc.spellOrder?.cantrips || [],
      prepared: sc.spellOrder?.prepared || [],
      known: sc.spellOrder?.known || [],
    },
    concentratingOn: sc.concentratingOn || null,
  };
}

export function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
