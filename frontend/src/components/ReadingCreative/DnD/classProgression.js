import { CLASS_PROGRESSION } from './rules/data/classes';
import { SUBCLASS_PROGRESSION } from './rules/data/subclasses';
import {
  RACE_PROGRESSION, SUBRACE_PROGRESSION,
  getSubraces, getRaceFeatures, getRacialSpells,
} from './rules/data/races';
export { CLASS_PROGRESSION, SUBCLASS_PROGRESSION };
export { RACE_PROGRESSION, SUBRACE_PROGRESSION, getSubraces, getRaceFeatures, getRacialSpells };

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

// ── Base class progression ─────────────────────────────────────────────

/** Cantrips known by druid level (display-only cap). */
export function druidCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}

// ── Bard helpers ───────────────────────────────────────────────────────
/** Bardic Inspiration die by bard level. */
export function bardicInspirationDie(level) {
  if (level >= 15) return 'd12';
  if (level >= 10) return 'd10';
  if (level >= 5) return 'd8';
  return 'd6';
}
/** Song of Rest die by bard level. */
export function songOfRestDie(level) {
  if (level >= 17) return 'd12';
  if (level >= 13) return 'd10';
  if (level >= 9) return 'd8';
  return 'd6';
}
/** Cantrips known by bard level (display-only cap). */
export function bardCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}
/** Spells known by bard level (display-only cap). */
export function bardSpellsKnown(level) {
  const table = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
  return table[Math.max(1, Math.min(20, level || 1)) - 1];
}

// ── Cleric helpers ─────────────────────────────────────────────────────
/** Cantrips known by cleric level (display-only cap). */
export function clericCantripsKnown(level) {
  if (level >= 10) return 5;
  if (level >= 4) return 4;
  return 3;
}
/** Channel Divinity uses per short/long rest by cleric level. */
export function channelDivinityUses(level) {
  if (level >= 18) return 3;
  if (level >= 6) return 2;
  return 1;
}
/** Harness Divine Power uses per long rest by cleric level. */
export function harnessDivinePowerUses(level) {
  if (level >= 18) return 3;
  if (level >= 6) return 2;
  return 1;
}
/** Destroy Undead CR threshold by cleric level (null below 5th). */
export function destroyUndeadCR(level) {
  if (level >= 17) return '4';
  if (level >= 14) return '3';
  if (level >= 11) return '2';
  if (level >= 8) return '1';
  if (level >= 5) return '1/2';
  return null;
}

// ── Monk helpers ───────────────────────────────────────────────────────
/** Martial Arts die by monk level. */
export function martialArtsDie(level) {
  if (level >= 17) return 'd10';
  if (level >= 11) return 'd8';
  if (level >= 5) return 'd6';
  return 'd4';
}
/** Ki points by monk level (none until 2nd). */
export function kiPoints(level) {
  return (level || 1) >= 2 ? level : 0;
}
/** Unarmored Movement speed bonus (ft) by monk level. */
export function unarmoredMovement(level) {
  if (level >= 18) return 30;
  if (level >= 14) return 25;
  if (level >= 10) return 20;
  if (level >= 6) return 15;
  if (level >= 2) return 10;
  return 0;
}

// ── Paladin helpers ────────────────────────────────────────────────────
/** Lay on Hands pool (5 × paladin level). */
export function layOnHandsPool(level) {
  return (level || 1) * 5;
}

// ── Sorcerer helpers ───────────────────────────────────────────────────
/** Sorcery points by sorcerer level (none until 2nd). */
export function sorceryPoints(level) {
  return (level || 1) >= 2 ? level : 0;
}
/** Cantrips known by sorcerer level (display-only cap). */
export function sorcererCantripsKnown(level) {
  if (level >= 10) return 6;
  if (level >= 4) return 5;
  return 4;
}
/** Spells known by sorcerer level (display-only cap). */
export function sorcererSpellsKnown(level) {
  const table = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
  return table[Math.max(1, Math.min(20, level || 1)) - 1];
}
/** Metamagic options known by sorcerer level. */
export function metamagicKnown(level) {
  if (level >= 17) return 4;
  if (level >= 10) return 3;
  if (level >= 3) return 2;
  return 0;
}

export const METAMAGIC_OPTIONS = [
  { name: 'Careful Spell', cost: '1 SP', desc: 'Protect up to your CHA modifier creatures from a save-based spell (they auto-succeed).' },
  { name: 'Distant Spell', cost: '1 SP', desc: 'Double a spell\'s range (5 ft+), or make a touch spell reach 30 ft.' },
  { name: 'Empowered Spell', cost: '1 SP', desc: 'Reroll up to your CHA modifier damage dice. Stacks with one other Metamagic.' },
  { name: 'Extended Spell', cost: '1 SP', desc: 'Double a spell\'s duration (1 min+), to a max of 24 hours.' },
  { name: 'Heightened Spell', cost: '3 SP', desc: 'One target has disadvantage on its first save against the spell.' },
  { name: 'Quickened Spell', cost: '2 SP', desc: 'Change a 1-action casting time to a bonus action.' },
  { name: 'Seeking Spell', cost: '2 SP', desc: 'Reroll a missed spell attack roll; use the new roll.' },
  { name: 'Subtle Spell', cost: '1 SP', desc: 'Cast without somatic or verbal components.' },
  { name: 'Transmuted Spell', cost: '1 SP', desc: 'Change a spell\'s damage type among acid, cold, fire, lightning, poison, thunder.' },
  { name: 'Twinned Spell', cost: 'spell level SP', desc: 'Target a second creature with a single-target, non-self spell (1 SP for a cantrip).' },
];

// ── Ranger helpers ─────────────────────────────────────────────────────
/** Favored Foe bonus damage die by ranger level. */
export function favoredFoeDie(level) {
  if (level >= 14) return 'd8';
  if (level >= 6) return 'd6';
  return 'd4';
}
/** Spells known by ranger level (none until 2nd). */
export function rangerSpellsKnown(level) {
  if ((level || 1) < 2) return 0;
  const table = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];
  return table[Math.max(1, Math.min(20, level)) - 1];
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
