export default {
  name: 'College of Glamour',
  className: 'Bard',
  features: [
    { id: 'glam-mantle-inspiration', name: 'Mantle of Inspiration', level: 3, source: 'College of Glamour', combat: true,
      desc: 'As a bonus action, expend one use of Bardic Inspiration to take on a wondrous appearance. Choose up to your Charisma modifier (minimum one) creatures you can see who can see you within 60 feet. Each gains 5 temporary hit points (rising to 8 at 5th, 11 at 10th, and 14 at 15th level), and can immediately use its reaction to move up to its speed without provoking opportunity attacks.' },
    { id: 'glam-enthralling', name: 'Enthralling Performance', level: 3, source: 'College of Glamour', combat: true,
      desc: 'After performing for at least 1 minute, choose up to your Charisma modifier (minimum one) humanoids within 60 feet who watched all of it. Each must succeed on a Wisdom save against your spell save DC or be charmed by you for 1 hour (the charm ends if it takes damage, you attack it, or it sees you harm its allies). Once you use this you can\'t use it again until you finish a short or long rest.' },
    { id: 'glam-mantle-majesty', name: 'Mantle of Majesty', level: 6, source: 'College of Glamour', combat: true,
      desc: 'As a bonus action, cast Command without a spell slot and take on unearthly beauty for 1 minute (as if concentrating). For the duration you can cast Command as a bonus action each turn without a slot, and any creature charmed by you automatically fails its save against it. Once you use this you can\'t use it again until you finish a long rest.' },
    { id: 'glam-unbreakable', name: 'Unbreakable Majesty', level: 14, source: 'College of Glamour', combat: true,
      desc: 'As a bonus action, assume a majestic presence for 1 minute or until incapacitated. The first time a creature tries to attack you on each of its turns, it must make a Charisma save against your spell save DC; on a failure it can\'t attack you this turn (and must choose a new target or waste the attack), and on a success it has disadvantage on saves against your spells on your next turn. Once you assume this presence you can\'t do so again until you finish a short or long rest.' },
  ],
};
