/**
 * Life Domain — Cleric. The quintessential healer. Channel Divinity: Preserve
 * Life (a big distributable heal pool = 5× level) headlines the cleric-styled
 * LifeDomainBlock, with Disciple of Life / Blessed Healer / Supreme Healing as
 * the passive healing amplifiers and Divine Strike for offense.
 */
export default {
  name: 'Life Domain',
  className: 'Cleric',
  features: [
    {
      id: 'life-spells', name: 'Life Domain Spells', level: 1,
      source: 'Life Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Bless, Cure Wounds · 3rd Lesser Restoration, Spiritual Weapon · 5th Beacon of Hope, Revivify · 7th Death Ward, Guardian of Faith · 9th Mass Cure Wounds, Raise Dead. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'life-bonus-prof', name: 'Bonus Proficiency', level: 1,
      source: 'Life Domain',
      desc: 'You gain proficiency with heavy armor.',
    },
    {
      id: 'life-disciple', name: 'Disciple of Life', level: 1,
      source: 'Life Domain', combat: true,
      desc: 'Whenever a spell of 1st level or higher restores hit points to a creature, it regains additional hit points equal to 2 + the spell\'s level.',
    },
    {
      id: 'life-preserve', name: 'Channel Divinity: Preserve Life', level: 2,
      source: 'Life Domain', combat: true,
      desc: "Action: spend a Channel Divinity use to restore hit points equal to five times your cleric level, divided among creatures within 30 ft. It can't raise a creature above half its HP maximum and doesn't work on undead or constructs. Spend the use on the Combat tab.",
    },
    {
      id: 'life-blessed', name: 'Blessed Healer', level: 6,
      source: 'Life Domain', combat: true,
      desc: "When you cast a spell of 1st level or higher that restores hit points to a creature other than you, you regain hit points equal to 2 + the spell's level.",
    },
    {
      id: 'life-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Life Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 radiant damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'life-supreme', name: 'Supreme Healing', level: 17,
      source: 'Life Domain', combat: true,
      desc: 'When you would roll dice to restore hit points with a spell, use the highest number possible for each die instead (e.g. 2d6 becomes 12).',
    },
  ],
};
