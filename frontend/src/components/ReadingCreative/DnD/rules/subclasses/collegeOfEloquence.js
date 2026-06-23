export default {
  name: 'College of Eloquence',
  className: 'Bard',
  features: [
    { id: 'eloq-silver-tongue', name: 'Silver Tongue', level: 3, source: 'College of Eloquence',
      desc: 'You are a master at saying the right thing. When you make a Charisma (Persuasion) or Charisma (Deception) check, you can treat a d20 roll of 9 or lower as a 10.' },
    { id: 'eloq-unsettling-words', name: 'Unsettling Words', level: 3, source: 'College of Eloquence', combat: true,
      desc: 'As a bonus action, expend one use of Bardic Inspiration and choose a creature you can see within 60 feet. Roll the Bardic Inspiration die; the creature must subtract the number rolled from the next saving throw it makes before the start of your next turn.' },
    { id: 'eloq-unfailing', name: 'Unfailing Inspiration', level: 6, source: 'College of Eloquence',
      desc: 'When a creature adds one of your Bardic Inspiration dice to an ability check, attack roll, or saving throw and the roll fails, the creature can keep the Bardic Inspiration die.' },
    { id: 'eloq-universal-speech', name: 'Universal Speech', level: 6, source: 'College of Eloquence', combat: true,
      desc: 'As an action, choose up to your Charisma modifier (minimum one) creatures within 60 feet; they can magically understand you regardless of the language you speak for 1 hour. Once you use this you can\'t use it again until you finish a long rest, unless you expend a spell slot.' },
    { id: 'eloq-infectious', name: 'Infectious Inspiration', level: 14, source: 'College of Eloquence', combat: true,
      desc: 'When a creature within 60 feet adds one of your Bardic Inspiration dice to a roll and succeeds, you can use your reaction to give a different creature that can hear you within 60 feet a Bardic Inspiration die without expending a use. You can do this a number of times equal to your Charisma modifier (minimum once), regaining all uses on a long rest.' },
  ],
};
