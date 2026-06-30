export default {
  name: 'School of Conjuration',
  className: 'Wizard',
  features: [
    { id: 'conj-savant', name: 'Conjuration Savant', level: 2, source: 'School of Conjuration',
      desc: 'The gold and time you must spend to copy a conjuration spell into your spellbook is halved.' },
    { id: 'conj-minor', name: 'Minor Conjuration', level: 2, source: 'School of Conjuration', combat: true,
      desc: 'As an action, conjure an inanimate object in your hand or in an unoccupied space within 10 feet — no larger than 3 feet on a side, no heavier than 10 pounds, and in the form of a nonmagical object you have seen. It is visibly magical, shedding dim light out to 5 feet. It disappears after 1 hour, when you use this feature again, or if it takes or deals any damage. Track the conjured object on the Combat tab.' },
    { id: 'conj-benign-transport', name: 'Benign Transportation', level: 6, source: 'School of Conjuration', combat: true,
      desc: 'As an action, teleport up to 30 feet to an unoccupied space you can see, or swap places with a willing Small or Medium creature in range. Once used, you can\'t use it again until you finish a long rest or you cast a conjuration spell of 1st level or higher.' },
    { id: 'conj-focused', name: 'Focused Conjuration', level: 10, source: 'School of Conjuration', combat: true,
      desc: 'While you are concentrating on a conjuration spell, your concentration can\'t be broken as a result of taking damage.' },
    { id: 'conj-durable-summons', name: 'Durable Summons', level: 14, source: 'School of Conjuration', combat: true,
      desc: 'Any creature you summon or create with a conjuration spell has 30 temporary hit points.' },
  ],
};
