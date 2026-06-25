/**
 * Death Domain — Cleric. A grim wielder of necrotic power. Combat hook is the
 * Channel Divinity: Touch of Death (a melee-strike nuke scaling with level) plus
 * Divine Strike, shown on the cleric-styled DeathDomainBlock.
 */
export default {
  name: 'Death Domain',
  className: 'Cleric',
  features: [
    {
      id: 'death-spells', name: 'Death Domain Spells', level: 1,
      source: 'Death Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st False Life, Ray of Sickness · 3rd Blindness/Deafness, Ray of Enfeeblement · 5th Animate Dead, Vampiric Touch · 7th Blight, Death Ward · 9th Antilife Shell, Cloudkill. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'death-bonus-prof', name: 'Bonus Proficiency', level: 1,
      source: 'Death Domain',
      desc: 'You gain proficiency with martial weapons.',
    },
    {
      id: 'death-reaper', name: 'Reaper', level: 1,
      source: 'Death Domain', combat: true,
      desc: 'You learn one necromancy cantrip of your choice from any spell list (add it on the Spells tab). When you cast a necromancy cantrip that targets only one creature, it can instead target two creatures within range and within 5 ft of each other.',
    },
    {
      id: 'death-touch', name: 'Channel Divinity: Touch of Death', level: 2,
      source: 'Death Domain', combat: true,
      desc: 'When you hit a creature with a melee attack, spend a Channel Divinity use to deal extra necrotic damage equal to 5 + twice your cleric level. Spend the use on the Combat tab.',
    },
    {
      id: 'death-inescapable', name: 'Inescapable Destruction', level: 6,
      source: 'Death Domain', combat: true,
      desc: 'Necrotic damage from your cleric spells and Channel Divinity options ignores resistance to necrotic damage.',
    },
    {
      id: 'death-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Death Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 necrotic damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'death-improved-reaper', name: 'Improved Reaper', level: 17,
      source: 'Death Domain',
      desc: 'When you cast a necromancy spell of 1st–5th level that targets only one creature, it can instead target two creatures within range and within 5 ft of each other (provide any consumed material components for each target).',
    },
  ],
};
