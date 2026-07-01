/**
 * Class "creation" data — the level-1 proficiencies and starting equipment used
 * by the character-creation flow. One entry per class, keyed by class name.
 * Authored from the 5e PHB (Artificer from TCE). Skill lists use the exact skill
 * names from dndUtils' SKILLS. `startingEquipment` groups are either `fixed`
 * (always granted) or `choice` (the player picks one option; each option is a
 * list of item names).
 *
 * Shape:
 *   {
 *     savingThrows: [ability, ability],
 *     skillChoices: { count, from: [skill…] | 'any' },
 *     armor: [string…], weapons: [string…], tools: [string…],
 *     startingEquipment: [
 *       { kind: 'fixed',  items: [name…] },
 *       { kind: 'choice', label, options: [ [name…], [name…] ] },
 *     ],
 *   }
 */
export const CLASS_CREATION = {
  Barbarian: {
    savingThrows: ['STR', 'CON'],
    skillChoices: { count: 2, from: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'] },
    armor: ['Light armor', 'Medium armor', 'Shields'],
    weapons: ['Simple weapons', 'Martial weapons'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Primary weapon', options: [['Greataxe'], ['Any martial melee weapon']] },
      { kind: 'choice', label: 'Secondary weapon', options: [['Two handaxes'], ['Any simple weapon']] },
      { kind: 'fixed', items: ["Explorer's pack", 'Four javelins'] },
    ],
  },
  Bard: {
    savingThrows: ['DEX', 'CHA'],
    skillChoices: { count: 3, from: 'any' },
    armor: ['Light armor'],
    weapons: ['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    tools: ['Three musical instruments of your choice'],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Rapier'], ['Longsword'], ['Any simple weapon']] },
      { kind: 'choice', label: 'Pack', options: [["Diplomat's pack"], ["Entertainer's pack"]] },
      { kind: 'choice', label: 'Instrument', options: [['Lute'], ['Any other musical instrument']] },
      { kind: 'fixed', items: ['Leather armor', 'Dagger'] },
    ],
  },
  Cleric: {
    savingThrows: ['WIS', 'CHA'],
    skillChoices: { count: 2, from: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'] },
    armor: ['Light armor', 'Medium armor', 'Shields'],
    weapons: ['Simple weapons'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Mace'], ['Warhammer (if proficient)']] },
      { kind: 'choice', label: 'Armor', options: [['Scale mail'], ['Leather armor'], ['Chain mail (if proficient)']] },
      { kind: 'choice', label: 'Ranged', options: [['Light crossbow and 20 bolts'], ['Any simple weapon']] },
      { kind: 'choice', label: 'Pack', options: [["Priest's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['Shield', 'Holy symbol'] },
    ],
  },
  Druid: {
    savingThrows: ['INT', 'WIS'],
    skillChoices: { count: 2, from: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'] },
    armor: ['Light armor (nonmetal)', 'Medium armor (nonmetal)', 'Shields (nonmetal)'],
    weapons: ['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'],
    tools: ['Herbalism kit'],
    startingEquipment: [
      { kind: 'choice', label: 'Shield or weapon', options: [['Wooden shield'], ['Any simple weapon']] },
      { kind: 'choice', label: 'Melee weapon', options: [['Scimitar'], ['Any simple melee weapon']] },
      { kind: 'fixed', items: ['Leather armor', "Explorer's pack", 'Druidic focus'] },
    ],
  },
  Fighter: {
    savingThrows: ['STR', 'CON'],
    skillChoices: { count: 2, from: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'] },
    armor: ['All armor', 'Shields'],
    weapons: ['Simple weapons', 'Martial weapons'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Armor', options: [['Chain mail'], ['Leather armor, longbow, and 20 arrows']] },
      { kind: 'choice', label: 'Weapons', options: [['A martial weapon and a shield'], ['Two martial weapons']] },
      { kind: 'choice', label: 'Ranged', options: [['Light crossbow and 20 bolts'], ['Two handaxes']] },
      { kind: 'choice', label: 'Pack', options: [["Dungeoneer's pack"], ["Explorer's pack"]] },
    ],
  },
  Monk: {
    savingThrows: ['STR', 'DEX'],
    skillChoices: { count: 2, from: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'] },
    armor: [],
    weapons: ['Simple weapons', 'Shortswords'],
    tools: ["One type of artisan's tools or one musical instrument"],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Shortsword'], ['Any simple weapon']] },
      { kind: 'choice', label: 'Pack', options: [["Dungeoneer's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['10 darts'] },
    ],
  },
  Paladin: {
    savingThrows: ['WIS', 'CHA'],
    skillChoices: { count: 2, from: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'] },
    armor: ['All armor', 'Shields'],
    weapons: ['Simple weapons', 'Martial weapons'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Weapons', options: [['A martial weapon and a shield'], ['Two martial weapons']] },
      { kind: 'choice', label: 'Secondary', options: [['Five javelins'], ['Any simple melee weapon']] },
      { kind: 'choice', label: 'Pack', options: [["Priest's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['Chain mail', 'Holy symbol'] },
    ],
  },
  Ranger: {
    savingThrows: ['STR', 'DEX'],
    skillChoices: { count: 3, from: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'] },
    armor: ['Light armor', 'Medium armor', 'Shields'],
    weapons: ['Simple weapons', 'Martial weapons'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Armor', options: [['Scale mail'], ['Leather armor']] },
      { kind: 'choice', label: 'Melee weapons', options: [['Two shortswords'], ['Two simple melee weapons']] },
      { kind: 'choice', label: 'Pack', options: [["Dungeoneer's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['Longbow', 'Quiver of 20 arrows'] },
    ],
  },
  Rogue: {
    savingThrows: ['DEX', 'INT'],
    skillChoices: { count: 4, from: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'] },
    armor: ['Light armor'],
    weapons: ['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    tools: ["Thieves' tools"],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Rapier'], ['Shortsword']] },
      { kind: 'choice', label: 'Ranged', options: [['Shortbow and quiver of 20 arrows'], ['Shortsword']] },
      { kind: 'choice', label: 'Pack', options: [["Burglar's pack"], ["Dungeoneer's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['Leather armor', 'Two daggers', "Thieves' tools"] },
    ],
  },
  Sorcerer: {
    savingThrows: ['CON', 'CHA'],
    skillChoices: { count: 2, from: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'] },
    armor: [],
    weapons: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Light crossbow and 20 bolts'], ['Any simple weapon']] },
      { kind: 'choice', label: 'Focus', options: [['Component pouch'], ['Arcane focus']] },
      { kind: 'choice', label: 'Pack', options: [["Dungeoneer's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['Two daggers'] },
    ],
  },
  Warlock: {
    savingThrows: ['WIS', 'CHA'],
    skillChoices: { count: 2, from: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'] },
    armor: ['Light armor'],
    weapons: ['Simple weapons'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Light crossbow and 20 bolts'], ['Any simple weapon']] },
      { kind: 'choice', label: 'Focus', options: [['Component pouch'], ['Arcane focus']] },
      { kind: 'choice', label: 'Pack', options: [["Scholar's pack"], ["Dungeoneer's pack"]] },
      { kind: 'fixed', items: ['Leather armor', 'Any simple weapon', 'Two daggers'] },
    ],
  },
  Wizard: {
    savingThrows: ['INT', 'WIS'],
    skillChoices: { count: 2, from: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'] },
    armor: [],
    weapons: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
    tools: [],
    startingEquipment: [
      { kind: 'choice', label: 'Weapon', options: [['Quarterstaff'], ['Dagger']] },
      { kind: 'choice', label: 'Focus', options: [['Component pouch'], ['Arcane focus']] },
      { kind: 'choice', label: 'Pack', options: [["Scholar's pack"], ["Explorer's pack"]] },
      { kind: 'fixed', items: ['Spellbook'] },
    ],
  },
  Artificer: {
    savingThrows: ['CON', 'INT'],
    skillChoices: { count: 2, from: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Sleight of Hand'] },
    armor: ['Light armor', 'Medium armor', 'Shields'],
    weapons: ['Simple weapons'],
    tools: ["Thieves' tools", "Tinker's tools", "One type of artisan's tools"],
    startingEquipment: [
      { kind: 'choice', label: 'Weapons', options: [['Any two simple weapons'], ['Light crossbow and 20 bolts']] },
      { kind: 'choice', label: 'Armor', options: [['Studded leather armor'], ['Scale mail']] },
      { kind: 'fixed', items: ["Thieves' tools", "Dungeoneer's pack"] },
    ],
  },
};
