export default {
  name: 'Path of the Beast',
  className: 'Barbarian',
  features: [
    { id: 'beast-form', name: 'Form of the Beast', level: 3, source: 'Path of the Beast', combat: true,
      desc: 'When you enter your rage, you can transform, manifesting a natural weapon that lasts until the rage ends. It counts as a simple melee weapon and you add your Strength modifier to its attack and damage rolls. Choose its form each time you rage: Bite (1d8 piercing; once per turn when you damage a creature and are below half HP, regain HP equal to your proficiency bonus), Claws (1d6 slashing; once per turn when you Attack with a claw, make one extra claw attack as part of the action), or Tail (1d8 piercing, reach; as a reaction when a creature within 10 ft hits you, roll a d8 and add it to your AC, possibly causing the attack to miss).' },
    { id: 'beast-soul', name: 'Bestial Soul', level: 6, source: 'Path of the Beast', combat: true,
      desc: 'Your Form of the Beast natural weapons count as magical for overcoming resistance and immunity to nonmagical attacks and damage. When you finish a short or long rest, choose one benefit until your next rest: a swimming speed equal to your walking speed and breathe underwater; a climbing speed equal to your walking speed and climb difficult surfaces (even ceilings) without a check; or, when you jump, make a Strength (Athletics) check and extend your jump by feet equal to the total (once per turn).' },
    { id: 'beast-infectious-fury', name: 'Infectious Fury', level: 10, source: 'Path of the Beast', combat: true,
      desc: 'When you hit a creature with your natural weapons while raging, you can force it to make a Wisdom saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). On a failure, choose one: the target uses its reaction to make a melee attack against another creature of your choice it can see, or the target takes 2d12 psychic damage. You can use this a number of times equal to your proficiency bonus, regaining all expended uses when you finish a long rest.' },
    { id: 'beast-call-the-hunt', name: 'Call the Hunt', level: 14, source: 'Path of the Beast', combat: true,
      desc: 'When you enter your rage, you can choose a number of other willing creatures within 30 feet equal to your Constitution modifier (minimum of one). You gain 5 temporary hit points for each creature that accepts. Until the rage ends, each chosen creature can, once on each of its turns, roll a d6 when it hits a target with an attack and add the result to that damage. You can use this a number of times equal to your proficiency bonus, regaining all expended uses when you finish a long rest.' },
  ],
};
