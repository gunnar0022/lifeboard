export default {
  name: 'Champion',
  className: 'Fighter',
  features: [
    { id: 'champ-improved-crit', name: 'Improved Critical', level: 3, source: 'Champion', combat: true,
      desc: 'Your weapon attacks score a critical hit on a roll of 19 or 20.' },
    { id: 'champ-remarkable', name: 'Remarkable Athlete', level: 7, source: 'Champion', combat: true,
      desc: 'Add half your proficiency bonus (rounded up) to any Strength, Dexterity, or Constitution check that doesn\'t already use your proficiency bonus. Your running long jump distance also increases by a number of feet equal to your Strength modifier.' },
    { id: 'champ-extra-style', name: 'Additional Fighting Style', level: 10, source: 'Champion', combat: true,
      desc: 'You can choose a second option from the Fighting Style class feature.' },
    { id: 'champ-superior-crit', name: 'Superior Critical', level: 15, source: 'Champion', combat: true,
      desc: 'Your weapon attacks score a critical hit on a roll of 18-20.' },
    { id: 'champ-survivor', name: 'Survivor', level: 18, source: 'Champion', combat: true,
      desc: 'At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half your hit points left (and at least 1).' },
  ],
};
