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
    actionSurge: { maxUses: 1, currentUses: 1, rechargeOn: 'short' },
    secondWind: { maxUses: 1, currentUses: 1, rechargeOn: 'short', healDice: '1d10' },
  },
  Wizard: {
    type: 'spell_slots',
    arcaneRecovery: { maxUses: 1, currentUses: 1, rechargeOn: 'long' },
  },
  Warlock: {
    type: 'pact_magic',
    pactSlots: { max: 1, current: 1, slotLevel: 1 },
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
    type: 'artificer_infusions', maxInfusions: 2, currentInfusions: 2,
  },
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
  equipment: [],
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

// Spellcasting defaults by class (null = non-caster)
const _scPrepared = (ability) => ({
  ability, type: 'prepared',
  slots: { '1': { max: 2, expended: 0 } },
  cantrips: [], preparedSpells: [], knownSpells: [],
  spellOrder: { cantrips: [], prepared: [], known: [] },
  concentratingOn: null,
});
const _scKnown = (ability) => ({
  ability, type: 'known',
  slots: { '1': { max: 2, expended: 0 } },
  cantrips: [], knownSpells: [],
  spellOrder: { cantrips: [], known: [] },
  concentratingOn: null,
});

export const SPELLCASTING_DEFAULTS = {
  Wizard:    _scPrepared('INT'),
  Cleric:    _scPrepared('WIS'),
  Druid:     _scPrepared('WIS'),
  Paladin:   _scPrepared('CHA'),
  Artificer: _scPrepared('INT'),
  Sorcerer:  _scKnown('CHA'),
  Bard:      _scKnown('CHA'),
  Ranger:    _scKnown('WIS'),
  Warlock: {
    ability: 'CHA', type: 'pact_magic',
    pactSlots: { max: 1, current: 1, level: 1 },
    cantrips: [], knownSpells: [],
    spellOrder: { cantrips: [], known: [] },
    concentratingOn: null,
  },
  // Non-casters: null
  Barbarian: null, Fighter: null, Rogue: null, Monk: null,
};

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
