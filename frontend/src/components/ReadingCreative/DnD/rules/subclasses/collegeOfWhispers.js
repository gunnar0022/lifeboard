export default {
  name: 'College of Whispers',
  className: 'Bard',
  features: [
    { id: 'whisp-psychic-blades', name: 'Psychic Blades', level: 3, source: 'College of Whispers', combat: true,
      desc: 'When you hit a creature with a weapon attack, you can expend one use of Bardic Inspiration to deal an extra 2d6 psychic damage to that target (once per round on your turn). The extra damage rises to 3d6 at 5th level, 5d6 at 10th level, and 8d6 at 15th level.' },
    { id: 'whisp-words-of-terror', name: 'Words of Terror', level: 3, source: 'College of Whispers', combat: true,
      desc: 'If you speak with a humanoid alone for at least 1 minute, at the end of the conversation it must succeed on a Wisdom save against your spell save DC or be frightened of you or another creature of your choice for 1 hour (ending if it is attacked or damaged, or sees an ally attacked). On a success it has no hint of the attempt. Once you use this you can\'t again until you finish a short or long rest.' },
    { id: 'whisp-mantle', name: 'Mantle of Whispers', level: 6, source: 'College of Whispers', combat: true,
      desc: 'When a humanoid dies within 30 feet of you, you can use your reaction to capture its shadow. As an action you can spend the shadow to disguise yourself as the dead person (healthy and alive) for 1 hour or until you end it (bonus action), gaining the casual information it would share and a +5 bonus to your Deception check to maintain the ruse. Once you capture a shadow you can\'t do so again until you finish a short or long rest.' },
    { id: 'whisp-shadow-lore', name: 'Shadow Lore', level: 14, source: 'College of Whispers', combat: true,
      desc: 'As an action, whisper a phrase only one creature within 30 feet can hear. It must make a Wisdom save against your spell save DC (auto-succeeds if it can\'t hear or share a language). On a failure it is charmed for 8 hours (or until you or your allies attack or damage it), convinced you know its deepest secret, obeying your commands short of risking its life. Once you use this you can\'t again until you finish a long rest.' },
  ],
};
