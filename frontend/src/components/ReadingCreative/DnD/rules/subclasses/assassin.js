export default {
  name: 'Assassin',
  className: 'Rogue',
  features: [
    { id: 'as-bonus-prof', name: 'Bonus Proficiencies', level: 3, source: 'Assassin',
      desc: 'You gain proficiency with the disguise kit and the poisoner\'s kit.' },
    { id: 'as-assassinate', name: 'Assassinate', level: 3, source: 'Assassin',
      desc: 'You have advantage on attack rolls against any creature that hasn\'t taken a turn in the combat yet. In addition, any hit you score against a creature that is surprised is a critical hit.' },
    { id: 'as-infiltration', name: 'Infiltration Expertise', level: 9, source: 'Assassin',
      desc: 'You can unfailingly create false identities for yourself. You must spend seven days and 25 gp to establish the history, profession, and affiliations for an identity. You can\'t establish an identity that belongs to someone else. Thereafter, if you adopt the new identity as a disguise, other creatures believe you to be that person until given an obvious reason not to.' },
    { id: 'as-impostor', name: 'Impostor', level: 13, source: 'Assassin',
      desc: 'You can unerringly mimic another person\'s speech, writing, and behavior. You must spend at least three hours studying these three components — listening to speech, examining handwriting, and observing mannerisms. Your ruse is indiscernible to the casual observer; if a wary creature suspects something is amiss, you have advantage on any Charisma (Deception) check you make to avoid detection.' },
    { id: 'as-death-strike', name: 'Death Strike', level: 17, source: 'Assassin',
      desc: 'When you attack and hit a creature that is surprised, it must make a Constitution saving throw (DC = 8 + your Dexterity modifier + your proficiency bonus). On a failed save, double the damage of your attack against the creature.' },
  ],
};
