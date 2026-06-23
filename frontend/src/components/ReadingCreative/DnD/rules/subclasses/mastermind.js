export default {
  name: 'Mastermind',
  className: 'Rogue',
  features: [
    { id: 'mm-intrigue', name: 'Master of Intrigue', level: 3, source: 'Mastermind',
      desc: "You gain proficiency with the disguise kit, the forgery kit, and one gaming set, and you learn two languages. You can also unerringly mimic the speech patterns and accent of a creature you hear speak for at least 1 minute (in a language you know)." },
    { id: 'mm-tactics', name: 'Master of Tactics', level: 3, source: 'Mastermind', combat: true,
      desc: 'You can use the Help action as a bonus action. When you Help an ally attack a creature, the target can be within 30 feet of you (rather than 5 feet) if it can see or hear you.' },
    { id: 'mm-manipulator', name: 'Insightful Manipulator', level: 9, source: 'Mastermind', combat: true,
      desc: 'After at least 1 minute observing or interacting with a creature outside combat, the DM tells you how it compares to you (equal, superior, or inferior) in two of: Intelligence, Wisdom, Charisma, or class levels. You might also learn a piece of its history or a personality trait.' },
    { id: 'mm-misdirection', name: 'Misdirection', level: 13, source: 'Mastermind', combat: true,
      desc: 'When you are targeted by an attack while a creature within 5 feet of you grants you cover against it, you can use your reaction to have the attack target that creature instead.' },
    { id: 'mm-soul-deceit', name: 'Soul of Deceit', level: 17, source: 'Mastermind', combat: true,
      desc: 'Your thoughts can\'t be read by telepathy or other means unless you allow it, and you can present false thoughts (Charisma (Deception) vs the reader\'s Wisdom (Insight)). Magic that detects lies always shows you as truthful if you choose, and you can\'t be magically compelled to tell the truth.' },
  ],
};
