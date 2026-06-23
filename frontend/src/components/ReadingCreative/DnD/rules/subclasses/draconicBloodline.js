export default {
  name: 'Draconic Bloodline',
  className: 'Sorcerer',
  features: [
    { id: 'drac-ancestor', name: 'Dragon Ancestor', level: 1, source: 'Draconic Bloodline', combat: true,
      desc: 'Choose a dragon type; its damage type drives your later features. You can speak, read, and write Draconic, and your proficiency bonus is doubled on Charisma checks made when interacting with dragons.' },
    { id: 'drac-resilience', name: 'Draconic Resilience', level: 1, source: 'Draconic Bloodline', combat: true,
      desc: 'Your hit point maximum increases by 1 at 1st level and by 1 again each time you gain a sorcerer level. While you aren\'t wearing armor, your AC equals 13 + your Dexterity modifier.' },
    { id: 'drac-affinity', name: 'Elemental Affinity', level: 6, source: 'Draconic Bloodline', combat: true,
      desc: 'When you cast a spell that deals damage of your draconic ancestry\'s type, add your Charisma modifier to one damage roll of that spell. At the same time, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour.' },
    { id: 'drac-wings', name: 'Dragon Wings', level: 14, source: 'Draconic Bloodline', combat: true,
      desc: 'As a bonus action, sprout dragon wings and gain a flying speed equal to your current speed until you dismiss them (bonus action). You can\'t manifest them in armor unless it accommodates them.' },
    { id: 'drac-presence', name: 'Draconic Presence', level: 18, source: 'Draconic Bloodline', combat: true,
      desc: 'As an action, spend 5 sorcery points to exude an aura of awe or fear (your choice) to 60 feet for 1 minute (concentration). Each hostile creature that starts its turn in the aura must succeed on a Wisdom save or be charmed (awe) or frightened (fear); on a success it is immune for 24 hours.' },
  ],
};
