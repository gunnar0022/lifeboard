/**
 * Peace Domain — Cleric. A binder of allies. The PB-scaled Emboldening Bond pool
 * and Channel Divinity: Balm of Peace headline the cleric-styled PeaceDomainBlock,
 * with Protective Bond / Potent Spellcasting / Expansive Bond as reminders.
 */
export default {
  name: 'Peace Domain',
  className: 'Cleric',
  features: [
    {
      id: 'peace-spells', name: 'Peace Domain Spells', level: 1,
      source: 'Peace Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Heroism, Sanctuary · 3rd Aid, Warding Bond · 5th Beacon of Hope, Sending · 7th Aura of Purity, Otiluke's Resilient Sphere · 9th Greater Restoration, Rary's Telepathic Bond. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'peace-implement', name: 'Implement of Peace', level: 1,
      source: 'Peace Domain',
      desc: 'You gain proficiency in the Insight, Performance, or Persuasion skill (your choice).',
    },
    {
      id: 'peace-bond', name: 'Emboldening Bond', level: 1,
      source: 'Peace Domain', combat: true,
      desc: 'Action: bond a number of willing creatures within 30 ft (including yourself) equal to your proficiency bonus, for 10 minutes. While a bonded creature is within 30 ft of another, it can add 1d4 to an attack roll, ability check, or save (once per turn). Uses equal to your proficiency bonus, regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'peace-balm', name: 'Channel Divinity: Balm of Peace', level: 2,
      source: 'Peace Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use to move up to your speed without provoking opportunity attacks; each creature you move within 5 ft of can be healed 2d6 + your WIS modifier (min 1), once per use. Spend the use on the Combat tab.',
    },
    {
      id: 'peace-protective', name: 'Protective Bond', level: 6,
      source: 'Peace Domain', combat: true,
      desc: 'When a creature affected by your Emboldening Bond is about to take damage, another bonded creature within 30 ft can use its reaction to teleport within 5 ft of it and take all that damage instead.',
    },
    {
      id: 'peace-potent', name: 'Potent Spellcasting', level: 8,
      source: 'Peace Domain', combat: true,
      desc: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.',
    },
    {
      id: 'peace-expansive', name: 'Expansive Bond', level: 17,
      source: 'Peace Domain', combat: true,
      desc: 'Emboldening Bond and Protective Bond now work within 60 ft, and a creature using Protective Bond to take damage has resistance to that damage.',
    },
  ],
};
