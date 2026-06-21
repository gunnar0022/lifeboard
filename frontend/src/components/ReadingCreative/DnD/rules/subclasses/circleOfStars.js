export default {
  name: 'Circle of Stars',
  className: 'Druid',
  features: [
    { id: 'cs-star-map', name: 'Star Map', level: 2, source: 'Circle of Stars',
      desc: 'You craft a star map. You know the Guidance cantrip, and you always have Guiding Bolt prepared. You can cast Guiding Bolt without a spell slot a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
    { id: 'cs-starry-form', name: 'Starry Form', level: 2, source: 'Circle of Stars', combat: true,
      desc: 'As a bonus action, expend a use of Wild Shape to take a starry form (shedding light, 10 min). Choose a constellation each time: Archer (bonus-action ranged attack, 1d8 + WIS radiant), Chalice (healing spells restore extra 1d8 + WIS), or Dragon (treat rolls of 9 or lower as 10 on INT/WIS checks and concentration saves).' },
    { id: 'cs-cosmic-omen', name: 'Cosmic Omen', level: 6, source: 'Circle of Stars', combat: true,
      desc: 'After a long rest, roll a die to determine Weal (even) or Woe (odd). When a creature you can see within 30 feet makes an attack roll, save, or ability check, you can use your reaction to add (Weal) or subtract (Woe) 1d6. Usable a number of times equal to your proficiency bonus per long rest.' },
    { id: 'cs-twinkling', name: 'Twinkling Constellations', level: 10, source: 'Circle of Stars',
      desc: 'The 1d8 of Archer and Chalice becomes 2d8, and the Dragon grants a 20-foot flying speed (hover) while in starry form. You can change your constellation at the start of each of your turns.' },
    { id: 'cs-full-of-stars', name: 'Full of Stars', level: 14, source: 'Circle of Stars',
      desc: 'While in your starry form, you have resistance to bludgeoning, piercing, and slashing damage.' },
  ],
};
