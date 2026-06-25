/**
 * Order Domain — Cleric. The disciplined enforcer of law. Channel Divinity:
 * Order's Demand (a charm/disarm AoE) headlines the cleric-styled
 * OrderDomainBlock, with the WIS-scaled Embodiment of the Law pool tracked
 * below and Voice of Authority / Divine Strike / Order's Wrath as reminders.
 */
export default {
  name: 'Order Domain',
  className: 'Cleric',
  features: [
    {
      id: 'order-spells', name: 'Order Domain Spells', level: 1,
      source: 'Order Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Command, Heroism · 3rd Hold Person, Zone of Truth · 5th Mass Healing Word, Slow · 7th Compulsion, Locate Creature · 9th Commune, Dominate Person. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'order-bonus-prof', name: 'Bonus Proficiencies', level: 1,
      source: 'Order Domain',
      desc: 'You gain proficiency with heavy armor and in the Intimidation or Persuasion skill (your choice).',
    },
    {
      id: 'order-voice', name: 'Voice of Authority', level: 1,
      source: 'Order Domain', combat: true,
      desc: 'When you cast a spell of 1st level or higher targeting an ally, that ally can use their reaction immediately after to make one weapon attack against a creature of your choice you can see. If the spell targets multiple allies, you choose which one attacks.',
    },
    {
      id: 'order-demand', name: "Channel Divinity: Order's Demand", level: 2,
      source: 'Order Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use; each creature of your choice within 30 ft that can see/hear you makes a WIS save or is charmed until the end of your next turn (or until it takes damage). Those that fail can also be made to drop what they\'re holding. Spend the use on the Combat tab.',
    },
    {
      id: 'order-embodiment', name: 'Embodiment of the Law', level: 6,
      source: 'Order Domain', combat: true,
      desc: "When you cast an enchantment spell of 1st level or higher with a casting time of 1 action, you can change its casting time to 1 bonus action. Uses equal to your WIS modifier (min once), regained on a long rest. Track uses on the Combat tab.",
    },
    {
      id: 'order-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Order Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 psychic damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'order-wrath', name: "Order's Wrath", level: 17,
      source: 'Order Domain', combat: true,
      desc: 'When you deal Divine Strike damage to a creature on your turn, you can curse it until the start of your next turn. The next time an ally hits the cursed creature, it takes an extra 2d8 psychic and the curse ends. Once per turn.',
    },
  ],
};
