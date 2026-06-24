/**
 * Oathbreaker — a fallen paladin who has broken their sacred oath in pursuit of
 * dark ambition. No tenets; a corrupted creed instead. Flavor on the Features
 * tab; the Combat-tab OathbreakerBlock surfaces the two Channel Divinity options
 * (Control Undead, Dreadful Aspect), the CHA melee-damage aura, and the
 * trackable Dread Lord capstone.
 */
export default {
  name: 'Oathbreaker',
  className: 'Paladin',
  features: [
    {
      id: 'ob-creed', name: 'An Oath Broken', level: 3,
      source: 'Oathbreaker', noTruncate: true,
      desc: 'A paladin who renounces their sacred oath in pursuit of a dark ambition or wicked power. Having abandoned their tenets, they retain their martial might but turn it toward domination and fear — wielding undeath and terror as weapons. (Becoming an Oathbreaker is a story choice made with your DM.)',
    },
    {
      id: 'ob-spells', name: 'Oathbreaker Spells', level: 3,
      source: 'Oathbreaker',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Hellish Rebuke, Inflict Wounds · 5th Crown of Madness, Darkness · 9th Animate Dead, Bestow Curse · 13th Blight, Confusion · 17th Contagion, Dominate Person. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'ob-cd', name: 'Channel Divinity', level: 3,
      source: 'Oathbreaker', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Control Undead: action — an undead within 30 ft. makes a WIS save or obeys your commands for 24 hours (or until you use this again); undead with CR ≥ your paladin level are immune. • Dreadful Aspect: action — each creature of your choice within 30 ft. that can see you makes a WIS save or is frightened of you for 1 min (a creature ending its turn 30+ ft. away may retry the save).',
    },
    {
      id: 'ob-aura', name: 'Aura of Hate', level: 7,
      source: 'Oathbreaker', combat: true,
      desc: 'You, and any fiends and undead within 10 ft. of you, gain a bonus to melee weapon damage rolls equal to your CHA modifier (min +1). A creature can benefit from only one paladin\'s Aura of Hate at a time. The aura increases to 30 ft. at 18th level.',
    },
    {
      id: 'ob-resistance', name: 'Supernatural Resistance', level: 15,
      source: 'Oathbreaker', combat: true,
      desc: 'You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.',
    },
    {
      id: 'ob-dreadlord', name: 'Dread Lord', level: 20,
      source: 'Oathbreaker', combat: true,
      desc: "Action: for 1 minute, surround yourself with a 30-ft. aura of gloom (bright light becomes dim). An enemy frightened by you takes 4d10 psychic if it starts its turn in the aura; you and chosen creatures are draped in shadow (sight-reliant attackers have disadvantage against them). As a bonus action each turn, make a melee spell attack from the shadows — on a hit, 3d10 + your CHA modifier necrotic. Once per long rest.",
    },
  ],
};
