/** Rune Knight (Fighter) runes + scaling helpers. */
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
