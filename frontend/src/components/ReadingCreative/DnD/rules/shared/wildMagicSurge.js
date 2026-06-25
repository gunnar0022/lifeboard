/**
 * The Wild Magic Surge table (PHB) — 50 entries spanning d100 ranges.
 * `wildMagicSurge(n)` maps a 1–100 roll (100 = "00") to its effect text.
 */
export const WILD_MAGIC_SURGE = [
  { lo: 1, hi: 2, effect: 'Roll on this table at the start of each of your turns for the next minute, ignoring this result on subsequent rolls.' },
  { lo: 3, hi: 4, effect: 'For the next minute, you can see any invisible creature if you have line of sight to it.' },
  { lo: 5, hi: 6, effect: 'A modron chosen and controlled by the DM appears in an unoccupied space within 5 ft of you, then disappears 1 minute later.' },
  { lo: 7, hi: 8, effect: 'You cast Fireball as a 3rd-level spell centered on yourself.' },
  { lo: 9, hi: 10, effect: 'You cast Magic Missile as a 5th-level spell.' },
  { lo: 11, hi: 12, effect: 'Roll a d10. Your height changes by that many inches — odd, you shrink; even, you grow.' },
  { lo: 13, hi: 14, effect: 'You cast Confusion centered on yourself.' },
  { lo: 15, hi: 16, effect: 'For the next minute, you regain 5 hit points at the start of each of your turns.' },
  { lo: 17, hi: 18, effect: 'You grow a long beard made of feathers that remains until you sneeze, when they explode from your face.' },
  { lo: 19, hi: 20, effect: 'You cast Grease centered on yourself.' },
  { lo: 21, hi: 22, effect: 'Creatures have disadvantage on saves against the next spell you cast in the next minute that involves a save.' },
  { lo: 23, hi: 24, effect: 'Your skin turns a vibrant shade of blue. A Remove Curse spell can end this effect.' },
  { lo: 25, hi: 26, effect: 'An eye appears on your forehead for the next minute — advantage on sight-based Wisdom (Perception) checks.' },
  { lo: 27, hi: 28, effect: 'For the next minute, all your spells with a casting time of 1 action have a casting time of 1 bonus action.' },
  { lo: 29, hi: 30, effect: 'You teleport up to 60 ft to an unoccupied space of your choice that you can see.' },
  { lo: 31, hi: 32, effect: 'You are transported to the Astral Plane until the end of your next turn, then return to your space (or nearest unoccupied).' },
  { lo: 33, hi: 34, effect: 'Maximize the damage of the next damaging spell you cast within the next minute.' },
  { lo: 35, hi: 36, effect: 'Roll a d10. Your age changes by that many years — odd, younger (min 1); even, older.' },
  { lo: 37, hi: 38, effect: '1d6 flumphs (DM-controlled) appear within 60 ft, frightened of you. They vanish after 1 minute.' },
  { lo: 39, hi: 40, effect: 'You regain 2d10 hit points.' },
  { lo: 41, hi: 42, effect: 'You turn into a potted plant until the start of your next turn (incapacitated, vulnerable to all damage; pot breaks at 0 HP and you revert).' },
  { lo: 43, hi: 44, effect: 'For the next minute, you can teleport up to 20 ft as a bonus action on each of your turns.' },
  { lo: 45, hi: 46, effect: 'You cast Levitate on yourself.' },
  { lo: 47, hi: 48, effect: 'A unicorn (DM-controlled) appears within 5 ft of you, then disappears 1 minute later.' },
  { lo: 49, hi: 50, effect: "You can't speak for the next minute. Whenever you try, pink bubbles float out of your mouth." },
  { lo: 51, hi: 52, effect: 'A spectral shield hovers near you for the next minute: +2 AC and immunity to Magic Missile.' },
  { lo: 53, hi: 54, effect: 'You are immune to being intoxicated by alcohol for the next 5d6 days.' },
  { lo: 55, hi: 56, effect: 'Your hair falls out but grows back within 24 hours.' },
  { lo: 57, hi: 58, effect: "For the next minute, any flammable object you touch (not worn/carried by another) bursts into flame." },
  { lo: 59, hi: 60, effect: 'You regain your lowest-level expended spell slot.' },
  { lo: 61, hi: 62, effect: 'For the next minute, you must shout when you speak.' },
  { lo: 63, hi: 64, effect: 'You cast Fog Cloud centered on yourself.' },
  { lo: 65, hi: 66, effect: 'Up to three creatures you choose within 30 ft of you take 4d10 lightning damage.' },
  { lo: 67, hi: 68, effect: 'You are frightened by the nearest creature until the end of your next turn.' },
  { lo: 69, hi: 70, effect: 'Each creature within 30 ft becomes invisible for the next minute (ends for a creature when it attacks or casts a spell).' },
  { lo: 71, hi: 72, effect: 'You gain resistance to all damage for the next minute.' },
  { lo: 73, hi: 74, effect: 'A random creature within 60 ft of you becomes poisoned for 1d4 hours.' },
  { lo: 75, hi: 76, effect: 'You glow with bright light in a 30-ft radius for the next minute; a creature ending its turn within 5 ft is blinded until the end of its next turn.' },
  { lo: 77, hi: 78, effect: "You cast Polymorph on yourself. If you fail the save, you turn into a sheep for the spell's duration." },
  { lo: 79, hi: 80, effect: 'Illusory butterflies and flower petals flutter within 10 ft of you for the next minute.' },
  { lo: 81, hi: 82, effect: 'You can take one additional action immediately.' },
  { lo: 83, hi: 84, effect: 'Each creature within 30 ft takes 1d10 necrotic damage; you regain HP equal to the total dealt.' },
  { lo: 85, hi: 86, effect: 'You cast Mirror Image.' },
  { lo: 87, hi: 88, effect: 'You cast Fly on a random creature within 60 ft of you.' },
  { lo: 89, hi: 90, effect: "You become invisible for the next minute and can't be heard; the invisibility ends if you attack or cast a spell." },
  { lo: 91, hi: 92, effect: 'If you die within the next minute, you immediately come back to life as if by the Reincarnate spell.' },
  { lo: 93, hi: 94, effect: 'Your size increases by one size category for the next minute.' },
  { lo: 95, hi: 96, effect: 'You and all creatures within 30 ft gain vulnerability to piercing damage for the next minute.' },
  { lo: 97, hi: 98, effect: 'You are surrounded by faint, ethereal music for the next minute.' },
  { lo: 99, hi: 100, effect: 'You regain all expended sorcery points.' },
];

/** Map a 1–100 roll (100 represents "00") to its surge effect text. */
export function wildMagicSurge(n) {
  const roll = Number(n);
  if (!Number.isInteger(roll) || roll < 1 || roll > 100) return null;
  const row = WILD_MAGIC_SURGE.find(r => roll >= r.lo && roll <= r.hi);
  return row ? row.effect : null;
}

/** Roll a fresh d100 (1–100). */
export function rollD100() {
  return Math.floor(Math.random() * 100) + 1;
}
