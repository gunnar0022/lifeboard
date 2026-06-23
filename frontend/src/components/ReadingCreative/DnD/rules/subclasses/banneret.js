export default {
  name: 'Banneret (Purple Dragon Knight)',
  className: 'Fighter',
  features: [
    { id: 'ban-rallying-cry', name: 'Rallying Cry', level: 3, source: 'Banneret', combat: true,
      desc: 'When you use Second Wind, you can also choose up to three allies within 60 feet that can see or hear you; each regains hit points equal to your fighter level.' },
    { id: 'ban-royal-envoy', name: 'Royal Envoy', level: 7, source: 'Banneret',
      desc: 'You gain proficiency in Persuasion (or another social skill if already proficient), and your proficiency bonus is doubled for any ability check you make using Persuasion.' },
    { id: 'ban-inspiring-surge', name: 'Inspiring Surge', level: 10, source: 'Banneret', combat: true,
      desc: 'When you use Action Surge, you can choose one ally within 60 feet that can see or hear you; it can use its reaction to make one melee or ranged weapon attack. At 18th level, you can choose two allies instead of one.' },
    { id: 'ban-bulwark', name: 'Bulwark', level: 15, source: 'Banneret', combat: true,
      desc: 'When you use Indomitable to reroll an Intelligence, Wisdom, or Charisma save (and aren\'t incapacitated), you can choose one ally within 60 feet that also failed its save against the same effect; if it can see or hear you, it rerolls and must use the new roll.' },
  ],
};
