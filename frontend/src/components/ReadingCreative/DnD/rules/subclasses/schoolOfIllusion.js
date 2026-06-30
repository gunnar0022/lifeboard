export default {
  name: 'School of Illusion',
  className: 'Wizard',
  features: [
    { id: 'illu-savant', name: 'Illusion Savant', level: 2, source: 'School of Illusion',
      desc: 'The gold and time you must spend to copy an illusion spell into your spellbook is halved.' },
    { id: 'illu-improved-minor', name: 'Improved Minor Illusion', level: 2, source: 'School of Illusion', combat: true,
      desc: 'You learn the Minor Illusion cantrip (or another wizard cantrip if you already know it), and it doesn\'t count against your cantrips known. When you cast Minor Illusion, you can create both a sound and an image with a single casting.' },
    { id: 'illu-malleable', name: 'Malleable Illusions', level: 6, source: 'School of Illusion', combat: true,
      desc: 'When you cast an illusion spell with a duration of 1 minute or longer, you can use your action to change the nature of that illusion (within the spell\'s normal parameters), provided you can see it.' },
    { id: 'illu-illusory-self', name: 'Illusory Self', level: 10, source: 'School of Illusion', combat: true,
      desc: 'When a creature makes an attack roll against you, you can use your reaction to interpose an illusory duplicate — the attack automatically misses, then the illusion dissipates. Once used, you can\'t use it again until you finish a short or long rest. Track it on the Combat tab.' },
    { id: 'illu-illusory-reality', name: 'Illusory Reality', level: 14, source: 'School of Illusion', combat: true,
      desc: 'When you cast an illusion spell of 1st level or higher, you can use a bonus action on your turn to make one inanimate, nonmagical object that is part of the illusion real for 1 minute. The object can\'t deal damage or directly harm anyone. Track the made-real object on the Combat tab.' },
  ],
};
