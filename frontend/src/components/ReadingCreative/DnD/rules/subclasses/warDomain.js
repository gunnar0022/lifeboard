/**
 * War Domain — Cleric. The divine warrior. The WIS-scaled War Priest bonus-attack
 * pool and two Channel Divinity options (Guided Strike, then War God's Blessing at
 * 6th) headline the cleric-styled WarDomainBlock, with Divine Strike and the
 * Avatar of Battle reminder.
 */
export default {
  name: 'War Domain',
  className: 'Cleric',
  features: [
    {
      id: 'war-spells', name: 'War Domain Spells', level: 1,
      source: 'War Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Divine Favor, Shield of Faith · 3rd Magic Weapon, Spiritual Weapon · 5th Crusader's Mantle, Spirit Guardians · 7th Freedom of Movement, Stoneskin · 9th Flame Strike, Hold Monster. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'war-bonus-prof', name: 'Bonus Proficiency', level: 1,
      source: 'War Domain',
      desc: 'You gain proficiency with martial weapons and heavy armor.',
    },
    {
      id: 'war-priest', name: 'War Priest', level: 1,
      source: 'War Domain', combat: true,
      desc: 'When you take the Attack action, you can make one weapon attack as a bonus action. Uses equal to your WIS modifier (min once), regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'war-guided', name: 'Channel Divinity: Guided Strike', level: 2,
      source: 'War Domain', combat: true,
      desc: 'When you make an attack roll, spend a Channel Divinity use to gain a +10 bonus to it (decide after seeing the roll, before the result). Spend the use on the Combat tab.',
    },
    {
      id: 'war-blessing', name: "Channel Divinity: War God's Blessing", level: 6,
      source: 'War Domain', combat: true,
      desc: 'Reaction: when a creature within 30 ft makes an attack roll, spend a Channel Divinity use to grant it a +10 bonus (decide after seeing the roll, before the result). Spend the use on the Combat tab.',
    },
    {
      id: 'war-divine-strike', name: 'Divine Strike', level: 8,
      source: 'War Domain', combat: true,
      desc: "Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 damage of the weapon's type. This increases to 2d8 at 14th level.",
    },
    {
      id: 'war-avatar', name: 'Avatar of Battle', level: 17,
      source: 'War Domain', combat: true,
      desc: 'You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.',
    },
  ],
};
