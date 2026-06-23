export default {
  name: 'Scout',
  className: 'Rogue',
  features: [
    { id: 'scout-skirmisher', name: 'Skirmisher', level: 3, source: 'Scout', combat: true,
      desc: 'You can move up to half your speed as a reaction when an enemy ends its turn within 5 feet of you. This movement doesn\'t provoke opportunity attacks.' },
    { id: 'scout-survivalist', name: 'Survivalist', level: 3, source: 'Scout',
      desc: 'You gain proficiency in Nature and Survival if you don\'t have it, and your proficiency bonus is doubled for any ability check using either skill.' },
    { id: 'scout-mobility', name: 'Superior Mobility', level: 9, source: 'Scout', combat: true,
      desc: 'Your walking speed increases by 10 feet. If you have a climbing or swimming speed, that speed increases by 10 feet as well.' },
    { id: 'scout-ambush', name: 'Ambush Master', level: 13, source: 'Scout', combat: true,
      desc: 'You have advantage on initiative rolls. The first creature you hit during the first round of a combat becomes easier to strike: attack rolls against it have advantage until the start of your next turn.' },
    { id: 'scout-sudden', name: 'Sudden Strike', level: 17, source: 'Scout', combat: true,
      desc: 'If you take the Attack action, you can make one additional attack as a bonus action. This attack can benefit from Sneak Attack even if you\'ve already used it this turn, but you can\'t use Sneak Attack against the same target more than once in a turn.' },
  ],
};
