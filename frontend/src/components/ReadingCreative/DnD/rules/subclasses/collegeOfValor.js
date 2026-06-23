export default {
  name: 'College of Valor',
  className: 'Bard',
  features: [
    { id: 'valor-bonus-prof', name: 'Bonus Proficiencies', level: 3, source: 'College of Valor',
      desc: 'You gain proficiency with medium armor, shields, and martial weapons.' },
    { id: 'valor-combat-inspiration', name: 'Combat Inspiration', level: 3, source: 'College of Valor', combat: true,
      desc: 'A creature that has a Bardic Inspiration die from you can roll it and add the number to a weapon damage roll it just made. Alternatively, when an attack roll is made against the creature, it can use its reaction to roll the die and add it to its AC against that attack — after seeing the roll but before knowing if it hits.' },
    { id: 'valor-extra-attack', name: 'Extra Attack', level: 6, source: 'College of Valor', combat: true,
      desc: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'valor-battle-magic', name: 'Battle Magic', level: 14, source: 'College of Valor', combat: true,
      desc: 'When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.' },
  ],
};
