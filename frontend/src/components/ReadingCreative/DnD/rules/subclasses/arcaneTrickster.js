export default {
  name: 'Arcane Trickster',
  className: 'Rogue',
  features: [
    { id: 'at-spellcasting', name: 'Spellcasting', level: 3, source: 'Arcane Trickster', combat: true,
      desc: 'You augment your roguery with wizard magic. You learn Mage Hand plus two other wizard cantrips (a fourth at 10th) and a growing list of wizard spells — mostly enchantment and illusion. Intelligence is your spellcasting ability (spell save DC = 8 + proficiency bonus + INT; attack = proficiency bonus + INT). Manage your slots, cantrips, and known spells on the Spells tab.' },
    { id: 'at-legerdemain', name: 'Mage Hand Legerdemain', level: 3, source: 'Arcane Trickster', combat: true,
      desc: 'When you cast Mage Hand you can make the hand invisible, and you can use it to stow or retrieve objects in another creature\'s container and to pick locks and disarm traps at range (Sleight of Hand vs Perception to go unnoticed). You can also control the hand with the bonus action from your Cunning Action.' },
    { id: 'at-magical-ambush', name: 'Magical Ambush', level: 9, source: 'Arcane Trickster', combat: true,
      desc: 'If you are hidden from a creature when you cast a spell on it, the creature has disadvantage on any saving throw it makes against that spell this turn.' },
    { id: 'at-versatile', name: 'Versatile Trickster', level: 13, source: 'Arcane Trickster', combat: true,
      desc: 'As a bonus action, designate a creature within 5 feet of your Mage Hand to gain advantage on attack rolls against it until the end of the turn.' },
    { id: 'at-spell-thief', name: 'Spell Thief', level: 17, source: 'Arcane Trickster', combat: true,
      desc: 'Immediately after a creature casts a spell that targets or includes you, you can use your reaction to force it to make a saving throw with its spellcasting modifier against your spell save DC. On a failure, you negate the spell\'s effect on you and steal the spell (if it\'s 1st level or higher and of a level you can cast) — you know it for 8 hours and the creature can\'t cast it during that time. Once you use this, you can\'t again until you finish a long rest.' },
  ],
};
