export default {
  name: 'Clockwork Soul',
  className: 'Sorcerer',
  features: [
    { id: 'clock-magic', name: 'Clockwork Magic', level: 1, source: 'Clockwork Soul', combat: true,
      desc: 'You gain always-known clockwork spells (they don\'t count against your spells known): 1st — Alarm, Protection from Evil and Good; 3rd — Aid, Lesser Restoration; 5th — Dispel Magic, Protection from Energy; 7th — Freedom of Movement, Summon Construct; 9th — Greater Restoration, Wall of Force. When you gain a sorcerer level you may swap one for an abjuration or transmutation spell from the sorcerer, warlock, or wizard list. Choose how your connection to order manifests as you cast.' },
    { id: 'clock-restore', name: 'Restore Balance', level: 1, source: 'Clockwork Soul', combat: true,
      desc: 'When a creature within 60 feet is about to roll a d20 with advantage or disadvantage, you can use your reaction to prevent that roll from being affected by advantage or disadvantage. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
    { id: 'clock-bastion', name: 'Bastion of Law', level: 6, source: 'Clockwork Soul', combat: true,
      desc: 'As an action, spend 1 to 5 sorcery points to ward yourself or a creature within 30 feet with that many d8s. When the warded creature takes damage, it can expend any number of those dice and reduce the damage by the total rolled. The ward lasts until you finish a long rest or use this feature again.' },
    { id: 'clock-trance', name: 'Trance of Order', level: 14, source: 'Clockwork Soul', combat: true,
      desc: 'As a bonus action, enter a state for 1 minute: attack rolls against you can\'t benefit from advantage, and you can treat a d20 roll of 9 or lower as a 10 on your attacks, ability checks, and saves. Once you use this, you can\'t again until a long rest, unless you spend 5 sorcery points.' },
    { id: 'clock-cavalcade', name: 'Clockwork Cavalcade', level: 18, source: 'Clockwork Soul', combat: true,
      desc: 'As an action, summon spirits of order in a 30-foot cube from you: restore up to 100 hit points divided among creatures of your choice, repair damaged objects entirely in the cube, and end every spell of 6th level or lower on chosen creatures and objects in it. Once you use this, you can\'t again until a long rest, unless you spend 7 sorcery points.' },
  ],
};
