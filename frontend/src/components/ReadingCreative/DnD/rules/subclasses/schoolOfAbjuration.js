export default {
  name: 'School of Abjuration',
  className: 'Wizard',
  features: [
    { id: 'abj-savant', name: 'Abjuration Savant', level: 2, source: 'School of Abjuration',
      desc: 'The gold and time you must spend to copy an abjuration spell into your spellbook is halved.' },
    { id: 'abj-arcane-ward', name: 'Arcane Ward', level: 2, source: 'School of Abjuration', combat: true,
      desc: 'When you cast an abjuration spell of 1st level or higher, you can create a magical ward on yourself that lasts until you finish a long rest. The ward has hit points equal to twice your wizard level + your Intelligence modifier. Damage you take is absorbed by the ward first; overflow hits you. While at 0 HP the ward can\'t absorb but persists — casting an abjuration spell of 1st level or higher restores it by twice the spell\'s level. Once created, you can\'t create it again until you finish a long rest. Track the ward on the Combat tab.' },
    { id: 'abj-projected-ward', name: 'Projected Ward', level: 6, source: 'School of Abjuration', combat: true,
      desc: 'When a creature you can see within 30 feet takes damage, you can use your reaction to have your Arcane Ward absorb that damage instead. Overflow beyond the ward\'s remaining HP is taken by the warded creature.' },
    { id: 'abj-improved', name: 'Improved Abjuration', level: 10, source: 'School of Abjuration', combat: true,
      desc: 'When you cast an abjuration spell that requires an ability check as part of casting it (as in Counterspell and Dispel Magic), you add your proficiency bonus to that ability check.' },
    { id: 'abj-spell-resistance', name: 'Spell Resistance', level: 14, source: 'School of Abjuration', combat: true,
      desc: 'You have advantage on saving throws against spells, and you have resistance against the damage of spells.' },
  ],
};
