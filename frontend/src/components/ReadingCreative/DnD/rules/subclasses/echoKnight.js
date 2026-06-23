export default {
  name: 'Echo Knight',
  className: 'Fighter',
  features: [
    { id: 'ek-manifest', name: 'Manifest Echo', level: 3, source: 'Echo Knight', combat: true,
      desc: 'Bonus action: manifest a translucent echo of yourself in an unoccupied space within 15 feet. It has AC 14 + your proficiency bonus, 1 hit point, immunity to all conditions, and your saving throw bonuses. It lasts until destroyed, dismissed (bonus action), replaced, or you\'re incapacitated. You can mentally move it up to 30 feet on your turn (no action; destroyed if more than 30 feet from you at end of turn). Attacks you make with the Attack action can originate from your space or the echo\'s; as a bonus action you can swap places with it for 15 feet of movement; and you can make opportunity attacks from its space.' },
    { id: 'ek-unleash', name: 'Unleash Incarnation', level: 3, source: 'Echo Knight', combat: true,
      desc: 'Whenever you take the Attack action, you can make one additional melee attack from the echo\'s position. You can use this a number of times equal to your Constitution modifier (minimum once), regaining all uses on a long rest.' },
    { id: 'ek-avatar', name: 'Echo Avatar', level: 7, source: 'Echo Knight', combat: true,
      desc: 'As an action, see and hear through your echo for up to 10 minutes (you are blinded and deafened meanwhile). While doing so, the echo can be up to 1,000 feet from you without being destroyed.' },
    { id: 'ek-martyr', name: 'Shadow Martyr', level: 10, source: 'Echo Knight', combat: true,
      desc: 'As a reaction before an attack roll against another creature you can see, teleport your echo to within 5 feet of that creature; the attack is made against the echo instead. Once you use this you can\'t again until you finish a short or long rest.' },
    { id: 'ek-reclaim', name: 'Reclaim Potential', level: 15, source: 'Echo Knight', combat: true,
      desc: 'When an echo of yours is destroyed by taking damage, you can gain 2d6 + your Constitution modifier temporary hit points (if you have none already). You can use this a number of times equal to your Constitution modifier (minimum once), regaining all uses on a long rest.' },
    { id: 'ek-legion', name: 'Legion of One', level: 18, source: 'Echo Knight', combat: true,
      desc: 'You can manifest two echoes at once with Manifest Echo (a third destroys the previous two), and anything you can do from one echo\'s position you can do from the other. Also, when you roll initiative with no uses of Unleash Incarnation left, you regain one use.' },
  ],
};
