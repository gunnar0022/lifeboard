export default {
  name: 'The Archfey',
  className: 'Warlock',
  features: [
    { id: 'af-fey-presence', name: 'Fey Presence', level: 1, source: 'The Archfey', combat: true,
      desc: 'Action: each creature in a 10-foot cube from you makes a Wisdom save (your warlock save DC) or is charmed or frightened (your choice) until the end of your next turn. Once per short or long rest.' },
    { id: 'af-misty-escape', name: 'Misty Escape', level: 6, source: 'The Archfey', combat: true,
      desc: 'Reaction when you take damage: turn invisible and teleport up to 60 feet to a space you can see. Invisible until the start of your next turn or until you attack or cast a spell. Once per short or long rest.' },
    { id: 'af-beguiling-defenses', name: 'Beguiling Defenses', level: 10, source: 'The Archfey',
      desc: 'You are immune to being charmed. When a creature tries to charm you, you can use your reaction to force a Wisdom save or charm it for 1 minute (ending if it takes damage).' },
    { id: 'af-dark-delirium', name: 'Dark Delirium', level: 14, source: 'The Archfey', combat: true,
      desc: 'Action: a creature within 60 feet makes a Wisdom save or is charmed or frightened by you for 1 minute (as if you concentrate), trapped in an illusory realm; ends early if it takes damage. Once per short or long rest.' },
  ],
};
