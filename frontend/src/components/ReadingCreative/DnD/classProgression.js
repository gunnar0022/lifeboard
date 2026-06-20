/**
 * Class & subclass feature progression — single source of truth for the
 * Features tab. Features are derived (not stored): getUnlockedFeatures()
 * returns the merged, level-gated, sorted list for a character.
 *
 * Feature entry shape:
 *   { id, name, level, source, desc, combat?, choice? }
 *     level   — unlock level (gate + badge)
 *     source  — class or subclass name (badge label + color)
 *     combat  — has an interactive tracker on the Combat tab (informational here)
 *     choice  — 'fighting-style' | 'runes' : renders an inline choice control
 *
 * Scope: Fighter (base) + Rune Knight authored to 100%. The other four
 * already-implemented subclasses have their descriptions ported so they
 * populate the Features tab. Remaining base classes are added incrementally.
 */

// ── Fighting Styles (Fighter L1 choice) ────────────────────────────────
export const FIGHTING_STYLES = [
  { name: 'Archery', desc: 'You gain a +2 bonus to attack rolls you make with ranged weapons.' },
  { name: 'Blind Fighting', desc: 'You have blindsight with a range of 10 feet. Within that range you can effectively see anything that isn\'t behind total cover, even if blinded or in darkness, and you can see an invisible creature unless it successfully hides from you.' },
  { name: 'Defense', desc: 'While you are wearing armor, you gain a +1 bonus to AC.' },
  { name: 'Dueling', desc: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.' },
  { name: 'Great Weapon Fighting', desc: 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the two-handed or versatile property.' },
  { name: 'Interception', desc: 'When a creature you can see hits a target, other than you, within 5 feet of you with an attack, you can use your reaction to reduce the damage the target takes by 1d10 + your proficiency bonus (minimum 0). You must be wielding a shield or a simple or martial weapon.' },
  { name: 'Protection', desc: 'When a creature you can see attacks a target other than you within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.' },
  { name: 'Superior Technique', desc: 'You learn one maneuver of your choice from the Battle Master archetype (save DC = 8 + proficiency bonus + STR or DEX modifier). You gain one superiority die (a d6), regained on a short or long rest.' },
  { name: 'Thrown Weapon Fighting', desc: 'You can draw a thrown weapon as part of the attack you make with it. When you hit with a ranged attack using a thrown weapon, you gain a +2 bonus to the damage roll.' },
  { name: 'Two-Weapon Fighting', desc: 'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.' },
  { name: 'Unarmed Fighting', desc: 'Your unarmed strikes can deal 1d6 + STR modifier bludgeoning damage on a hit (d8 if you have no weapons or shield). At the start of each of your turns, you can deal 1d4 bludgeoning damage to one creature grappled by you.' },
  { name: 'Close Quarters Shooter', desc: 'No disadvantage on ranged attacks while within 5 feet of a hostile creature. Your ranged attacks ignore half and three-quarters cover against targets within 30 feet, and you gain a +1 bonus to ranged attack rolls.' },
  { name: 'Mariner', desc: 'As long as you are not wearing heavy armor or using a shield, you have a swimming speed and a climbing speed equal to your normal speed, and you gain a +1 bonus to AC.' },
  { name: 'Tunnel Fighter', desc: 'As a bonus action you enter a defensive stance until the start of your next turn. While in it you can make opportunity attacks without using your reaction, and you can use your reaction to make a melee attack against a creature that moves more than 5 feet while within your reach.' },
];

// ── Rune Knight runes ──────────────────────────────────────────────────
export const RUNE_LIST = [
  {
    name: 'Cloud Rune',
    minLevel: 3,
    passive: 'ADV on Sleight of Hand and Deception checks.',
    invoke: 'Reaction: when you or a creature within 30ft is hit by an attack, choose a different creature within 30ft (other than the attacker) to become the target instead, using the same roll. Works regardless of range.',
  },
  {
    name: 'Fire Rune',
    minLevel: 3,
    passive: 'Proficiency bonus doubled for ability checks using tool proficiency.',
    invoke: 'On weapon hit: extra 2d6 fire damage + target must succeed STR save or be restrained for 1 min (2d6 fire at start of each turn, repeat save at end of turn).',
  },
  {
    name: 'Frost Rune',
    minLevel: 3,
    passive: 'ADV on Animal Handling and Intimidation checks.',
    invoke: 'Bonus action: +2 to all STR and CON ability checks and saving throws for 10 minutes.',
  },
  {
    name: 'Stone Rune',
    minLevel: 3,
    passive: 'ADV on Insight checks. Darkvision 120ft.',
    invoke: 'Reaction: when a creature ends its turn within 30ft, force WIS save. On fail: charmed for 1 min (speed 0, incapacitated, dreamy stupor). Repeat save at end of each turn.',
  },
  {
    name: 'Hill Rune',
    minLevel: 7,
    passive: 'ADV on saves against poison. Resistance to poison damage.',
    invoke: 'Bonus action: resistance to bludgeoning, piercing, and slashing damage for 1 minute.',
  },
  {
    name: 'Storm Rune',
    minLevel: 7,
    passive: 'ADV on Arcana checks. Can\'t be surprised while not incapacitated.',
    invoke: 'Bonus action: prophetic state for 1 min. Use reaction to give ADV or DISADV to any attack roll, save, or ability check made by a creature within 60ft.',
  },
];

// Rune Knight scaling helpers
export function maxRunesKnown(level) {
  if (level >= 15) return 5;
  if (level >= 10) return 4;
  if (level >= 7) return 3;
  return 2; // 3rd level
}
export function maxRuneInvocations(level) {
  return level >= 15 ? 2 : 1; // Master of Runes
}
export function giantsMightDie(level) {
  if (level >= 18) return 'd10'; // Runic Juggernaut
  if (level >= 10) return 'd8';  // Great Stature
  return 'd6';
}
export function giantsMightSize(level) {
  return level >= 18 ? 'Huge' : 'Large';
}

// ── Races ──────────────────────────────────────────────────────────────
export const RACES = ['Dragonborn', 'Dwarf', 'Elf', 'Fairy', 'Genasi', 'Gnome', 'Goliath', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human', 'Tabaxi', 'Tiefling', 'Uma'];

// Dragonborn draconic ancestry → breath weapon damage type, area, save, resistance.
export const DRAGON_ANCESTRY = {
  Black:  { damage: 'Acid', area: '5×30 ft line', save: 'DEX' },
  Blue:   { damage: 'Lightning', area: '5×30 ft line', save: 'DEX' },
  Brass:  { damage: 'Fire', area: '5×30 ft line', save: 'DEX' },
  Bronze: { damage: 'Lightning', area: '5×30 ft line', save: 'DEX' },
  Copper: { damage: 'Acid', area: '5×30 ft line', save: 'DEX' },
  Gold:   { damage: 'Fire', area: '15 ft cone', save: 'DEX' },
  Green:  { damage: 'Poison', area: '15 ft cone', save: 'CON' },
  Red:    { damage: 'Fire', area: '15 ft cone', save: 'DEX' },
  Silver: { damage: 'Cold', area: '15 ft cone', save: 'CON' },
  White:  { damage: 'Cold', area: '15 ft cone', save: 'CON' },
};
export const DRAGON_COLORS = Object.keys(DRAGON_ANCESTRY);

/** Dragonborn breath weapon damage dice by level. */
export function breathWeaponDice(level) {
  if (level >= 16) return '5d6';
  if (level >= 11) return '4d6';
  if (level >= 6) return '3d6';
  return '2d6';
}

// Racial traits. No level gating (granted at character creation). A trait may
// carry combat:true (Combat-tab tracker) or a choice ('language' | 'skill').
export const RACE_PROGRESSION = {
  Dragonborn: {
    traits: [
      { id: 'drb-physiology', name: 'Physiology', source: 'Dragonborn',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'drb-ancestry', name: 'Draconic Ancestry', source: 'Dragonborn', choice: 'dragon',
        desc: 'You are distantly related to a particular kind of dragon. Choose a dragon type; it determines your breath weapon\'s damage type, area, and saving throw, and the damage type you resist.' },
      { id: 'drb-breath', name: 'Breath Weapon', source: 'Dragonborn', combat: true,
        desc: 'As an action, you exhale destructive energy in an area determined by your ancestry. Each creature in the area makes a saving throw (DC = 8 + your Constitution modifier + your proficiency bonus), taking 2d6 damage on a failed save and half as much on a success. The damage increases to 3d6 at 6th level, 4d6 at 11th, and 5d6 at 16th. Once you use it, you can\'t use it again until you finish a short or long rest.' },
      { id: 'drb-resistance', name: 'Damage Resistance', source: 'Dragonborn',
        desc: 'You have resistance to the damage type associated with your draconic ancestry.' },
      { id: 'drb-languages', name: 'Languages', source: 'Dragonborn',
        desc: 'You can speak, read, and write Common and Draconic.' },
    ],
  },
  Dwarf: {
    subraces: ['Hill Dwarf', 'Mountain Dwarf'],
    traits: [
      { id: 'dwa-physiology', name: 'Physiology', source: 'Dwarf',
        desc: 'Medium Humanoid. Walking speed 25 ft, which is not reduced by wearing heavy armor.' },
      { id: 'dwa-darkvision', name: 'Darkvision', source: 'Dwarf',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'dwa-resilience', name: 'Dwarven Resilience', source: 'Dwarf',
        desc: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' },
      { id: 'dwa-combat-training', name: 'Dwarven Combat Training', source: 'Dwarf',
        desc: 'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.' },
      { id: 'dwa-tool-prof', name: 'Tool Proficiency', source: 'Dwarf', choice: 'tool',
        options: ["Smith's Tools", "Brewer's Supplies", "Mason's Tools"],
        desc: 'You gain proficiency with the artisan\'s tools of your choice: smith\'s tools, brewer\'s supplies, or mason\'s tools.' },
      { id: 'dwa-stonecunning', name: 'Stonecunning', source: 'Dwarf',
        desc: 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.' },
      { id: 'dwa-languages', name: 'Languages', source: 'Dwarf',
        desc: 'You can speak, read, and write Common and Dwarvish.' },
    ],
  },
  Elf: {
    subraces: ['Dark Elf', 'High Elf', 'Wood Elf'],
    traits: [
      { id: 'elf-physiology', name: 'Physiology', source: 'Elf',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'elf-darkvision', name: 'Darkvision', source: 'Elf',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'elf-fey-ancestry', name: 'Fey Ancestry', source: 'Elf',
        desc: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { id: 'elf-trance', name: 'Trance', source: 'Elf',
        desc: 'Elves don\'t sleep. Instead they meditate deeply, remaining semiconscious, for 4 hours a day, gaining the same benefit a human does from 8 hours of sleep.' },
      { id: 'elf-keen-senses', name: 'Keen Senses', source: 'Elf',
        desc: 'You have proficiency in the Perception skill.' },
      { id: 'elf-languages', name: 'Languages', source: 'Elf',
        desc: 'You can speak, read, and write Common and Elven.' },
    ],
  },
  Fairy: {
    traits: [
      { id: 'fae-physiology', name: 'Physiology', source: 'Fairy',
        desc: 'Small Fey. Walking speed 30 ft.' },
      { id: 'fae-magic', name: 'Fairy Magic', source: 'Fairy', combat: true, choice: 'spellAbility',
        spells: [{ name: 'Faerie Fire', minLevel: 3 }, { name: 'Enlarge/Reduce', minLevel: 5 }],
        desc: 'You know the Druidcraft cantrip. At 3rd level you can cast Faerie Fire with this trait; at 5th level you can also cast Enlarge/Reduce. Once you cast either with this trait, you can\'t cast that spell with it again until you finish a long rest (you can also cast them using spell slots). Choose Intelligence, Wisdom, or Charisma as your spellcasting ability for these spells.' },
      { id: 'fae-flight', name: 'Flight', source: 'Fairy',
        desc: 'Because of your wings, you have a flying speed equal to your walking speed. You can\'t use this flying speed while wearing medium or heavy armor.' },
      { id: 'fae-languages', name: 'Languages', source: 'Fairy', choice: 'language',
        desc: 'You can speak, read, and write Common and one other language of your choice.' },
    ],
  },
  Genasi: {
    subraces: ['Air Genasi', 'Earth Genasi', 'Fire Genasi', 'Water Genasi'],
    traits: [
      { id: 'gen-physiology', name: 'Physiology', source: 'Genasi',
        desc: 'Medium or Small Humanoid (your choice). Walking speed 35 ft.' },
      { id: 'gen-darkvision', name: 'Darkvision', source: 'Genasi',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.' },
      { id: 'gen-spellcasting', name: 'Elemental Spellcasting', source: 'Genasi', choice: 'spellAbility',
        desc: 'Choose Intelligence, Wisdom, or Charisma as your spellcasting ability for the elemental spells granted by your Genasi variant.' },
      { id: 'gen-languages', name: 'Languages', source: 'Genasi', choice: 'language',
        desc: 'You can speak, read, and write Common and one other language of your choice.' },
    ],
  },
  Human: {
    traits: [
      { id: 'hum-physiology', name: 'Physiology', source: 'Human',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'hum-versatility', name: 'Human Versatility', source: 'Human', choice: 'versatility',
        options: [
          { name: 'Standard', desc: 'Your ability scores each increase by 1.' },
          { name: 'Variant', desc: 'Instead of the standard +1 to all: two different ability scores of your choice increase by 1, you gain proficiency in one skill of your choice, and you gain one feat of your choice.' },
        ],
        desc: 'Choose your human origin: standard or variant.' },
      { id: 'hum-languages', name: 'Languages', source: 'Human', choice: 'language',
        desc: 'You can speak, read, and write Common and one extra language of your choice.' },
    ],
  },
  Tiefling: {
    subraces: [
      'Bloodline of Asmodeus', 'Bloodline of Baalzebul', 'Bloodline of Dispater',
      'Bloodline of Fierna', 'Bloodline of Glasya', 'Bloodline of Levistus',
      'Bloodline of Mammon', 'Bloodline of Mephistopheles', 'Bloodline of Zariel',
    ],
    traits: [
      { id: 'tie-physiology', name: 'Physiology', source: 'Tiefling',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'tie-darkvision', name: 'Darkvision', source: 'Tiefling',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'tie-hellish', name: 'Hellish Resistance', source: 'Tiefling',
        desc: 'You have resistance to fire damage.' },
      { id: 'tie-languages', name: 'Languages', source: 'Tiefling',
        desc: 'You can speak, read, and write Common and Infernal.' },
    ],
  },
  Gnome: {
    subraces: ['Forest Gnome', 'Rock Gnome'],
    traits: [
      { id: 'gno-physiology', name: 'Physiology', source: 'Gnome',
        desc: 'Small Humanoid. Walking speed 25 ft.' },
      { id: 'gno-darkvision', name: 'Darkvision', source: 'Gnome',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'gno-cunning', name: 'Gnome Cunning', source: 'Gnome',
        desc: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.' },
      { id: 'gno-languages', name: 'Languages', source: 'Gnome',
        desc: 'You can speak, read, and write Common and Gnomish.' },
    ],
  },
  'Half-Elf': {
    traits: [
      { id: 'helf-physiology', name: 'Physiology', source: 'Half-Elf',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'helf-darkvision', name: 'Darkvision', source: 'Half-Elf',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'helf-fey-ancestry', name: 'Fey Ancestry', source: 'Half-Elf',
        desc: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { id: 'helf-versatility', name: 'Half-Elf Versatility', source: 'Half-Elf', choice: 'versatility',
        options: [
          { name: 'Skill Versatility', desc: 'You gain proficiency in two skills of your choice.' },
          { name: 'Elf Weapon Training', desc: 'You have proficiency with the longsword, shortsword, shortbow, and longbow.' },
          { name: 'Cantrip', desc: 'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.' },
          { name: 'Fleet of Foot', desc: 'Your base walking speed increases to 35 feet.' },
          { name: 'Mask of the Wild', desc: 'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.' },
          { name: 'Drow Magic', desc: 'You know the Dancing Lights cantrip. At 3rd level you can cast Faerie Fire once per long rest; at 5th level, Darkness once per long rest. Charisma is your spellcasting ability for these spells.' },
          { name: 'Swim Speed', desc: 'You have a swimming speed of 30 feet.' },
        ],
        desc: 'Choose one versatility trait, reflecting your elven heritage.' },
      { id: 'helf-languages', name: 'Languages', source: 'Half-Elf', choice: 'language',
        desc: 'You can speak, read, and write Common, Elven, and one extra language of your choice.' },
    ],
  },
  'Half-Orc': {
    traits: [
      { id: 'horc-physiology', name: 'Physiology', source: 'Half-Orc',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'horc-darkvision', name: 'Darkvision', source: 'Half-Orc',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'horc-menacing', name: 'Menacing', source: 'Half-Orc',
        desc: 'You gain proficiency in the Intimidation skill.' },
      { id: 'horc-relentless', name: 'Relentless Endurance', source: 'Half-Orc', combat: true,
        desc: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can\'t use this feature again until you finish a long rest.' },
      { id: 'horc-savage', name: 'Savage Attacks', source: 'Half-Orc',
        desc: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.' },
      { id: 'horc-languages', name: 'Languages', source: 'Half-Orc',
        desc: 'You can speak, read, and write Common and Orc.' },
    ],
  },
  Halfling: {
    subraces: ['Lightfoot', 'Stout'],
    traits: [
      { id: 'hfl-physiology', name: 'Physiology', source: 'Halfling',
        desc: 'Small Humanoid. Walking speed 25 ft.' },
      { id: 'hfl-lucky', name: 'Lucky', source: 'Halfling',
        desc: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.' },
      { id: 'hfl-brave', name: 'Brave', source: 'Halfling',
        desc: 'You have advantage on saving throws against being frightened.' },
      { id: 'hfl-nimble', name: 'Halfling Nimbleness', source: 'Halfling',
        desc: 'You can move through the space of any creature that is of a size larger than yours.' },
      { id: 'hfl-languages', name: 'Languages', source: 'Halfling',
        desc: 'You can speak, read, and write Common and Halfling.' },
    ],
  },
  Goliath: {
    traits: [
      { id: 'gol-physiology', name: 'Physiology', source: 'Goliath',
        desc: 'Medium Humanoid. Walking speed 30 ft.' },
      { id: 'gol-little-giant', name: 'Little Giant', source: 'Goliath',
        desc: 'You have proficiency in the Athletics skill, and you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.' },
      { id: 'gol-mountain-born', name: 'Mountain Born', source: 'Goliath',
        desc: 'You have resistance to cold damage. You also naturally acclimate to high altitudes, even those above 20,000 feet, even if you\'ve never been to one.' },
      { id: 'gol-stones-endurance', name: "Stone's Endurance", source: 'Goliath', combat: true,
        desc: 'When you take damage, you can use your reaction to roll a d12, add your Constitution modifier, and reduce the damage by that total. You can use this a number of times equal to your proficiency bonus, regaining all expended uses when you finish a long rest.' },
      { id: 'gol-languages', name: 'Languages', source: 'Goliath', choice: 'language',
        desc: 'You can speak, read, and write Common and one other language of your choice (with your DM\'s approval).' },
    ],
  },
  Tabaxi: {
    traits: [
      { id: 'tab-physiology', name: 'Physiology', source: 'Tabaxi',
        desc: 'Medium or Small Humanoid (your choice). Walking speed 30 ft, with a climbing speed equal to your walking speed.' },
      { id: 'tab-claws', name: "Cat's Claws", source: 'Tabaxi',
        desc: 'You can use your claws to make unarmed strikes. On a hit they deal 1d6 + your Strength modifier slashing damage, instead of the normal bludgeoning damage.' },
      { id: 'tab-talent', name: "Cat's Talent", source: 'Tabaxi',
        desc: 'You have proficiency in the Perception and Stealth skills.' },
      { id: 'tab-darkvision', name: 'Darkvision', source: 'Tabaxi',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only).' },
      { id: 'tab-feline-agility', name: 'Feline Agility', source: 'Tabaxi',
        desc: 'When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this trait, you can\'t use it again until you move 0 feet on one of your turns.' },
      { id: 'tab-languages', name: 'Languages', source: 'Tabaxi', choice: 'language',
        desc: 'You can speak, read, and write Common and one other language of your choice (with your DM\'s approval).' },
    ],
  },
  Uma: {
    traits: [
      { id: 'uma-physiology', name: 'Physiology', source: 'Uma',
        desc: 'Medium Humanoid. Walking speed 35 ft.' },
      { id: 'uma-thundering-rush', name: 'Thundering Rush', source: 'Uma',
        desc: 'If you move at least 25 feet straight toward a target, you can make a leaping kick as a bonus action, rolled with expertise. On a hit, deal 1d6 bludgeoning damage; on a miss, you land prone behind the target.' },
      { id: 'uma-equine-build', name: 'Equine Build', source: 'Uma',
        desc: 'You count as one size larger when determining your carrying capacity and the weight you can push or drag.' },
      { id: 'uma-natural-affinity', name: 'Natural Affinity', source: 'Uma', choice: 'skill',
        options: ['Animal Handling', 'Medicine', 'Nature', 'Survival'],
        desc: 'Your fey connection to nature grants you proficiency in one of the following skills of your choice: Animal Handling, Medicine, Nature, or Survival.' },
      { id: 'uma-languages', name: 'Languages', source: 'Uma', choice: 'language',
        desc: 'You can speak, read, and write Common and one other language of your choice (with your DM\'s approval).' },
    ],
  },
};

// Subrace traits (chosen via the subrace selector when a race has subraces).
export const SUBRACE_PROGRESSION = {
  // ── Tiefling bloodlines (each: cantrip + level-gated 3rd/5th once-per-long-rest spells, Charisma) ──
  'Bloodline of Asmodeus': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-asmodeus', name: 'Infernal Legacy', source: 'Bloodline of Asmodeus', combat: true,
        spells: [{ name: 'Hellish Rebuke', minLevel: 3 }, { name: 'Darkness', minLevel: 5 }],
        desc: 'You know the Thaumaturgy cantrip. At 3rd level you can cast Hellish Rebuke once (as a 2nd-level spell); at 5th level you can also cast Darkness once. You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Baalzebul': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-baalzebul', name: 'Legacy of Maladomini', source: 'Bloodline of Baalzebul', combat: true,
        spells: [{ name: 'Ray of Sickness', minLevel: 3 }, { name: 'Crown of Madness', minLevel: 5 }],
        desc: 'You know the Thaumaturgy cantrip. At 3rd level you can cast Ray of Sickness once (as a 2nd-level spell); at 5th level you can also cast Crown of Madness once. You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Dispater': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-dispater', name: 'Legacy of Dis', source: 'Bloodline of Dispater', combat: true,
        spells: [{ name: 'Disguise Self', minLevel: 3 }, { name: 'Detect Thoughts', minLevel: 5 }],
        desc: 'You know the Thaumaturgy cantrip. At 3rd level you can cast Disguise Self once (as a 2nd-level spell); at 5th level you can also cast Detect Thoughts once. You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Fierna': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-fierna', name: 'Legacy of Phlegethos', source: 'Bloodline of Fierna', combat: true,
        spells: [{ name: 'Charm Person', minLevel: 3 }, { name: 'Suggestion', minLevel: 5 }],
        desc: 'You know the Friends cantrip. At 3rd level you can cast Charm Person once (as a 2nd-level spell); at 5th level you can also cast Suggestion once. You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Glasya': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-glasya', name: 'Legacy of Malbolge', source: 'Bloodline of Glasya', combat: true,
        spells: [{ name: 'Disguise Self', minLevel: 3 }, { name: 'Invisibility', minLevel: 5 }],
        desc: 'You know the Minor Illusion cantrip. At 3rd level you can cast Disguise Self once (as a 2nd-level spell); at 5th level you can also cast Invisibility once (as a 2nd-level spell). You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Levistus': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-levistus', name: 'Legacy of Stygia', source: 'Bloodline of Levistus', combat: true,
        spells: [{ name: 'Armor of Agathys', minLevel: 3 }, { name: 'Darkness', minLevel: 5 }],
        desc: 'You know the Ray of Frost cantrip. At 3rd level you can cast Armor of Agathys once (as a 2nd-level spell); at 5th level you can also cast Darkness once. You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Mammon': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-mammon', name: 'Legacy of Minauros', source: 'Bloodline of Mammon', combat: true,
        spells: [{ name: "Tenser's Floating Disk", minLevel: 3 }, { name: 'Arcane Lock', minLevel: 5 }],
        desc: 'You know the Mage Hand cantrip. At 3rd level you can cast Tenser\'s Floating Disk once (as a 2nd-level spell); at 5th level you can also cast Arcane Lock once. You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Mephistopheles': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-mephistopheles', name: 'Legacy of Cania', source: 'Bloodline of Mephistopheles', combat: true,
        spells: [{ name: 'Burning Hands', minLevel: 3 }, { name: 'Flame Blade', minLevel: 5 }],
        desc: 'You know the Mage Hand cantrip. At 3rd level you can cast Burning Hands once (as a 2nd-level spell); at 5th level you can also cast Flame Blade once (as a 3rd-level spell). You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },
  'Bloodline of Zariel': {
    race: 'Tiefling',
    traits: [
      { id: 'tie-zariel', name: 'Legacy of Avernus', source: 'Bloodline of Zariel', combat: true,
        spells: [{ name: 'Searing Smite', minLevel: 3 }, { name: 'Branding Smite', minLevel: 5 }],
        desc: 'You know the Thaumaturgy cantrip. At 3rd level you can cast Searing Smite once (as a 2nd-level spell); at 5th level you can also cast Branding Smite once (as a 3rd-level spell). You regain both with a long rest. Charisma is your spellcasting ability for these spells.' },
    ],
  },

  // ── Genasi variants ──
  'Air Genasi': {
    race: 'Genasi',
    traits: [
      { id: 'gen-air-breath', name: 'Unending Breath', source: 'Air Genasi',
        desc: 'You can hold your breath indefinitely while you aren\'t incapacitated.' },
      { id: 'gen-air-resist', name: 'Lightning Resistance', source: 'Air Genasi',
        desc: 'You have resistance to lightning damage.' },
      { id: 'gen-air-mingle', name: 'Mingle with the Wind', source: 'Air Genasi', combat: true,
        spells: [{ name: 'Feather Fall', minLevel: 3 }, { name: 'Levitate', minLevel: 5 }],
        desc: 'You know the Shocking Grasp cantrip. At 3rd level you can cast Feather Fall with this trait; at 5th level you can also cast Levitate. Once you cast either with this trait, you can\'t cast that spell with it again until you finish a long rest (you can also use spell slots). Uses your chosen elemental spellcasting ability.' },
    ],
  },
  'Earth Genasi': {
    race: 'Genasi',
    traits: [
      { id: 'gen-earth-walk', name: 'Earth Walk', source: 'Earth Genasi',
        desc: 'You can move across difficult terrain made of earth or stone without expending extra movement.' },
      { id: 'gen-earth-merge', name: 'Merge with Stone', source: 'Earth Genasi', combat: true,
        spells: [{ name: 'Blade Ward', minLevel: 1, uses: 'pb' }, { name: 'Pass Without Trace', minLevel: 5 }],
        desc: 'You know the Blade Ward cantrip; you can also cast it as a bonus action a number of times equal to your proficiency bonus, regaining all uses on a long rest. At 5th level you can cast Pass Without Trace once with this trait, regaining it on a long rest (or use a 2nd-level-or-higher slot). Uses your chosen elemental spellcasting ability.' },
    ],
  },
  'Fire Genasi': {
    race: 'Genasi',
    traits: [
      { id: 'gen-fire-resist', name: 'Fire Resistance', source: 'Fire Genasi',
        desc: 'You have resistance to fire damage.' },
      { id: 'gen-fire-blaze', name: 'Reach to the Blaze', source: 'Fire Genasi', combat: true,
        spells: [{ name: 'Burning Hands', minLevel: 3 }, { name: 'Flame Blade', minLevel: 5 }],
        desc: 'You know the Produce Flame cantrip. At 3rd level you can cast Burning Hands with this trait; at 5th level you can also cast Flame Blade. Once you cast either with this trait, you can\'t cast that spell with it again until you finish a long rest (you can also use spell slots). Uses your chosen elemental spellcasting ability.' },
    ],
  },
  'Water Genasi': {
    race: 'Genasi',
    traits: [
      { id: 'gen-water-resist', name: 'Acid Resistance', source: 'Water Genasi',
        desc: 'You have resistance to acid damage.' },
      { id: 'gen-water-amphibious', name: 'Amphibious', source: 'Water Genasi',
        desc: 'You can breathe air and water.' },
      { id: 'gen-water-wave', name: 'Call to the Wave', source: 'Water Genasi', combat: true,
        spells: [{ name: 'Create or Destroy Water', minLevel: 3 }, { name: 'Water Walk', minLevel: 5 }],
        desc: 'You know the Acid Splash cantrip. At 3rd level you can cast Create or Destroy Water with this trait; at 5th level you can also cast Water Walk. Once you cast either with this trait, you can\'t cast that spell with it again until you finish a long rest (you can also use spell slots). Uses your chosen elemental spellcasting ability.' },
    ],
  },

  'Forest Gnome': {
    race: 'Gnome',
    traits: [
      { id: 'gno-forest-illusionist', name: 'Natural Illusionist', source: 'Forest Gnome',
        desc: 'You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it.' },
      { id: 'gno-forest-beasts', name: 'Speak with Small Beasts', source: 'Forest Gnome',
        desc: 'Through sound and gestures, you can communicate simple ideas with Small or smaller beasts.' },
    ],
  },
  'Rock Gnome': {
    race: 'Gnome',
    traits: [
      { id: 'gno-rock-lore', name: "Artificer's Lore", source: 'Rock Gnome',
        desc: 'Whenever you make an Intelligence (History) check related to magical, alchemical, or technological items, you add twice your proficiency bonus instead of any other proficiency bonus that may apply.' },
      { id: 'gno-rock-tinker', name: 'Tinker', source: 'Rock Gnome',
        desc: 'You have proficiency with tinker\'s tools. Using them, you can spend 1 hour and 10 gp of materials to construct a Tiny clockwork device (AC 5, 1 hp) — a Clockwork Toy, Fire Starter, or Music Box. It functions for 24 hours (or until you dismantle it or stop repairing it), and you can have up to three active at a time.' },
    ],
  },
  Lightfoot: {
    race: 'Halfling',
    traits: [
      { id: 'hfl-lightfoot-stealthy', name: 'Naturally Stealthy', source: 'Lightfoot',
        desc: 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.' },
    ],
  },
  Stout: {
    race: 'Halfling',
    traits: [
      { id: 'hfl-stout-resilience', name: 'Stout Resilience', source: 'Stout',
        desc: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' },
    ],
  },
  'Hill Dwarf': {
    race: 'Dwarf',
    traits: [
      { id: 'dwa-hill-toughness', name: 'Dwarven Toughness', source: 'Hill Dwarf',
        desc: 'Your hit point maximum increases by 1, and it increases by 1 again every time you gain a level.' },
    ],
  },
  'Mountain Dwarf': {
    race: 'Dwarf',
    traits: [
      { id: 'dwa-mtn-armor', name: 'Dwarven Armor Training', source: 'Mountain Dwarf',
        desc: 'You have proficiency with light and medium armor.' },
    ],
  },
  'Dark Elf': {
    race: 'Elf',
    traits: [
      { id: 'elf-drow-darkvision', name: 'Superior Darkvision', source: 'Dark Elf',
        desc: 'Your darkvision has a range of 120 feet, instead of 60.' },
      { id: 'elf-drow-sunlight', name: 'Sunlight Sensitivity', source: 'Dark Elf',
        desc: 'You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.' },
      { id: 'elf-drow-magic', name: 'Drow Magic', source: 'Dark Elf',
        desc: 'You know the Dancing Lights cantrip. At 3rd level you can cast Faerie Fire once per long rest; at 5th level you can cast Darkness once per long rest. Charisma is your spellcasting ability for these spells.' },
      { id: 'elf-drow-weapons', name: 'Drow Weapon Training', source: 'Dark Elf',
        desc: 'You have proficiency with rapiers, shortswords, and hand crossbows.' },
    ],
  },
  'High Elf': {
    race: 'Elf',
    traits: [
      { id: 'elf-high-cantrip', name: 'Cantrip', source: 'High Elf', choice: 'cantrip',
        desc: 'You know one cantrip of your choice from the Wizard spell list. Intelligence is your spellcasting ability for it.' },
      { id: 'elf-high-weapons', name: 'Elf Weapon Training', source: 'High Elf',
        desc: 'You have proficiency with the longsword, shortsword, shortbow, and longbow.' },
      { id: 'elf-high-language', name: 'Extra Language', source: 'High Elf', choice: 'language',
        desc: 'You can speak, read, and write one extra language of your choice.' },
    ],
  },
  'Wood Elf': {
    race: 'Elf',
    traits: [
      { id: 'elf-wood-weapons', name: 'Elf Weapon Training', source: 'Wood Elf',
        desc: 'You have proficiency with the longsword, shortsword, shortbow, and longbow.' },
      { id: 'elf-wood-fleet', name: 'Fleet of Foot', source: 'Wood Elf',
        desc: 'Your base walking speed increases to 35 feet.' },
      { id: 'elf-wood-mask', name: 'Mask of the Wild', source: 'Wood Elf',
        desc: 'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.' },
    ],
  },
};

/** Subrace names available for a race (empty if none). */
export function getSubraces(race) {
  return RACE_PROGRESSION[race]?.subraces || [];
}

/** Racial traits for a race + chosen subrace (no level gating). */
export function getRaceFeatures(race, subrace) {
  const base = RACE_PROGRESSION[race]?.traits || [];
  const sub = (subrace && SUBRACE_PROGRESSION[subrace]?.race === race)
    ? SUBRACE_PROGRESSION[subrace].traits
    : [];
  return [...base, ...sub];
}

/**
 * Level-gated racial spells (from race + subrace traits) available at the
 * given level. Each: { name, minLevel, uses? }. uses:'pb' = a proficiency-bonus
 * counter (per long rest); otherwise a single once-per-long-rest cast.
 */
export function getRacialSpells(race, subrace, level) {
  const lvl = level || 1;
  const traits = getRaceFeatures(race, subrace);
  const out = [];
  traits.forEach(t => (t.spells || []).forEach(sp => {
    if ((sp.minLevel || 1) <= lvl) out.push(sp);
  }));
  return out;
}

// ── Base class progression ─────────────────────────────────────────────
export const CLASS_PROGRESSION = {
  Fighter: [
    { id: 'fighter-fighting-style', name: 'Fighting Style', level: 1, source: 'Fighter', choice: 'fighting-style',
      desc: 'You adopt a particular style of fighting as your specialty. Choose one option below; you can\'t take the same option twice.' },
    { id: 'fighter-second-wind', name: 'Second Wind', level: 1, source: 'Fighter', combat: true,
      desc: 'On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.' },
    { id: 'fighter-action-surge', name: 'Action Surge', level: 2, source: 'Fighter', combat: true,
      desc: 'On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again.' },
    { id: 'fighter-asi-4', name: 'Ability Score Improvement', level: 4, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-extra-attack', name: 'Extra Attack', level: 5, source: 'Fighter',
      desc: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'fighter-asi-6', name: 'Ability Score Improvement', level: 6, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-asi-8', name: 'Ability Score Improvement', level: 8, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-indomitable', name: 'Indomitable', level: 9, source: 'Fighter', combat: true,
      desc: 'You can reroll a saving throw that you fail. If you do so, you must use the new roll. You can\'t use this feature again until you finish a long rest.' },
    { id: 'fighter-extra-attack-2', name: 'Extra Attack (2)', level: 11, source: 'Fighter',
      desc: 'The number of attacks from Extra Attack increases to three whenever you take the Attack action on your turn.' },
    { id: 'fighter-asi-12', name: 'Ability Score Improvement', level: 12, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-indomitable-2', name: 'Indomitable (2)', level: 13, source: 'Fighter',
      desc: 'You can use Indomitable twice between long rests.' },
    { id: 'fighter-asi-14', name: 'Ability Score Improvement', level: 14, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-asi-16', name: 'Ability Score Improvement', level: 16, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-action-surge-2', name: 'Action Surge (2)', level: 17, source: 'Fighter',
      desc: 'You can use Action Surge twice before a rest, but only once on the same turn.' },
    { id: 'fighter-indomitable-3', name: 'Indomitable (3)', level: 17, source: 'Fighter',
      desc: 'You can use Indomitable three times between long rests.' },
    { id: 'fighter-asi-19', name: 'Ability Score Improvement', level: 19, source: 'Fighter', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'fighter-extra-attack-3', name: 'Extra Attack (3)', level: 20, source: 'Fighter',
      desc: 'The number of attacks from Extra Attack increases to four whenever you take the Attack action on your turn.' },
  ],

  Rogue: [
    { id: 'rogue-expertise-1', name: 'Expertise', level: 1, source: 'Rogue', choice: 'expertise',
      desc: 'Choose two of your skill proficiencies, or one skill proficiency and your proficiency with thieves\' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.' },
    { id: 'rogue-sneak-attack', name: 'Sneak Attack', level: 1, source: 'Rogue',
      desc: 'Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the attack roll, using a finesse or ranged weapon. You don\'t need advantage if another enemy of the target is within 5 feet of it, that enemy isn\'t incapacitated, and you don\'t have disadvantage on the roll. The extra damage scales from 1d6 (1st) up to 10d6 (20th) — see the Sneak Attack tracker on the Combat tab.' },
    { id: 'rogue-thieves-cant', name: "Thieves' Cant", level: 1, source: 'Rogue',
      desc: 'You know thieves\' cant, a secret mix of dialect, jargon, and code that hides messages in seemingly normal conversation. Only another creature that knows thieves\' cant understands such messages; conveying one takes four times as long as speaking the idea plainly. You also understand a set of secret signs and symbols used to convey short, simple messages.' },
    { id: 'rogue-cunning-action', name: 'Cunning Action', level: 2, source: 'Rogue', combat: true,
      desc: 'Your quick thinking and agility let you take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action.' },
    { id: 'rogue-steady-aim', name: 'Steady Aim (Optional)', level: 3, source: 'Rogue', combat: true,
      desc: 'As a bonus action, you give yourself advantage on your next attack roll on the current turn. You can use this only if you haven\'t moved during this turn, and after you use it your speed is 0 until the end of the current turn.' },
    { id: 'rogue-asi-4', name: 'Ability Score Improvement', level: 4, source: 'Rogue', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'rogue-uncanny-dodge', name: 'Uncanny Dodge', level: 5, source: 'Rogue', combat: true,
      desc: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage against you.' },
    { id: 'rogue-expertise-6', name: 'Expertise', level: 6, source: 'Rogue', choice: 'expertise',
      desc: 'Choose two more of your proficiencies (in skills or with thieves\' tools) to gain the Expertise benefit (proficiency bonus doubled for those ability checks).' },
    { id: 'rogue-evasion', name: 'Evasion', level: 7, source: 'Rogue',
      desc: 'When you are subjected to an effect that allows a Dexterity saving throw for half damage, you instead take no damage on a success and only half damage on a failure.' },
    { id: 'rogue-asi-8', name: 'Ability Score Improvement', level: 8, source: 'Rogue', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'rogue-asi-10', name: 'Ability Score Improvement', level: 10, source: 'Rogue', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'rogue-reliable-talent', name: 'Reliable Talent', level: 11, source: 'Rogue',
      desc: 'Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.' },
    { id: 'rogue-asi-12', name: 'Ability Score Improvement', level: 12, source: 'Rogue', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'rogue-blindsense', name: 'Blindsense', level: 14, source: 'Rogue',
      desc: 'If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.' },
    { id: 'rogue-slippery-mind', name: 'Slippery Mind', level: 15, source: 'Rogue',
      desc: 'You gain proficiency in Wisdom saving throws.' },
    { id: 'rogue-asi-16', name: 'Ability Score Improvement', level: 16, source: 'Rogue', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'rogue-elusive', name: 'Elusive', level: 18, source: 'Rogue',
      desc: 'No attack roll has advantage against you while you aren\'t incapacitated.' },
    { id: 'rogue-asi-19', name: 'Ability Score Improvement', level: 19, source: 'Rogue', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'rogue-stroke-of-luck', name: 'Stroke of Luck', level: 20, source: 'Rogue',
      desc: 'If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once you use this feature, you can\'t use it again until you finish a short or long rest.' },
  ],

  Barbarian: [
    { id: 'barb-rage', name: 'Rage', level: 1, source: 'Barbarian', combat: true,
      desc: 'On your turn, you can enter a rage as a bonus action (if you aren\'t wearing heavy armor): advantage on Strength checks and Strength saving throws; a bonus to melee damage with Strength weapons that scales with level; and resistance to bludgeoning, piercing, and slashing damage. You can\'t cast or concentrate on spells while raging. Rage lasts 1 minute, ending early if you fall unconscious or if your turn ends and you haven\'t attacked a hostile creature or taken damage since your last turn. You can rage a number of times per long rest based on your level.' },
    { id: 'barb-unarmored', name: 'Unarmored Defense', level: 1, source: 'Barbarian',
      desc: 'While you are not wearing any armor, your armor class equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.' },
    { id: 'barb-danger-sense', name: 'Danger Sense', level: 2, source: 'Barbarian',
      desc: 'You have advantage on Dexterity saving throws against effects that you can see, such as traps and spells. You can\'t use this benefit while blinded, deafened, or incapacitated.' },
    { id: 'barb-reckless', name: 'Reckless Attack', level: 2, source: 'Barbarian',
      desc: 'When you make your first attack on your turn, you can attack recklessly: you gain advantage on melee Strength attack rolls this turn, but attack rolls against you have advantage until your next turn.' },
    { id: 'barb-primal-knowledge-3', name: 'Primal Knowledge (Optional)', level: 3, source: 'Barbarian',
      desc: 'Gain proficiency in one skill of your choice from the barbarian list: Animal Handling, Athletics, Intimidation, Nature, Perception, or Survival. (You gain this again at 10th level.)' },
    { id: 'barb-asi-4', name: 'Ability Score Improvement', level: 4, source: 'Barbarian', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'barb-extra-attack', name: 'Extra Attack', level: 5, source: 'Barbarian',
      desc: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'barb-fast-movement', name: 'Fast Movement', level: 5, source: 'Barbarian',
      desc: 'Your speed increases by 10 feet while you aren\'t wearing heavy armor.' },
    { id: 'barb-feral-instinct', name: 'Feral Instinct', level: 7, source: 'Barbarian',
      desc: 'You have advantage on initiative rolls. If you are surprised at the start of combat and aren\'t incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else on that turn.' },
    { id: 'barb-instinctive-pounce', name: 'Instinctive Pounce (Optional)', level: 7, source: 'Barbarian',
      desc: 'As part of the bonus action you take to enter your rage, you can move up to half your speed.' },
    { id: 'barb-asi-8', name: 'Ability Score Improvement', level: 8, source: 'Barbarian', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'barb-brutal-crit', name: 'Brutal Critical', level: 9, source: 'Barbarian',
      desc: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.' },
    { id: 'barb-primal-knowledge-10', name: 'Primal Knowledge (Optional)', level: 10, source: 'Barbarian',
      desc: 'Gain proficiency in another skill of your choice from the barbarian list: Animal Handling, Athletics, Intimidation, Nature, Perception, or Survival.' },
    { id: 'barb-relentless-rage', name: 'Relentless Rage', level: 11, source: 'Barbarian',
      desc: 'If you drop to 0 hit points while raging and don\'t die outright, you can make a DC 10 Constitution saving throw; on a success you drop to 1 hit point instead. The DC increases by 5 each time you use it after the first, resetting to 10 when you finish a short or long rest.' },
    { id: 'barb-asi-12', name: 'Ability Score Improvement', level: 12, source: 'Barbarian', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'barb-brutal-crit-2', name: 'Brutal Critical (2)', level: 13, source: 'Barbarian',
      desc: 'Brutal Critical improves: you can roll two additional weapon damage dice for a critical hit with a melee attack.' },
    { id: 'barb-persistent-rage', name: 'Persistent Rage', level: 15, source: 'Barbarian',
      desc: 'Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it.' },
    { id: 'barb-asi-16', name: 'Ability Score Improvement', level: 16, source: 'Barbarian', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'barb-brutal-crit-3', name: 'Brutal Critical (3)', level: 17, source: 'Barbarian',
      desc: 'Brutal Critical improves: you can roll three additional weapon damage dice for a critical hit with a melee attack.' },
    { id: 'barb-indomitable-might', name: 'Indomitable Might', level: 18, source: 'Barbarian',
      desc: 'If your total for a Strength check is less than your Strength score, you can use that score in place of the total.' },
    { id: 'barb-asi-19', name: 'Ability Score Improvement', level: 19, source: 'Barbarian', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'barb-primal-champion', name: 'Primal Champion', level: 20, source: 'Barbarian',
      desc: 'You embody the power of the wilds: your Strength and Constitution scores increase by 4, and your maximum for those scores becomes 24.' },
  ],

  Druid: [
    { id: 'dru-druidic', name: 'Druidic', level: 1, source: 'Druid',
      desc: 'You know Druidic, the secret language of druids. You can speak it and leave hidden messages; those who know it spot such messages automatically, others need a DC 15 Wisdom (Perception) check and magic to decipher.' },
    { id: 'dru-spellcasting', name: 'Spellcasting', level: 1, source: 'Druid',
      desc: 'You cast druid spells using Wisdom (save DC = 8 + proficiency bonus + WIS modifier; attack = proficiency bonus + WIS modifier). You prepare WIS modifier + druid level spells from the druid list after a long rest, and can cast a prepared spell with the ritual tag as a ritual. Manage cantrips, prepared spells, and slots on the Spells tab.' },
    { id: 'dru-wild-shape', name: 'Wild Shape', level: 2, source: 'Druid', combat: true,
      desc: 'Action: transform into a beast you have seen (CR by level — 1/4 at 2nd, 1/2 at 4th, 1 at 8th; movement limits ease as you level). Twice per short or long rest. Lasts hours equal to half your druid level; revert as a bonus action or when you drop to 0 HP. Track it on the Combat tab.' },
    { id: 'dru-wild-companion', name: 'Wild Companion (Optional)', level: 2, source: 'Druid',
      desc: 'Action: expend a use of Wild Shape to cast Find Familiar without material components. The familiar is a fey and lasts hours equal to half your druid level.' },
    { id: 'dru-asi-4', name: 'Ability Score Improvement', level: 4, source: 'Druid', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one druid cantrip you know with another.' },
    { id: 'dru-asi-8', name: 'Ability Score Improvement', level: 8, source: 'Druid', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one druid cantrip you know with another.' },
    { id: 'dru-asi-12', name: 'Ability Score Improvement', level: 12, source: 'Druid', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one druid cantrip you know with another.' },
    { id: 'dru-asi-16', name: 'Ability Score Improvement', level: 16, source: 'Druid', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one druid cantrip you know with another.' },
    { id: 'dru-timeless-body', name: 'Timeless Body', level: 18, source: 'Druid',
      desc: 'Primal magic slows your aging: for every 10 years that pass, your body ages only 1 year.' },
    { id: 'dru-beast-spells', name: 'Beast Spells', level: 18, source: 'Druid',
      desc: 'You can cast druid spells while in a Wild Shape form, performing somatic and verbal components, though you can\'t provide material components.' },
    { id: 'dru-archdruid', name: 'Archdruid', level: 20, source: 'Druid',
      desc: 'You can use Wild Shape an unlimited number of times. You also ignore the verbal and somatic components of your druid spells, and any material components without a cost, in both your normal and beast shapes.' },
    { id: 'dru-asi-19', name: 'Ability Score Improvement', level: 19, source: 'Druid', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one druid cantrip you know with another.' },
  ],

  Wizard: [
    { id: 'wiz-spellcasting', name: 'Spellcasting', level: 1, source: 'Wizard',
      desc: 'You cast wizard spells using Intelligence (spell save DC = 8 + proficiency bonus + INT modifier; attack = proficiency bonus + INT modifier). Manage your spellbook, prepared spells, slots, and casting on the Spells tab. You prepare INT modifier + wizard level spells from your spellbook after a long rest, and can cast any spell you know with the ritual tag as a ritual without preparing it.' },
    { id: 'wiz-arcane-recovery', name: 'Arcane Recovery', level: 1, source: 'Wizard', combat: true,
      desc: 'Once per day when you finish a short rest, recover expended spell slots with a combined level up to half your wizard level (rounded up); none can be 6th level or higher. Track it on the Combat tab; recover the actual slots on the Spells tab.' },
    { id: 'wiz-arcane-tradition', name: 'Arcane Tradition', level: 2, source: 'Wizard',
      desc: 'You choose an Arcane Tradition (subclass), shaping your practice of magic. Set it in the sheet header; its features appear in the Subclass column and on the Combat tab.' },
    { id: 'wiz-cantrip-formulas', name: 'Cantrip Formulas (Optional)', level: 3, source: 'Wizard',
      desc: 'After a long rest, you can replace one wizard cantrip you know with another from the wizard spell list.' },
    { id: 'wiz-asi-4', name: 'Ability Score Improvement', level: 4, source: 'Wizard', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'wiz-asi-8', name: 'Ability Score Improvement', level: 8, source: 'Wizard', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'wiz-asi-12', name: 'Ability Score Improvement', level: 12, source: 'Wizard', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'wiz-asi-16', name: 'Ability Score Improvement', level: 16, source: 'Wizard', choice: 'asi',
      desc: 'Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead.' },
    { id: 'wiz-spell-mastery', name: 'Spell Mastery', level: 18, source: 'Wizard',
      desc: 'Choose a 1st-level and a 2nd-level wizard spell in your spellbook. While prepared, you can cast them at their lowest level without expending a slot. Add them as Granted Spells (at-will) on the Spells tab to track.' },
    { id: 'wiz-signature-spells', name: 'Signature Spells', level: 20, source: 'Wizard',
      desc: 'Choose two 3rd-level wizard spells as signature spells. They are always prepared, don\'t count against your prepared limit, and you can cast each once at 3rd level without a slot, regaining that use on a short or long rest. Pin them as Always Prepared and add a Granted use on the Spells tab.' },
  ],

  Warlock: [
    { id: 'wl-patron', name: 'Otherworldly Patron', level: 1, source: 'Warlock',
      desc: 'You strike a bargain with an otherworldly being (your subclass). Set it in the sheet header; its features appear in the Subclass column and on the Combat tab.' },
    { id: 'wl-pact-magic', name: 'Pact Magic', level: 1, source: 'Warlock',
      desc: 'You cast warlock spells using Charisma. All of your pact slots are the same level and you regain them on a short or long rest. Manage cantrips, known spells, and pact slots on the Spells tab.' },
    { id: 'wl-invocations', name: 'Eldritch Invocations', level: 2, source: 'Warlock', choice: 'invocations',
      desc: 'You learn fragments of forbidden knowledge that grant an array of magical abilities. You know a number of invocations that grows with your level; you can replace one when you gain a warlock level.' },
    { id: 'wl-pact-boon', name: 'Pact Boon', level: 3, source: 'Warlock', choice: 'pact-boon',
      desc: 'Your patron bestows a gift for your service. Choose one Pact Boon below.' },
    { id: 'wl-asi-4', name: 'Ability Score Improvement', level: 4, source: 'Warlock', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or (12th+) a Mystic Arcanum spell.' },
    { id: 'wl-asi-8', name: 'Ability Score Improvement', level: 8, source: 'Warlock', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or (12th+) a Mystic Arcanum spell.' },
    { id: 'wl-asi-12', name: 'Ability Score Improvement', level: 12, source: 'Warlock', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or a Mystic Arcanum spell.' },
    { id: 'wl-asi-16', name: 'Ability Score Improvement', level: 16, source: 'Warlock', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or a Mystic Arcanum spell.' },
    { id: 'wl-asi-19', name: 'Ability Score Improvement', level: 19, source: 'Warlock', choice: 'asi',
      desc: 'Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or a Mystic Arcanum spell.' },
    { id: 'wl-mystic-arcanum', name: 'Mystic Arcanum', level: 11, source: 'Warlock',
      desc: 'Your patron grants higher-level secrets: a 6th-level spell at 11th, 7th at 13th, 8th at 15th, and 9th at 17th. You can cast each once without a slot, regaining all uses on a long rest. Add each as a Granted Spell (once / long rest) on the Spells tab.' },
    { id: 'wl-eldritch-master', name: 'Eldritch Master', level: 20, source: 'Warlock',
      desc: 'Spend 1 minute entreating your patron to regain all expended Pact Magic slots. Once you do, you must finish a long rest before using it again.' },
  ],
};

/** Cantrips known by druid level (display-only cap). */
export function druidCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}

// ── Warlock scaling helpers ────────────────────────────────────────────
/** Cantrips known by warlock level (display-only cap). */
export function warlockCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}
/** Eldritch Invocations known by warlock level. */
export function invocationsKnown(level) {
  const l = level || 1;
  if (l >= 18) return 8;
  if (l >= 15) return 7;
  if (l >= 12) return 6;
  if (l >= 9) return 5;
  if (l >= 7) return 4;
  if (l >= 5) return 3;
  if (l >= 2) return 2;
  return 0;
}
/** Mystic Arcanum spell levels unlocked by warlock level. */
export function mysticArcanumLevels(level) {
  return [{ lvl: 6, at: 11 }, { lvl: 7, at: 13 }, { lvl: 8, at: 15 }, { lvl: 9, at: 17 }]
    .filter(a => (level || 1) >= a.at)
    .map(a => a.lvl);
}

// ── Warlock Pact Boons (Pact Boon choice) ──────────────────────────────
export const PACT_BOONS = [
  { name: 'Pact of the Blade', desc: 'Action: create a magical pact weapon in your empty hand (choose its form each time); you are proficient with it. It counts as magical, and you can bond a magic weapon to it via a 1-hour ritual.' },
  { name: 'Pact of the Chain', desc: 'You learn find familiar and can cast it as a ritual; it can take special forms (imp, pseudodragon, quasit, sprite). When you take the Attack action you can forgo an attack to let your familiar attack with its reaction.' },
  { name: 'Pact of the Tome', desc: 'You gain a Book of Shadows holding three cantrips from any class’s list, castable at will and not counting against cantrips known.' },
  { name: 'Pact of the Talisman', desc: 'You gain a talisman: when the wearer fails an ability check, they can add a d4. Usable a number of times equal to your proficiency bonus, restored on a long rest.' },
  { name: 'Pact of the Star Chain (UA)', desc: 'Prerequisite: Seeker patron. You know augury and can cast it as a ritual. You can also gain advantage on an Intelligence check once per short or long rest.' },
];

// ── Wizard scaling helpers ─────────────────────────────────────────────
/** Combined slot-levels recoverable with Arcane Recovery (half level, round up). */
export function arcaneRecoveryMax(level) {
  return Math.max(1, Math.ceil((level || 1) / 2));
}
/** Cantrips known by wizard level (display-only cap). */
export function wizardCantripsKnown(level) {
  if (level >= 10) return 5;
  if (level >= 4) return 4;
  return 3;
}
/** Power Surge bonus force damage (War Magic). */
export function powerSurgeDamage(level) {
  return Math.floor((level || 1) / 2);
}
/** Spirit-Shield-style scaling not needed here; War Magic uses half level for Deflecting Shroud too. */

// ── Subclass progression ───────────────────────────────────────────────
export const SUBCLASS_PROGRESSION = {
  'Rune Knight': {
    className: 'Fighter',
    features: [
      { id: 'rk-bonus-prof', name: 'Bonus Proficiencies', level: 3, source: 'Rune Knight',
        desc: 'You gain proficiency with smith\'s tools, and you learn to speak, read, and write Giant.' },
      { id: 'rk-rune-carver', name: 'Rune Carver', level: 3, source: 'Rune Knight', choice: 'runes', combat: true,
        desc: 'You can use magic runes to enhance your gear. You learn runes of your choice and learn more at higher levels (2 at 3rd, 3 at 7th, 4 at 10th, 5 at 15th). After a long rest, you can inscribe a different rune onto a number of objects equal to the runes you know; each object can bear only one rune at a time. Rune Magic save DC = 8 + proficiency bonus + your Constitution modifier.' },
      { id: 'rk-giants-might', name: "Giant's Might", level: 3, source: 'Rune Knight', combat: true,
        desc: 'As a bonus action, for 1 minute: you become Large (if smaller and you have room); you have advantage on Strength checks and Strength saving throws; and once on each of your turns one of your attacks deals an extra 1d6 damage. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
      { id: 'rk-runic-shield', name: 'Runic Shield', level: 7, source: 'Rune Knight', combat: true,
        desc: 'When another creature you can see within 60 feet of you is hit by an attack roll, you can use your reaction to force the attacker to reroll the d20 and use the new roll. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
      { id: 'rk-great-stature', name: 'Great Stature', level: 10, source: 'Rune Knight',
        desc: 'The magic of your runes permanently alters you: roll 3d4 and grow that many inches in height. Moreover, the extra damage of your Giant\'s Might increases to 1d8.' },
      { id: 'rk-master-of-runes', name: 'Master of Runes', level: 15, source: 'Rune Knight',
        desc: 'You can invoke each rune you know from your Rune Carver feature twice rather than once, and you regain all expended uses when you finish a short or long rest.' },
      { id: 'rk-runic-juggernaut', name: 'Runic Juggernaut', level: 18, source: 'Rune Knight',
        desc: 'The extra damage of your Giant\'s Might increases to 1d10. When you use that feature, your size can increase to Huge, and while that size your reach increases by 5 feet.' },
    ],
  },

  'Path of the Ancestral Guardian': {
    className: 'Barbarian',
    features: [
      { id: 'ag-protectors', name: 'Ancestral Protectors', level: 3, source: 'Path of the Ancestral Guardian',
        desc: 'While raging, the first creature you hit on your turn is marked by ancestral spirits until the start of your next turn. The marked target has disadvantage on any attack roll that isn\'t against you, and when it hits a creature other than you, that creature has resistance to the damage.' },
      { id: 'ag-spirit-shield', name: 'Spirit Shield', level: 6, source: 'Path of the Ancestral Guardian', combat: true,
        desc: 'While raging, if a creature you can see within 30 feet of you takes damage, you can use your reaction to reduce that damage by 2d6 (3d6 at 10th level, 4d6 at 14th level).' },
      { id: 'ag-consult', name: 'Consult the Spirits', level: 10, source: 'Path of the Ancestral Guardian', combat: true,
        desc: 'You can cast Augury or Clairvoyance without a spell slot or material components, using Wisdom as your spellcasting ability. Once you do so, you can\'t use this feature again until you finish a short or long rest.' },
      { id: 'ag-vengeful', name: 'Vengeful Ancestors', level: 14, source: 'Path of the Ancestral Guardian',
        desc: 'When you use Spirit Shield to reduce damage, the attacker takes force damage equal to the amount of damage prevented.' },
    ],
  },

  'Assassin': {
    className: 'Rogue',
    features: [
      { id: 'as-bonus-prof', name: 'Bonus Proficiencies', level: 3, source: 'Assassin',
        desc: 'You gain proficiency with the disguise kit and the poisoner\'s kit.' },
      { id: 'as-assassinate', name: 'Assassinate', level: 3, source: 'Assassin',
        desc: 'You have advantage on attack rolls against any creature that hasn\'t taken a turn in the combat yet. In addition, any hit you score against a creature that is surprised is a critical hit.' },
      { id: 'as-infiltration', name: 'Infiltration Expertise', level: 9, source: 'Assassin',
        desc: 'You can unfailingly create false identities for yourself. You must spend seven days and 25 gp to establish the history, profession, and affiliations for an identity. You can\'t establish an identity that belongs to someone else. Thereafter, if you adopt the new identity as a disguise, other creatures believe you to be that person until given an obvious reason not to.' },
      { id: 'as-impostor', name: 'Impostor', level: 13, source: 'Assassin',
        desc: 'You can unerringly mimic another person\'s speech, writing, and behavior. You must spend at least three hours studying these three components — listening to speech, examining handwriting, and observing mannerisms. Your ruse is indiscernible to the casual observer; if a wary creature suspects something is amiss, you have advantage on any Charisma (Deception) check you make to avoid detection.' },
      { id: 'as-death-strike', name: 'Death Strike', level: 17, source: 'Assassin',
        desc: 'When you attack and hit a creature that is surprised, it must make a Constitution saving throw (DC = 8 + your Dexterity modifier + your proficiency bonus). On a failed save, double the damage of your attack against the creature.' },
    ],
  },

  'Circle of Stars': {
    className: 'Druid',
    features: [
      { id: 'cs-star-map', name: 'Star Map', level: 2, source: 'Circle of Stars',
        desc: 'You craft a star map. You know the Guidance cantrip, and you always have Guiding Bolt prepared. You can cast Guiding Bolt without a spell slot a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
      { id: 'cs-starry-form', name: 'Starry Form', level: 2, source: 'Circle of Stars', combat: true,
        desc: 'As a bonus action, expend a use of Wild Shape to take a starry form (shedding light, 10 min). Choose a constellation each time: Archer (bonus-action ranged attack, 1d8 + WIS radiant), Chalice (healing spells restore extra 1d8 + WIS), or Dragon (treat rolls of 9 or lower as 10 on INT/WIS checks and concentration saves).' },
      { id: 'cs-cosmic-omen', name: 'Cosmic Omen', level: 6, source: 'Circle of Stars', combat: true,
        desc: 'After a long rest, roll a die to determine Weal (even) or Woe (odd). When a creature you can see within 30 feet makes an attack roll, save, or ability check, you can use your reaction to add (Weal) or subtract (Woe) 1d6. Usable a number of times equal to your proficiency bonus per long rest.' },
      { id: 'cs-twinkling', name: 'Twinkling Constellations', level: 10, source: 'Circle of Stars',
        desc: 'The 1d8 of Archer and Chalice becomes 2d8, and the Dragon grants a 20-foot flying speed (hover) while in starry form. You can change your constellation at the start of each of your turns.' },
      { id: 'cs-full-of-stars', name: 'Full of Stars', level: 14, source: 'Circle of Stars',
        desc: 'While in your starry form, you have resistance to bludgeoning, piercing, and slashing damage.' },
    ],
  },

  'Circle of Spores': {
    className: 'Druid',
    features: [
      { id: 'csp-halo', name: 'Halo of Spores', level: 2, source: 'Circle of Spores', combat: true,
        desc: 'Reaction: when a creature moves within 10 feet of you or starts its turn there, deal 1d4 necrotic damage (Constitution save negates). The die increases to 1d6 at 6th, 1d8 at 10th, and 1d10 at 14th level.' },
      { id: 'csp-bonus-cantrip', name: 'Bonus Cantrip', level: 2, source: 'Circle of Spores',
        desc: 'You learn the Chill Touch cantrip (necrotic, ranged spell attack, 120 ft).' },
      { id: 'csp-symbiotic', name: 'Symbiotic Entity', level: 2, source: 'Circle of Spores', combat: true,
        desc: 'As an action, expend a use of Wild Shape to gain 4 temporary hit points per druid level (10 min, or until temp HP gone). While active, your Halo of Spores damage dice are doubled, and your melee weapon hits deal an extra 1d6 necrotic damage.' },
      { id: 'csp-circle-spells', name: 'Circle Spells', level: 3, source: 'Circle of Spores',
        desc: 'You always have certain spells prepared (they don\'t count against your prepared limit): 3rd — Blindness/Deafness, Gentle Repose; 5th — Animate Dead, Gaseous Form; 7th — Blight, Confusion; 9th — Cloudkill, Contagion.' },
      { id: 'csp-fungal-infestation', name: 'Fungal Infestation', level: 6, source: 'Circle of Spores', combat: true,
        desc: 'Reaction: when a Small or Medium beast or humanoid dies within 10 feet of you, animate it as a 1-HP zombie for 1 hour (it acts on your turn). Usable a number of times equal to your Wisdom modifier (min 1) per long rest.' },
      { id: 'csp-spreading-spores', name: 'Spreading Spores', level: 10, source: 'Circle of Spores', combat: true,
        desc: 'While Symbiotic Entity is active, you can use a bonus action to hurl spores up to 30 feet into a 10-foot cube for 1 minute, dealing your Halo damage to creatures that enter or start their turn there. While active, you can\'t use your Halo of Spores reaction.' },
      { id: 'csp-fungal-body', name: 'Fungal Body', level: 14, source: 'Circle of Spores',
        desc: 'You are immune to being blinded, deafened, frightened, and poisoned. Critical hits against you count as normal hits, unless you are incapacitated.' },
    ],
  },

  'War Magic': {
    className: 'Wizard',
    features: [
      { id: 'wm-arcane-deflection', name: 'Arcane Deflection', level: 2, source: 'War Magic', combat: true,
        desc: 'Reaction when hit by an attack or you fail a save: gain +2 AC against that attack, or +4 to that save. Until the end of your next turn you can then cast only cantrips. At 14th level, this also arcs force damage (see Deflecting Shroud).' },
      { id: 'wm-tactical-wit', name: 'Tactical Wit', level: 2, source: 'War Magic', combat: true,
        desc: 'Add your Intelligence modifier to your initiative rolls.' },
      { id: 'wm-power-surge', name: 'Power Surge', level: 6, source: 'War Magic', combat: true,
        desc: 'Store power surges up to your Intelligence modifier (min 1). Resets to one on a long rest; gain one when you end a spell with Dispel Magic or Counterspell, and one if you end a short rest with none. Once per turn when you deal damage with a wizard spell, spend a surge to deal extra force damage equal to half your wizard level.' },
      { id: 'wm-durable-magic', name: 'Durable Magic', level: 10, source: 'War Magic', combat: true,
        desc: 'While you maintain concentration on a spell, you have a +2 bonus to AC and all saving throws.' },
      { id: 'wm-deflecting-shroud', name: 'Deflecting Shroud', level: 14, source: 'War Magic', combat: true,
        desc: 'When you use Arcane Deflection, magical energy arcs to up to three creatures of your choice within 60 feet, each taking force damage equal to half your wizard level.' },
    ],
  },

  'The Archfey': {
    className: 'Warlock',
    features: [
      { id: 'af-fey-presence', name: 'Fey Presence', level: 1, source: 'The Archfey', combat: true,
        desc: 'Action: each creature in a 10-foot cube from you makes a Wisdom save (your warlock save DC) or is charmed or frightened (your choice) until the end of your next turn. Once per short or long rest.' },
      { id: 'af-misty-escape', name: 'Misty Escape', level: 6, source: 'The Archfey', combat: true,
        desc: 'Reaction when you take damage: turn invisible and teleport up to 60 feet to a space you can see. Invisible until the start of your next turn or until you attack or cast a spell. Once per short or long rest.' },
      { id: 'af-beguiling-defenses', name: 'Beguiling Defenses', level: 10, source: 'The Archfey',
        desc: 'You are immune to being charmed. When a creature tries to charm you, you can use your reaction to force a Wisdom save or charm it for 1 minute (ending if it takes damage).' },
      { id: 'af-dark-delirium', name: 'Dark Delirium', level: 14, source: 'The Archfey', combat: true,
        desc: 'Action: a creature within 60 feet makes a Wisdom save or is charmed or frightened by you for 1 minute (as if you concentrate), trapped in an illusory realm; ends early if it takes damage. Once per short or long rest.' },
    ],
  },
};

/**
 * Merged, level-gated, sorted feature list for a character.
 * Returns base-class features + subclass features with level <= current level,
 * sorted by unlock level (stable within a level).
 */
export function getUnlockedFeatures(className, subclass, level) {
  return [...getClassFeatures(className, level), ...getSubclassFeatures(subclass, level)]
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}

/** Base-class features unlocked at the given level (sorted). */
export function getClassFeatures(className, level) {
  const lvl = level || 1;
  return (CLASS_PROGRESSION[className] || [])
    .filter(f => (f.level || 1) <= lvl)
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}

/** Subclass features unlocked at the given level (sorted). */
export function getSubclassFeatures(subclass, level) {
  const lvl = level || 1;
  return (SUBCLASS_PROGRESSION[subclass]?.features || [])
    .filter(f => (f.level || 1) <= lvl)
    .sort((a, b) => (a.level || 1) - (b.level || 1));
}
