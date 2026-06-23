export default {
  name: 'Path of the Berserker',
  className: 'Barbarian',
  features: [
    { id: 'brk-frenzy', name: 'Frenzy', level: 3, source: 'Path of the Berserker', combat: true,
      desc: 'When you choose this path at 3rd level, you can go into a frenzy when you rage. If you do so, for the duration of your rage you can make a single melee weapon attack as a bonus action on each of your turns after this one. When your rage ends, you suffer one level of exhaustion.' },
    { id: 'brk-mindless-rage', name: 'Mindless Rage', level: 6, source: 'Path of the Berserker',
      desc: "Beginning at 6th level, you can't be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage." },
    { id: 'brk-intimidating-presence', name: 'Intimidating Presence', level: 10, source: 'Path of the Berserker', combat: true,
      desc: 'Beginning at 10th level, you can use your action to frighten someone with your menacing presence. Choose one creature you can see within 30 feet of you. If the creature can see or hear you, it must succeed on a Wisdom saving throw (DC equal to 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn. On subsequent turns, you can use your action to extend the duration of this effect on the frightened creature until the end of your next turn. This effect ends if the creature ends its turn out of line of sight or more than 60 feet away from you. If the creature succeeds on its saving throw, you can\'t use this feature on that creature again for 24 hours.' },
    { id: 'brk-retaliation', name: 'Retaliation', level: 14, source: 'Path of the Berserker', combat: true,
      desc: 'Starting at 14th level, when you take damage from a creature that is within 5 feet of you, you can use your reaction to make a melee weapon attack against that creature.' },
  ],
};
