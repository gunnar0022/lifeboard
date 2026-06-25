/**
 * Tempest Domain — Cleric. The storm-caller. The WIS-scaled Wrath of the Storm
 * reaction pool and Channel Divinity: Destructive Wrath (max lightning/thunder
 * damage) headline the cleric-styled TempestDomainBlock, with Divine Strike and
 * the Thunderous Strike / Stormborn reminders.
 */
export default {
  name: 'Tempest Domain',
  className: 'Cleric',
  features: [
    {
      id: 'tempest-spells', name: 'Tempest Domain Spells', level: 1,
      source: 'Tempest Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Fog Cloud, Thunderwave · 3rd Gust of Wind, Shatter · 5th Call Lightning, Sleet Storm · 7th Control Water, Ice Storm · 9th Destructive Wave, Insect Plague. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'tempest-bonus-prof', name: 'Bonus Proficiencies', level: 1,
      source: 'Tempest Domain',
      desc: 'You gain proficiency with martial weapons and heavy armor.',
    },
    {
      id: 'tempest-wrath', name: 'Wrath of the Storm', level: 1,
      source: 'Tempest Domain', combat: true,
      desc: 'Reaction: when a creature within 5 ft you can see hits you, it makes a DEX save, taking 2d8 lightning or thunder damage (your choice) on a failure, half on success. Uses equal to your WIS modifier (min once), regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'tempest-destructive', name: 'Channel Divinity: Destructive Wrath', level: 2,
      source: 'Tempest Domain', combat: true,
      desc: 'When you roll lightning or thunder damage, spend a Channel Divinity use to deal maximum damage instead of rolling. Spend the use on the Combat tab.',
    },
    {
      id: 'tempest-thunderous', name: 'Thunderous Strike', level: 6,
      source: 'Tempest Domain', combat: true,
      desc: 'When you deal lightning damage to a Large or smaller creature, you can push it up to 10 ft away from you.',
    },
    {
      id: 'tempest-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Tempest Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 thunder damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'tempest-stormborn', name: 'Stormborn', level: 17,
      source: 'Tempest Domain', combat: true,
      desc: 'You have a flying speed equal to your current walking speed whenever you are not underground or indoors.',
    },
  ],
};
