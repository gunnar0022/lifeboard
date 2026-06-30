export default {
  name: 'Bladesinging',
  className: 'Wizard',
  features: [
    { id: 'blade-training', name: 'Training in War and Song', level: 2, source: 'Bladesinging',
      desc: 'You gain proficiency with light armor and with one type of one-handed melee weapon of your choice. You also gain proficiency in the Performance skill if you don\'t already have it.' },
    { id: 'blade-bladesong', name: 'Bladesong', level: 2, source: 'Bladesinging', combat: true,
      desc: 'As a bonus action you invoke the Bladesong (1 minute), provided you aren\'t wearing medium or heavy armor or using a shield. While active: +Intelligence modifier (min +1) to AC, +10 ft walking speed, advantage on Dexterity (Acrobatics) checks, and +Intelligence modifier (min +1) to Constitution saves to maintain concentration. It ends early if you are incapacitated, don medium/heavy armor or a shield, or use two hands to attack with a weapon. Uses equal to your proficiency bonus, regained on a long rest. Toggle and track it on the Combat tab.' },
    { id: 'blade-extra-attack', name: 'Extra Attack', level: 6, source: 'Bladesinging', combat: true,
      desc: 'You can attack twice, instead of once, whenever you take the Attack action on your turn. You can also cast one of your cantrips in place of one of those attacks.' },
    { id: 'blade-song-defense', name: 'Song of Defense', level: 10, source: 'Bladesinging', combat: true,
      desc: 'While your Bladesong is active and you take damage, you can use your reaction to expend one spell slot and reduce that damage to you by five times the spell slot\'s level.' },
    { id: 'blade-song-victory', name: 'Song of Victory', level: 14, source: 'Bladesinging', combat: true,
      desc: 'While your Bladesong is active, you add your Intelligence modifier (min +1) to the damage of your melee weapon attacks.' },
  ],
};
