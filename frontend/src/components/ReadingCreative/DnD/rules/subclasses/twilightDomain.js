/**
 * Twilight Domain — Cleric. Guardian against the terrors of night. Channel
 * Divinity: Twilight Sanctuary (a moving sphere granting temp HP or ending
 * charm/fright) headlines the cleric-styled TwilightDomainBlock, with the
 * PB-scaled Steps of Night pool, the Eyes of Night share, and reminders.
 */
export default {
  name: 'Twilight Domain',
  className: 'Cleric',
  features: [
    {
      id: 'twi-spells', name: 'Twilight Domain Spells', level: 1,
      source: 'Twilight Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Faerie Fire, Sleep · 3rd Moonbeam, See Invisibility · 5th Aura of Vitality, Leomund's Tiny Hut · 7th Aura of Life, Greater Invisibility · 9th Circle of Power, Mislead. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'twi-bonus-prof', name: 'Bonus Proficiencies', level: 1,
      source: 'Twilight Domain',
      desc: 'You gain proficiency with martial weapons and heavy armor.',
    },
    {
      id: 'twi-eyes', name: 'Eyes of Night', level: 1,
      source: 'Twilight Domain', combat: true,
      desc: 'You have darkvision out to 300 ft (seeing in dim light as bright, darkness as dim). Action: share this darkvision with willing creatures within 10 ft, up to your WIS modifier, for 1 hour — once per long rest (or expend a spell slot to share again). Track the share on the Combat tab.',
    },
    {
      id: 'twi-vigilant', name: 'Vigilant Blessing', level: 1,
      source: 'Twilight Domain', combat: true,
      desc: "Action: give one creature you touch (possibly yourself) advantage on its next initiative roll. The benefit ends after that roll or if you use this again.",
    },
    {
      id: 'twi-sanctuary', name: 'Channel Divinity: Twilight Sanctuary', level: 2,
      source: 'Twilight Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use to emanate a 30-ft-radius sphere of dim light for 1 minute (moves with you). When a creature ends its turn in it, grant either temp HP equal to 1d6 + your cleric level, or end one charm or fright effect on it. Spend the use on the Combat tab.',
    },
    {
      id: 'twi-steps', name: 'Steps of Night', level: 6,
      source: 'Twilight Domain', combat: true,
      desc: 'Bonus action while in dim light or darkness: gain a flying speed equal to your walking speed for 1 minute. Uses equal to your proficiency bonus, regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'twi-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Twilight Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 radiant damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'twi-shroud', name: 'Twilight Shroud', level: 17,
      source: 'Twilight Domain', combat: true,
      desc: 'You and your allies have half cover while within the sphere created by your Twilight Sanctuary.',
    },
  ],
};
