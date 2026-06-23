export default {
  name: 'Cavalier',
  className: 'Fighter',
  features: [
    { id: 'cav-born-saddle', name: 'Born to the Saddle', level: 3, source: 'Cavalier',
      desc: 'You have advantage on saves to avoid falling off your mount, and if you fall and descend no more than 10 feet you can land on your feet (if not incapacitated). Mounting or dismounting costs only 5 feet of movement.' },
    { id: 'cav-unwavering-mark', name: 'Unwavering Mark', level: 3, source: 'Cavalier', combat: true,
      desc: 'When you hit a creature with a melee weapon attack, you can mark it until the end of your next turn. While within 5 feet of you, a marked creature has disadvantage on attack rolls that don\'t target you. If a creature you marked damages anyone but you, on your next turn you can make a special melee attack against it as a bonus action with advantage, dealing extra damage equal to half your fighter level on a hit. You can make this special attack a number of times equal to your Strength modifier (minimum once), regaining all uses on a long rest.' },
    { id: 'cav-warding', name: 'Warding Maneuver', level: 7, source: 'Cavalier', combat: true,
      desc: 'When you or a creature within 5 feet is hit by an attack (and you wield a melee weapon or shield), you can roll 1d8 as a reaction and add it to the target\'s AC against that attack; if it still hits, the target has resistance to its damage. You can use this a number of times equal to your Constitution modifier (minimum once), regaining all uses on a long rest.' },
    { id: 'cav-hold-line', name: 'Hold the Line', level: 10, source: 'Cavalier', combat: true,
      desc: 'Creatures provoke an opportunity attack from you when they move 5 feet or more while in your reach, and if you hit a creature with an opportunity attack its speed is reduced to 0 until the end of the current turn.' },
    { id: 'cav-ferocious', name: 'Ferocious Charger', level: 15, source: 'Cavalier', combat: true,
      desc: 'If you move at least 10 feet in a straight line right before hitting a creature, that target must succeed on a Strength save (DC 8 + your proficiency bonus + your Strength modifier) or be knocked prone. Once per turn.' },
    { id: 'cav-vigilant', name: 'Vigilant Defender', level: 18, source: 'Cavalier', combat: true,
      desc: 'You get a special reaction once on every other creature\'s turn that you can use only to make an opportunity attack, and not on the same turn you use your normal reaction.' },
  ],
};
