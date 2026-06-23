export default {
  name: 'Arcane Archer',
  className: 'Fighter',
  features: [
    { id: 'aa-lore', name: 'Arcane Archer Lore', level: 3, source: 'Arcane Archer',
      desc: 'You gain proficiency in either the Arcana or the Nature skill, and you learn either the Prestidigitation or Druidcraft cantrip.' },
    { id: 'aa-arcane-shot', name: 'Arcane Shot', level: 3, source: 'Arcane Archer', choice: 'arcane-shots', combat: true,
      desc: 'You learn two Arcane Shot options (and another at 7th, 10th, 15th, and 18th level). Once per turn when you fire an arrow from a shortbow or longbow as part of the Attack action, you can apply one option to it (deciding when the arrow hits, unless the option has no attack roll). You have two uses, regaining them on a short or long rest. Each option improves at 18th level. Arcane Shot save DC = 8 + your proficiency bonus + your Intelligence modifier.' },
    { id: 'aa-magic-arrow', name: 'Magic Arrow', level: 7, source: 'Arcane Archer', combat: true,
      desc: 'Whenever you fire a nonmagical arrow from a shortbow or longbow, you can make it magical for overcoming resistance and immunity to nonmagical attacks and damage. The magic fades right after it hits or misses.' },
    { id: 'aa-curving-shot', name: 'Curving Shot', level: 7, source: 'Arcane Archer', combat: true,
      desc: 'When you make an attack roll with a magic arrow and miss, you can use a bonus action to reroll the attack against a different target within 60 feet of the original.' },
    { id: 'aa-ever-ready', name: 'Ever-Ready Shot', level: 15, source: 'Arcane Archer', combat: true,
      desc: 'When you roll initiative and have no uses of Arcane Shot remaining, you regain one use of it.' },
  ],
};
