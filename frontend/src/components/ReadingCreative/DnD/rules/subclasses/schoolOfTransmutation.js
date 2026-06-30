export default {
  name: 'School of Transmutation',
  className: 'Wizard',
  features: [
    { id: 'trans-savant', name: 'Transmutation Savant', level: 2, source: 'School of Transmutation',
      desc: 'The gold and time you must spend to copy a transmutation spell into your spellbook is halved.' },
    { id: 'trans-minor-alchemy', name: 'Minor Alchemy', level: 2, source: 'School of Transmutation', combat: true,
      desc: 'Transform one nonmagical object made entirely of wood, stone (not gemstone), iron, copper, or silver into another of those materials — up to 1 cubic foot per 10 minutes of work. It reverts after 1 hour or when your concentration ends.' },
    { id: 'trans-stone', name: "Transmuter's Stone", level: 6, source: 'School of Transmutation', combat: true,
      desc: 'Spend 8 hours to create a transmuter\'s stone storing one benefit (yours or a creature holding it): darkvision 60 ft; +10 ft speed while unencumbered; proficiency in Constitution saves; or resistance to acid, cold, fire, lightning, or thunder. Each time you cast a transmutation spell of 1st level or higher you can change the benefit (if the stone is on you). Making a new stone ends the old one. Configure it on the Combat tab.' },
    { id: 'trans-shapechanger', name: 'Shapechanger', level: 10, source: 'School of Transmutation', combat: true,
      desc: 'You add Polymorph to your spellbook and can cast it without a slot to turn only yourself into a beast of CR 1 or lower. Once you do, you can\'t again until a short or long rest (you can still cast it normally with a slot). Track the free use on the Combat tab.' },
    { id: 'trans-master', name: 'Master Transmuter', level: 14, source: 'School of Transmutation', combat: true,
      desc: 'As an action, consume your transmuter\'s stone for one effect, destroying it until your next long rest: Major Transformation (transmute an object ≤5-ft cube over 10 minutes); Panacea (end all curses, diseases, and poisons on a touched creature and restore all its HP); Restore Life (cast Raise Dead without a slot); or Restore Youth (reduce a willing creature\'s apparent age by 3d10 years, min 13). Trigger it on the Combat tab.' },
  ],
};
