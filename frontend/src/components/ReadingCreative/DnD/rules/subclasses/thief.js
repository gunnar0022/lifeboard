export default {
  name: 'Thief',
  className: 'Rogue',
  features: [
    { id: 'thief-fast-hands', name: 'Fast Hands', level: 3, source: 'Thief', combat: true,
      desc: 'You can use the bonus action from your Cunning Action to make a Dexterity (Sleight of Hand) check, use thieves\' tools to disarm a trap or open a lock, or take the Use an Object action.' },
    { id: 'thief-second-story', name: 'Second-Story Work', level: 3, source: 'Thief',
      desc: 'Climbing no longer costs you extra movement, and when you make a running jump the distance increases by a number of feet equal to your Dexterity modifier.' },
    { id: 'thief-supreme-sneak', name: 'Supreme Sneak', level: 9, source: 'Thief', combat: true,
      desc: 'You have advantage on a Dexterity (Stealth) check if you move no more than half your speed on the same turn.' },
    { id: 'thief-umd', name: 'Use Magic Device', level: 13, source: 'Thief', combat: true,
      desc: 'You ignore all class, race, and level requirements on the use of magic items.' },
    { id: 'thief-reflexes', name: "Thief's Reflexes", level: 17, source: 'Thief', combat: true,
      desc: 'You can take two turns during the first round of any combat — the first at your normal initiative, the second at your initiative minus 10. You can\'t use this when you are surprised.' },
  ],
};
