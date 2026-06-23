export default {
  name: 'Swashbuckler',
  className: 'Rogue',
  features: [
    { id: 'swash-footwork', name: 'Fancy Footwork', level: 3, source: 'Swashbuckler', combat: true,
      desc: 'During your turn, if you make a melee attack against a creature, that creature can\'t make opportunity attacks against you for the rest of your turn.' },
    { id: 'swash-audacity', name: 'Rakish Audacity', level: 3, source: 'Swashbuckler', combat: true,
      desc: 'Add your Charisma modifier to your initiative rolls. You also don\'t need advantage to use Sneak Attack against a creature if you\'re within 5 feet of it, no other creatures are within 5 feet of you, and you don\'t have disadvantage on the roll.' },
    { id: 'swash-panache', name: 'Panache', level: 9, source: 'Swashbuckler', combat: true,
      desc: 'As an action, make a Charisma (Persuasion) check contested by a creature\'s Wisdom (Insight) check (it must hear you and share a language). On a success vs. a hostile creature, it has disadvantage on attacks against anyone but you and can\'t make opportunity attacks against others for 1 minute (ending if a companion harms it or you part by 60+ feet). Against a non-hostile creature, it is charmed as a friendly acquaintance for 1 minute.' },
    { id: 'swash-elegant', name: 'Elegant Maneuver', level: 13, source: 'Swashbuckler', combat: true,
      desc: 'As a bonus action, gain advantage on the next Dexterity (Acrobatics) or Strength (Athletics) check you make during the same turn.' },
    { id: 'swash-master-duelist', name: 'Master Duelist', level: 17, source: 'Swashbuckler', combat: true,
      desc: 'If you miss with an attack roll, you can roll it again with advantage. Once you do so, you can\'t use this feature again until you finish a short or long rest.' },
  ],
};
