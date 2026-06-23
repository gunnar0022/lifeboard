export default {
  name: 'Eldritch Knight',
  className: 'Fighter',
  features: [
    { id: 'ek-spellcasting', name: 'Spellcasting', level: 3, source: 'Eldritch Knight', combat: true,
      desc: 'You augment your martial prowess with wizard magic. You learn two wizard cantrips (a third at 10th) and a growing list of wizard spells — mostly abjuration and evocation. Intelligence is your spellcasting ability (spell save DC = 8 + proficiency bonus + INT; attack = proficiency bonus + INT). Manage your slots, cantrips, and known spells on the Spells tab.' },
    { id: 'ek-weapon-bond', name: 'Weapon Bond', level: 3, source: 'Eldritch Knight', combat: true,
      desc: 'Through an hour-long ritual (possible on a short rest), you bond with a weapon. You can\'t be disarmed of a bonded weapon unless incapacitated, and you can summon it to your hand as a bonus action if it\'s on the same plane. You can have up to two bonded weapons but summon only one at a time.' },
    { id: 'ek-war-magic', name: 'War Magic', level: 7, source: 'Eldritch Knight', combat: true,
      desc: 'When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.' },
    { id: 'ek-eldritch-strike', name: 'Eldritch Strike', level: 10, source: 'Eldritch Knight', combat: true,
      desc: 'When you hit a creature with a weapon attack, that creature has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.' },
    { id: 'ek-arcane-charge', name: 'Arcane Charge', level: 15, source: 'Eldritch Knight', combat: true,
      desc: 'When you use Action Surge, you can teleport up to 30 feet to an unoccupied space you can see, before or after the additional action.' },
    { id: 'ek-improved-war-magic', name: 'Improved War Magic', level: 18, source: 'Eldritch Knight', combat: true,
      desc: 'When you use your action to cast a spell, you can make one weapon attack as a bonus action.' },
  ],
};
