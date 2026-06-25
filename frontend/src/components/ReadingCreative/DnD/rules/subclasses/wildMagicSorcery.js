/**
 * Wild Magic — Sorcerer. Untamed chaos magic. The signature is the Wild Magic
 * Surge table (a d100 roller lives on the WildMagicSorceryBlock); Tides of Chaos
 * bends fate, Bend Luck spends SP to nudge a roll, and Controlled Chaos lets you
 * roll the surge twice. Named to avoid colliding with the Barbarian's WildMagicBlock.
 */
export default {
  name: 'Wild Magic',
  className: 'Sorcerer',
  features: [
    {
      id: 'wms-surge', name: 'Wild Magic Surge', level: 1,
      source: 'Wild Magic', combat: true,
      desc: 'Once per turn after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20; on a 1, roll on the Wild Magic Surge table for a random effect. Roll the d100 surge table on the Combat tab.',
    },
    {
      id: 'wms-tides', name: 'Tides of Chaos', level: 1,
      source: 'Wild Magic', combat: true,
      desc: 'You can gain advantage on one attack roll, ability check, or saving throw. Once used, you must finish a long rest to use it again — but any time before then, the DM can have you roll on the Wild Magic Surge table after you cast a spell, which immediately restores this feature.',
    },
    {
      id: 'wms-bend', name: 'Bend Luck', level: 6,
      source: 'Wild Magic', combat: true,
      desc: "When another creature you can see makes an attack roll, ability check, or saving throw, you can use your reaction and spend 2 sorcery points to roll 1d4 and apply it as a bonus or penalty (your choice) to the roll — after the roll but before its effects.",
    },
    {
      id: 'wms-controlled', name: 'Controlled Chaos', level: 14,
      source: 'Wild Magic', combat: true,
      desc: 'Whenever you roll on the Wild Magic Surge table, you can roll twice and use either result. The Combat tab roller will offer both rolls automatically.',
    },
    {
      id: 'wms-bombardment', name: 'Spell Bombardment', level: 18,
      source: 'Wild Magic', combat: true,
      desc: 'When you roll damage for a spell and roll the highest possible number on any of the dice, choose one of those dice, roll it again, and add it to the damage. Once per turn.',
    },
  ],
};
