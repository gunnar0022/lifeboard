export default {
  name: 'Path of the Ancestral Guardian',
  className: 'Barbarian',
  features: [
    { id: 'ag-protectors', name: 'Ancestral Protectors', level: 3, source: 'Path of the Ancestral Guardian',
      desc: 'While raging, the first creature you hit on your turn is marked by ancestral spirits until the start of your next turn. The marked target has disadvantage on any attack roll that isn\'t against you, and when it hits a creature other than you, that creature has resistance to the damage.' },
    { id: 'ag-spirit-shield', name: 'Spirit Shield', level: 6, source: 'Path of the Ancestral Guardian', combat: true,
      desc: 'While raging, if a creature you can see within 30 feet of you takes damage, you can use your reaction to reduce that damage by 2d6 (3d6 at 10th level, 4d6 at 14th level).' },
    { id: 'ag-consult', name: 'Consult the Spirits', level: 10, source: 'Path of the Ancestral Guardian', combat: true,
      desc: 'You can cast Augury or Clairvoyance without a spell slot or material components, using Wisdom as your spellcasting ability. Once you do so, you can\'t use this feature again until you finish a short or long rest.' },
    { id: 'ag-vengeful', name: 'Vengeful Ancestors', level: 14, source: 'Path of the Ancestral Guardian',
      desc: 'When you use Spirit Shield to reduce damage, the attacker takes force damage equal to the amount of damage prevented.' },
  ],
};
