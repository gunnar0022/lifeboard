export default {
  name: 'College of Lore',
  className: 'Bard',
  features: [
    { id: 'lore-bonus-prof', name: 'Bonus Proficiencies', level: 3, source: 'College of Lore',
      desc: 'You gain proficiency with three skills of your choice.' },
    { id: 'lore-cutting-words', name: 'Cutting Words', level: 3, source: 'College of Lore', combat: true,
      desc: 'When a creature you can see within 60 feet makes an attack roll, an ability check, or a damage roll, you can use your reaction to expend one use of Bardic Inspiration and subtract the rolled die from the creature\'s roll. You can decide after the creature rolls but before the DM declares success/failure or before damage is dealt. A creature is immune if it can\'t hear you or is immune to being charmed.' },
    { id: 'lore-magical-secrets', name: 'Additional Magical Secrets', level: 6, source: 'College of Lore',
      desc: 'You learn two spells of your choice from any class (each a cantrip or a level you can cast). They count as bard spells for you but don\'t count against your number of bard spells known.' },
    { id: 'lore-peerless-skill', name: 'Peerless Skill', level: 14, source: 'College of Lore', combat: true,
      desc: 'When you make an ability check, you can expend one use of Bardic Inspiration, roll the die, and add it to the check. You can do so after rolling the check but before the DM says whether you succeed or fail.' },
  ],
};
