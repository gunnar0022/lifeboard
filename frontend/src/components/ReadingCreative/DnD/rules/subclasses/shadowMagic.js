/**
 * Shadow Magic — Sorcerer. A sorcerer touched by the Shadowfell, drawing on a
 * twilight state between life and death. Combat hooks: the Charisma death-save of
 * Strength of the Grave, the SP-summoned Hound of Ill Omen, and the Umbral Form
 * transformation — surfaced on the ShadowMagicBlock.
 */
export default {
  name: 'Shadow Magic',
  className: 'Sorcerer',
  features: [
    {
      id: 'shadow-eyes', name: 'Eyes of the Dark', level: 1,
      source: 'Shadow Magic', combat: true,
      desc: 'You have darkvision out to 120 ft. At 3rd level you learn the Darkness spell (it doesn\'t count against your spells known); you can cast it with a spell slot or by spending 2 sorcery points, and if you spend sorcery points you can see through that darkness.',
    },
    {
      id: 'shadow-grave', name: 'Strength of the Grave', level: 1,
      source: 'Shadow Magic', combat: true,
      desc: 'When damage reduces you to 0 HP, you can make a Charisma saving throw (DC 5 + the damage taken); on a success you drop to 1 HP instead. You can\'t use this against radiant damage or a critical hit. Once it succeeds, you can\'t use it again until you finish a long rest.',
    },
    {
      id: 'shadow-hound', name: 'Hound of Ill Omen', level: 6,
      source: 'Shadow Magic', combat: true,
      desc: 'Bonus action: spend 3 sorcery points to summon a hound of ill omen against a creature within 120 ft. It uses dire wolf stats (Medium monstrosity) with temp HP equal to half your sorcerer level, moves through creatures/objects, always knows its target\'s location, and gives the target disadvantage on saves against your spells while within 5 ft of it. Lasts 5 minutes. Summon it on the Combat tab.',
    },
    {
      id: 'shadow-walk', name: 'Shadow Walk', level: 14,
      source: 'Shadow Magic', combat: true,
      desc: 'When you are in dim light or darkness, you can use a bonus action to teleport up to 120 ft to an unoccupied space you can see that is also in dim light or darkness.',
    },
    {
      id: 'shadow-umbral', name: 'Umbral Form', level: 18,
      source: 'Shadow Magic', combat: true,
      desc: 'Bonus action: spend 6 sorcery points to transform into a shadowy form for 1 minute. You gain resistance to all damage except force and radiant, and can move through creatures and objects as difficult terrain (5 force damage if you end your turn inside one). Ends early if you are incapacitated, die, or dismiss it (bonus action).',
    },
  ],
};
