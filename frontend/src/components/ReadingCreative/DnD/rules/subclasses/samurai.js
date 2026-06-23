export default {
  name: 'Samurai',
  className: 'Fighter',
  features: [
    { id: 'sam-fighting-spirit', name: 'Fighting Spirit', level: 3, source: 'Samurai', combat: true,
      desc: 'As a bonus action, give yourself advantage on all weapon attack rolls until the end of the turn and gain 5 temporary hit points (10 at 10th level, 15 at 15th). You can use this three times, regaining all uses on a long rest.' },
    { id: 'sam-courtier', name: 'Elegant Courtier', level: 7, source: 'Samurai',
      desc: 'When you make a Charisma (Persuasion) check, add your Wisdom modifier to it. You also gain proficiency in Wisdom saving throws (or Intelligence or Charisma saves if you already have it).' },
    { id: 'sam-tireless', name: 'Tireless Spirit', level: 10, source: 'Samurai', combat: true,
      desc: 'When you roll initiative and have no uses of Fighting Spirit remaining, you regain one use.' },
    { id: 'sam-rapid-strike', name: 'Rapid Strike', level: 15, source: 'Samurai', combat: true,
      desc: 'If you take the Attack action and have advantage on an attack against a target, you can forgo that advantage to make one additional weapon attack against the same target as part of the action. Once per turn.' },
    { id: 'sam-strength-death', name: 'Strength Before Death', level: 18, source: 'Samurai', combat: true,
      desc: 'When damage reduces you to 0 hit points, you can use your reaction to delay falling unconscious and immediately take an extra turn (death saving throw failures still apply during it). Once per long rest.' },
  ],
};
