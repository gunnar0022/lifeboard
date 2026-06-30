export default {
  name: 'School of Divination',
  className: 'Wizard',
  features: [
    { id: 'div-savant', name: 'Divination Savant', level: 2, source: 'School of Divination',
      desc: 'The gold and time you must spend to copy a divination spell into your spellbook is halved.' },
    { id: 'div-portent', name: 'Portent', level: 2, source: 'School of Divination', combat: true,
      desc: 'When you finish a long rest, roll two d20s and record them. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these foretelling rolls — chosen before the roll, once per turn. Each foretelling roll is used only once, and unused rolls are lost on your next long rest. Track your foretelling dice on the Combat tab.' },
    { id: 'div-expert', name: 'Expert Divination', level: 6, source: 'School of Divination', combat: true,
      desc: 'When you cast a divination spell of 2nd level or higher using a spell slot, you regain one expended spell slot. The regained slot must be of a level lower than the spell you cast and no higher than 5th level.' },
    { id: 'div-third-eye', name: 'The Third Eye', level: 10, source: 'School of Divination', combat: true,
      desc: 'As an action, choose one benefit that lasts until you are incapacitated or take a short or long rest: Darkvision 60 ft; Ethereal Sight 60 ft; Greater Comprehension (read any language); or See Invisibility within 10 ft. You can\'t use this again until you finish a short or long rest. Track it on the Combat tab.' },
    { id: 'div-greater-portent', name: 'Greater Portent', level: 14, source: 'School of Divination', combat: true,
      desc: 'You roll three d20s for your Portent feature, rather than two.' },
  ],
};
