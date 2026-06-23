export default {
  name: 'College of Swords',
  className: 'Bard',
  features: [
    { id: 'sword-bonus-prof', name: 'Bonus Proficiencies', level: 3, source: 'College of Swords',
      desc: 'You gain proficiency with medium armor and the scimitar. If you\'re proficient with a simple or martial melee weapon, you can use it as a spellcasting focus for your bard spells.' },
    { id: 'sword-fighting-style', name: 'Fighting Style', level: 3, source: 'College of Swords', combat: true,
      desc: 'Choose Dueling (+2 to damage when wielding a melee weapon in one hand and no other weapon) or Two-Weapon Fighting (add your ability modifier to the damage of the second attack).' },
    { id: 'sword-blade-flourish', name: 'Blade Flourish', level: 3, source: 'College of Swords', combat: true,
      desc: 'Whenever you take the Attack action, your walking speed increases by 10 feet until end of turn, and if a weapon attack from that action hits you can use one Blade Flourish (one per turn), expending a use of Bardic Inspiration. Defensive Flourish: extra damage equal to the die, and add the roll to your AC until your next turn. Slashing Flourish: extra damage equal to the die to the target and one other creature within 5 feet of you. Mobile Flourish: extra damage equal to the die, push the target 5 feet + the roll, then use your reaction to move up to your speed to within 5 feet of it.' },
    { id: 'sword-extra-attack', name: 'Extra Attack', level: 6, source: 'College of Swords', combat: true,
      desc: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { id: 'sword-masters-flourish', name: "Master's Flourish", level: 14, source: 'College of Swords', combat: true,
      desc: 'Whenever you use a Blade Flourish option, you can roll a d6 and use it instead of expending a use of Bardic Inspiration.' },
  ],
};
