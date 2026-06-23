export default {
  name: 'Inquisitive',
  className: 'Rogue',
  features: [
    { id: 'inq-ear', name: 'Ear for Deceit', level: 3, source: 'Inquisitive',
      desc: 'Whenever you make a Wisdom (Insight) check to determine whether a creature is lying, treat a d20 roll of 7 or lower as an 8.' },
    { id: 'inq-eye-detail', name: 'Eye for Detail', level: 3, source: 'Inquisitive', combat: true,
      desc: 'As a bonus action, make a Wisdom (Perception) check to spot a hidden creature or object, or an Intelligence (Investigation) check to uncover or decipher clues.' },
    { id: 'inq-insightful', name: 'Insightful Fighting', level: 3, source: 'Inquisitive', combat: true,
      desc: 'As a bonus action, make a Wisdom (Insight) check contested by a creature\'s Charisma (Deception) check. On a success, you can use Sneak Attack against that target even without advantage (but not with disadvantage). This lasts 1 minute or until you use it on a different target.' },
    { id: 'inq-steady', name: 'Steady Eye', level: 9, source: 'Inquisitive', combat: true,
      desc: 'You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks if you move no more than half your speed on the same turn.' },
    { id: 'inq-unerring', name: 'Unerring Eye', level: 13, source: 'Inquisitive', combat: true,
      desc: 'As an action, sense illusions, shapechangers not in their true form, and other sensory deceptions within 30 feet (unless blinded or deafened) — you learn that an effect is deceiving you, but not what it hides. You can use this a number of times equal to your Wisdom modifier (minimum once), regaining all uses on a long rest.' },
    { id: 'inq-weakness', name: 'Eye for Weakness', level: 17, source: 'Inquisitive', combat: true,
      desc: 'While your Insightful Fighting feature applies to a creature, your Sneak Attack damage against that creature increases by 3d6.' },
  ],
};
