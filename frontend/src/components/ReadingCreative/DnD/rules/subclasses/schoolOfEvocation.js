export default {
  name: 'School of Evocation',
  className: 'Wizard',
  features: [
    { id: 'evo-savant', name: 'Evocation Savant', level: 2, source: 'School of Evocation',
      desc: 'The gold and time you must spend to copy an evocation spell into your spellbook is halved.' },
    { id: 'evo-sculpt', name: 'Sculpt Spells', level: 2, source: 'School of Evocation', combat: true,
      desc: 'When you cast an evocation spell that affects other creatures you can see, you can choose a number of them equal to 1 + the spell\'s level. The chosen creatures automatically succeed on their saving throws against the spell and take no damage if they would normally take half on a success.' },
    { id: 'evo-potent', name: 'Potent Cantrip', level: 6, source: 'School of Evocation', combat: true,
      desc: 'When a creature succeeds on a saving throw against your cantrip, it still takes half the cantrip\'s damage (if any) but suffers no additional effect.' },
    { id: 'evo-empowered', name: 'Empowered Evocation', level: 10, source: 'School of Evocation', combat: true,
      desc: 'You can add your Intelligence modifier (min +1) to one damage roll of any wizard evocation spell you cast.' },
    { id: 'evo-overchannel', name: 'Overchannel', level: 14, source: 'School of Evocation', combat: true,
      desc: 'When you cast a wizard spell of 1st–5th level that deals damage, you can deal maximum damage with it. The first time per long rest is free; each further use before a long rest deals you escalating necrotic damage per spell level (2d12 the second time, +1d12 each time after) that ignores resistance and immunity. Track the backlash on the Combat tab.' },
  ],
};
