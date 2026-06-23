/** Arcane Archer (Fighter) Arcane Shot options + scaling helper. */
export const ARCANE_SHOT_LIST = [
  { name: 'Banishing Arrow', school: 'Abjuration',
    desc: 'On a hit, the target makes a Charisma save or is banished to the Feywild until the end of its next turn (speed 0, incapacitated).',
    at18: 'Also deals 2d6 force damage on a hit.' },
  { name: 'Beguiling Arrow', school: 'Enchantment',
    desc: 'Extra 2d6 psychic damage; the target makes a Wisdom save or is charmed by an ally you choose within 30 ft until the start of your next turn.',
    at18: 'Psychic damage increases to 4d6.' },
  { name: 'Bursting Arrow', school: 'Evocation',
    desc: 'The arrow detonates: the target and all creatures within 10 ft take 2d6 force damage each.',
    at18: 'Force damage increases to 4d6.' },
  { name: 'Enfeebling Arrow', school: 'Necromancy',
    desc: 'Extra 2d6 necrotic damage; the target makes a Constitution save or its weapon damage is halved until the start of your next turn.',
    at18: 'Necrotic damage increases to 4d6.' },
  { name: 'Grasping Arrow', school: 'Conjuration',
    desc: 'Extra 2d6 poison damage; speed −10 ft and 2d6 slashing the first time it moves each turn. Brambles last 1 min (Athletics vs your DC to remove).',
    at18: 'Poison and slashing damage both increase to 4d6.' },
  { name: 'Piercing Arrow', school: 'Transmutation',
    desc: 'No attack roll: a 1-ft × 30-ft line ignoring cover. Each creature makes a Dexterity save, taking arrow damage + 1d6 piercing (half on a success).',
    at18: 'Extra piercing damage increases to 2d6.' },
  { name: 'Seeking Arrow', school: 'Divination',
    desc: 'No attack roll: choose a creature seen in the last minute. It makes a Dexterity save, taking arrow damage + 1d6 force and revealing its location (half, no location, on a success).',
    at18: 'Force damage increases to 2d6.' },
  { name: 'Shadow Arrow', school: 'Illusion',
    desc: 'Extra 2d6 psychic damage; the target makes a Wisdom save or can\'t see beyond 5 ft until the start of your next turn.',
    at18: 'Psychic damage increases to 4d6.' },
];

// Arcane Shot options known: 2 at 3rd, +1 at 7th/10th/15th/18th.
export function arcaneShotsKnown(level) {
  if (level >= 18) return 6;
  if (level >= 15) return 5;
  if (level >= 10) return 4;
  if (level >= 7) return 3;
  return 2;
}
