export default {
  name: 'College of Creation',
  className: 'Bard',
  features: [
    { id: 'crea-mote', name: 'Mote of Potential', level: 3, source: 'College of Creation', combat: true,
      desc: 'Whenever you give a creature a Bardic Inspiration die, you also create a Tiny mote of potential orbiting it until the die is used or lost. When the die is used, the mote adds an effect: Ability Check — the creature rolls the die again and chooses which roll to use. Attack Roll — the mote shatters; the target and each creature of your choice within 5 feet of it must succeed on a Constitution save against your spell save DC or take thunder damage equal to the die roll. Saving Throw — the creature gains temporary hit points equal to the die roll plus your Charisma modifier (minimum 1).' },
    { id: 'crea-performance', name: 'Performance of Creation', level: 3, source: 'College of Creation', combat: true,
      desc: 'As an action, create one nonmagical item (gp value up to 20 × your bard level, Medium or smaller) in an unoccupied space within 10 feet. It lasts a number of hours equal to your proficiency bonus, and you can have only one at a time. Once you use this you can\'t do so again until you finish a long rest, unless you expend a spell slot of 2nd level or higher. The maximum size increases to Large at 6th level and Huge at 14th level.' },
    { id: 'crea-animating', name: 'Animating Performance', level: 6, source: 'College of Creation', combat: true,
      desc: 'As an action, animate one Large or smaller nonmagical item within 30 feet that isn\'t worn or carried; it becomes a Dancing Item (AC 16, HP 10 + 5 × your bard level, Force-Empowered Slam 1d10 + PB force) that obeys you for 1 hour. It takes the Dodge action unless you spend a bonus action to command another action (you can do this as part of your Bardic Inspiration bonus action). Once you use this you can\'t do so again until you finish a long rest, unless you expend a spell slot of 3rd level or higher; you can have only one animated item at a time.' },
    { id: 'crea-crescendo', name: 'Creative Crescendo', level: 14, source: 'College of Creation', combat: true,
      desc: 'When you use Performance of Creation, you can create a number of items at once equal to your Charisma modifier (minimum two). Only one may be your maximum size; the rest must be Small or Tiny. You are also no longer limited by gp value when creating items.' },
  ],
};
