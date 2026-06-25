/**
 * Trickery Domain — Cleric. The illusionist-deceiver. Two Channel Divinity
 * options (Invoke Duplicity, then Cloak of Shadows at 6th) headline the
 * cleric-styled TrickeryDomainBlock, with poison Divine Strike and the Blessing
 * of the Trickster / Improved Duplicity reminders.
 */
export default {
  name: 'Trickery Domain',
  className: 'Cleric',
  features: [
    {
      id: 'trick-spells', name: 'Trickery Domain Spells', level: 1,
      source: 'Trickery Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Charm Person, Disguise Self · 3rd Mirror Image, Pass without Trace · 5th Blink, Dispel Magic · 7th Dimension Door, Polymorph · 9th Dominate Person, Modify Memory. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'trick-blessing', name: 'Blessing of the Trickster', level: 1,
      source: 'Trickery Domain', combat: true,
      desc: 'Action: touch a willing creature other than yourself to give it advantage on Dexterity (Stealth) checks for 1 hour (or until you use this again).',
    },
    {
      id: 'trick-duplicity', name: 'Channel Divinity: Invoke Duplicity', level: 2,
      source: 'Trickery Domain', combat: true,
      desc: "Action: spend a Channel Divinity use to create an illusory duplicate within 30 ft for 1 minute (concentration). Bonus action to move it up to 30 ft (within 120 ft). You can cast spells from its space, and you have advantage on attacks against any creature within 5 ft of both you and the illusion. Spend the use on the Combat tab.",
    },
    {
      id: 'trick-cloak', name: 'Channel Divinity: Cloak of Shadows', level: 6,
      source: 'Trickery Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use to become invisible until the end of your next turn. You become visible if you attack or cast a spell. Spend the use on the Combat tab.',
    },
    {
      id: 'trick-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Trickery Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 poison damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'trick-improved', name: 'Improved Duplicity', level: 17,
      source: 'Trickery Domain', combat: true,
      desc: 'Invoke Duplicity creates up to four duplicates instead of one. As a bonus action, you can move any number of them up to 30 ft (within 120 ft).',
    },
  ],
};
