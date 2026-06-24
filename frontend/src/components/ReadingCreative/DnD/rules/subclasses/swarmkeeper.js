/**
 * Swarmkeeper — Ranger subclass. A bonded swarm of nature spirits. The Combat-tab
 * block headlines a Gathered Swarm panel (the three once-per-turn assist modes
 * with scaling values + save DC, an editable/rollable appearance, and the 11th-
 * level Mighty Swarm upgrades) and tracks Writhing Tide and Swarming Dispersal
 * (both proficiency-bonus uses / long rest). Spells are pinned on the Spells tab.
 */
export default {
  name: 'Swarmkeeper',
  className: 'Ranger',
  features: [
    {
      id: 'sk-swarm', name: 'Gathered Swarm', level: 3,
      source: 'Swarmkeeper', combat: true,
      desc: 'A swarm of nature spirits shares your space. Once on each of your turns, immediately after you hit a creature with an attack, the swarm assists: deal 1d6 piercing to the target; OR the target makes a STR save vs. your spell save DC or is moved 15 ft. horizontally; OR you are moved 5 ft. horizontally.',
    },
    {
      id: 'sk-magic', name: 'Swarmkeeper Magic', level: 3,
      source: 'Swarmkeeper',
      desc: "You learn Mage Hand (the hand takes the form of your swarm). You also learn an additional always-prepared ranger spell at certain levels: 3rd Faerie Fire & Mage Hand · 5th Web · 9th Gaseous Form · 13th Arcane Eye · 17th Insect Plague. Pin these as Always Prepared on the Spells tab.",
    },
    {
      id: 'sk-writhing', name: 'Writhing Tide', level: 7,
      source: 'Swarmkeeper', combat: true,
      desc: 'As a bonus action, part of your swarm lifts you: gain a flying speed of 10 ft. and the ability to hover for 1 minute (or until you are incapacitated). Uses equal to your proficiency bonus; regain all on a long rest.',
    },
    {
      id: 'sk-mighty', name: 'Mighty Swarm', level: 11,
      source: 'Swarmkeeper', combat: true,
      desc: "Your Gathered Swarm grows mightier: its damage becomes 1d8; a creature that fails the save to be moved is also knocked prone; and when the swarm moves you, you gain half cover until the start of your next turn.",
    },
    {
      id: 'sk-dispersal', name: 'Swarming Dispersal', level: 15,
      source: 'Swarmkeeper', combat: true,
      desc: 'When you take damage, you can use your reaction to gain resistance to that damage, vanish into your swarm, and teleport to an unoccupied space you can see within 30 ft. Uses equal to your proficiency bonus; regain all on a long rest.',
    },
  ],
};
