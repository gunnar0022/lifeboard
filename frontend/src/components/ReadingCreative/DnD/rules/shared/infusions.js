/**
 * Artificer Infusions — the fixed option list plus the two scaling tables that
 * gate it (Infusions Known = how many you've learned; Infused Items = how many
 * can be active at once). Consumed by the Features-tab picker (InfusionChoice)
 * and the Combat-tab workbench (ArtificerBlock). Pure data + helpers, no React.
 *
 * `prereq` is the minimum artificer level to learn the infusion; `attune` flags
 * whether the resulting magic item requires attunement; `target` is the kind of
 * object it can be applied to.
 */

// How many infusions you know (Infusions Known column).
export function infusionsKnown(level) {
  const l = level || 1;
  if (l >= 18) return 12;
  if (l >= 14) return 10;
  if (l >= 10) return 8;
  if (l >= 6) return 6;
  if (l >= 2) return 4;
  return 0;
}

// How many infused items can be active at once (Infused Items column).
export function infusedItemsMax(level) {
  const l = level || 1;
  if (l >= 18) return 6;
  if (l >= 14) return 5;
  if (l >= 10) return 4;
  if (l >= 6) return 3;
  if (l >= 2) return 2;
  return 0;
}

// Attunement cap — artificers exceed the usual 3 as they gain Magic Item Adept
// (10th), Savant (14th), and Master (18th).
export function attunementCap(level) {
  const l = level || 1;
  if (l >= 18) return 6;
  if (l >= 14) return 5;
  if (l >= 10) return 4;
  return 3;
}

export const INFUSION_LIST = [
  {
    name: 'Enhanced Defense',
    prereq: 2, attune: false, target: 'A suit of armor or a shield',
    desc: 'The item grants +1 AC while worn or wielded (+2 at 10th level).',
  },
  {
    name: 'Enhanced Weapon',
    prereq: 2, attune: false, target: 'A simple or martial weapon',
    desc: 'The weapon grants +1 to attack and damage rolls (+2 at 10th level).',
  },
  {
    name: 'Enhanced Arcane Focus',
    prereq: 2, attune: true, target: 'A rod, staff, or wand',
    desc: 'While holding it you gain +1 to spell attack rolls (+2 at 10th level) and ignore half cover when making a spell attack.',
  },
  {
    name: 'Armor of Magical Strength',
    prereq: 2, attune: true, target: 'A suit of armor',
    desc: 'The armor has charges equal to your INT modifier (min 1). As a reaction when you fail a STR check or save, spend a charge to add your INT modifier to it; spend a charge to add it to an Athletics check or to avoid being knocked prone. Regain all charges on a short or long rest.',
  },
  {
    name: 'Mind Sharpener',
    prereq: 2, attune: false, target: 'A suit of armor or robes',
    desc: 'The item has 4 charges. When you fail a Constitution save to maintain concentration, you can use a reaction to spend a charge and succeed instead. Regains 1d4 expended charges daily at dawn.',
  },
  {
    name: 'Repeating Shot',
    prereq: 2, attune: true, target: 'A simple or martial weapon with the ammunition property',
    desc: 'The weapon grants +1 to attack and damage and ignores the loading property. If you have no ammunition, it produces its own (one piece) each time you attack; that magic ammunition vanishes after the attack.',
  },
  {
    name: 'Replicate Magic Item',
    prereq: 2, attune: false, target: 'A nonmagical object matching the chosen item',
    desc: 'Recreate a particular common magic item (e.g. Bag of Holding, Goggles of Night, Cap of Water Breathing). Higher tiers unlock at 6th, 10th, and 14th level. Attunement depends on the chosen item. You can learn this infusion multiple times for different items.',
  },
  {
    name: 'Returning Weapon',
    prereq: 2, attune: false, target: 'A simple or martial weapon with the thrown property',
    desc: 'The weapon grants +1 to attack and damage and returns to your hand immediately after a ranged attack with it.',
  },
  {
    name: 'Homunculus Servant',
    prereq: 2, attune: true, target: 'A gem or crystal worth at least 100 gp',
    desc: 'Create a Tiny construct companion that obeys your commands. AC 13, HP = 1 + your INT modifier + your artificer level, speed 20 ft / fly 30 ft. It acts on your turn (you forgo one of your attacks to direct its Force Strike: +your spell attack, 1d4 + PB force) and shares your reaction. If it dies you can revive it over a long rest.',
  },
  {
    name: 'Boots of the Winding Path',
    prereq: 6, attune: true, target: 'A pair of boots',
    desc: 'While wearing them you can teleport up to 15 feet as a bonus action to an unoccupied space you can see, provided you have already moved this turn.',
  },
  {
    name: 'Radiant Weapon',
    prereq: 6, attune: true, target: 'A simple or martial weapon',
    desc: 'The weapon grants +1 to attack and damage, sheds bright light (30 ft) on command, and has 4 charges. As a reaction when a creature you can see hits you, spend a charge to blind it until the end of its next turn (CON save negates). Regains 1d4 charges daily at dawn.',
  },
  {
    name: 'Repulsion Shield',
    prereq: 6, attune: true, target: 'A shield',
    desc: 'The shield grants +1 AC and has 4 charges. As a reaction when a creature within 5 ft hits you, spend a charge to push it up to 15 feet away. Regains 1d4 charges daily at dawn.',
  },
  {
    name: 'Resistant Armor',
    prereq: 6, attune: true, target: 'A suit of armor',
    desc: 'The armor grants +1 AC and resistance to one damage type of your choice (acid, cold, fire, force, lightning, necrotic, poison, psychic, radiant, or thunder) chosen when you infuse it.',
  },
  {
    name: 'Spell-Refueling Ring',
    prereq: 6, attune: true, target: 'A ring',
    desc: 'While wearing it you can, as an action, regain one expended spell slot of 3rd level or lower. Once used, it can\'t be used again until your next long rest.',
  },
  {
    name: 'Arcane Propulsion Armor',
    prereq: 14, attune: true, target: 'A suit of armor',
    desc: 'The armor adds +5 ft to your speed, replaces any missing limbs, and can\'t be removed against your will. Each gauntlet is a magic ranged weapon (range 20/60) that deals 1d8 force on a hit and flies back to you after the attack.',
  },
];
