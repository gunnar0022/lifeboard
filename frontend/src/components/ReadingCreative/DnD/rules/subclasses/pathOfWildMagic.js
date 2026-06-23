export default {
  name: 'Path of Wild Magic',
  className: 'Barbarian',
  features: [
    { id: 'wild-awareness', name: 'Magic Awareness', level: 3, source: 'Path of Wild Magic', combat: true,
      desc: 'As an action, open your awareness to concentrated magic. Until the end of your next turn you know the location of any spell or magic item within 60 feet that isn\'t behind total cover, and you learn the school of any spell you sense. You can use this a number of times equal to your proficiency bonus, regaining all expended uses on a long rest.' },
    { id: 'wild-surge', name: 'Wild Surge', level: 3, source: 'Path of Wild Magic', combat: true,
      desc: 'When you enter your rage, roll on the Wild Magic table to determine the magical effect produced. If an effect requires a saving throw, the DC equals 8 + your proficiency bonus + your Constitution modifier.' },
    { id: 'wild-bolstering', name: 'Bolstering Magic', level: 6, source: 'Path of Wild Magic', combat: true,
      desc: 'As an action, touch one creature (which can be yourself) and grant one of: for 10 minutes the creature adds a d3 to its attack rolls and ability checks; or roll a d3 and the creature regains one expended spell slot of that level or lower (once per creature until it finishes a long rest). You can use this a number of times equal to your proficiency bonus, regaining all expended uses on a long rest.' },
    { id: 'wild-backlash', name: 'Unstable Backlash', level: 10, source: 'Path of Wild Magic', combat: true,
      desc: 'When you are imperiled during your rage, immediately after you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and produce that effect, replacing your current Wild Magic effect.' },
    { id: 'wild-controlled', name: 'Controlled Surge', level: 14, source: 'Path of Wild Magic', combat: true,
      desc: 'Whenever you roll on the Wild Magic table, roll the die twice and choose which effect to unleash. If both dice show the same number, ignore it and choose any effect on the table.' },
  ],
};
