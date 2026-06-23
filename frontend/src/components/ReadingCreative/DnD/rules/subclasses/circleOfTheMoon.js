export default {
  name: 'Circle of the Moon',
  className: 'Druid',
  features: [
    { id: 'moon-combat-ws', name: 'Combat Wild Shape', level: 2, source: 'Circle of the Moon', combat: true,
      desc: 'You can use Wild Shape as a bonus action rather than an action. While transformed, you can use a bonus action to expend one spell slot to regain 1d8 hit points per level of the slot.' },
    { id: 'moon-circle-forms', name: 'Circle Forms', level: 2, source: 'Circle of the Moon', combat: true,
      desc: 'You can Wild Shape into a beast with a challenge rating as high as 1 (ignoring the Max CR column), and from 6th level as high as your druid level divided by 3 (rounded down).' },
    { id: 'moon-primal-strike', name: 'Primal Strike', level: 6, source: 'Circle of the Moon', combat: true,
      desc: 'Your attacks in beast form count as magical for overcoming resistance and immunity to nonmagical attacks and damage.' },
    { id: 'moon-elemental-ws', name: 'Elemental Wild Shape', level: 10, source: 'Circle of the Moon', combat: true,
      desc: 'You can expend two uses of Wild Shape at once to transform into an air, earth, fire, or water elemental.' },
    { id: 'moon-thousand-forms', name: 'Thousand Forms', level: 14, source: 'Circle of the Moon', combat: true,
      desc: 'You can cast the Alter Self spell at will.' },
  ],
};
