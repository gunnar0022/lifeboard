/**
 * Grave Domain — Cleric. Guardian of the boundary between life and death. Combat
 * hooks are two WIS-scaled reaction/utility pools (Eyes of the Grave, Sentinel at
 * Death's Door) and Channel Divinity: Path to the Grave, all on the cleric-styled
 * GraveDomainBlock. A defensive healer who punishes those who cheat death.
 */
export default {
  name: 'Grave Domain',
  className: 'Cleric',
  features: [
    {
      id: 'grave-spells', name: 'Grave Domain Spells', level: 1,
      source: 'Grave Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Bane, False Life · 3rd Gentle Repose, Ray of Enfeeblement · 5th Revivify, Vampiric Touch · 7th Blight, Death Ward · 9th Antilife Shell, Raise Dead. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'grave-mortality', name: 'Circle of Mortality', level: 1,
      source: 'Grave Domain', combat: true,
      desc: 'When you restore hit points with a spell to a creature at 0 HP, use the highest number possible for each healing die instead of rolling. You also learn Spare the Dying (free, doesn\'t count against cantrips known); for you it has a range of 30 ft and you can cast it as a bonus action.',
    },
    {
      id: 'grave-eyes', name: 'Eyes of the Grave', level: 1,
      source: 'Grave Domain', combat: true,
      desc: 'Action: until the end of your next turn, sense the location of any undead within 60 ft that isn\'t behind total cover or warded from divination. Uses equal to your WIS modifier (min once), regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'grave-path', name: 'Channel Divinity: Path to the Grave', level: 2,
      source: 'Grave Domain', combat: true,
      desc: 'Action: curse one creature within 30 ft until the end of your next turn. The next time you or an ally hits it with an attack, it has vulnerability to all of that attack\'s damage, then the curse ends. Spend a Channel Divinity use on the Combat tab.',
    },
    {
      id: 'grave-sentinel', name: "Sentinel at Death's Door", level: 6,
      source: 'Grave Domain', combat: true,
      desc: 'Reaction: when you or an ally you can see within 30 ft suffers a critical hit, turn it into a normal hit (canceling any crit-triggered effects). Uses equal to your WIS modifier (min once), regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'grave-potent', name: 'Potent Spellcasting', level: 8,
      source: 'Grave Domain', combat: true,
      desc: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.',
    },
    {
      id: 'grave-keeper', name: 'Keeper of Souls', level: 17,
      source: 'Grave Domain', combat: true,
      desc: "When an enemy you can see dies within 30 ft, you or an ally within 30 ft regains hit points equal to the enemy's number of Hit Dice (you must not be incapacitated). Usable once, then not again until the start of your next turn.",
    },
  ],
};
