export default {
  name: 'Circle of the Land',
  className: 'Druid',
  features: [
    { id: 'land-cantrip', name: 'Bonus Cantrip', level: 2, source: 'Circle of the Land',
      desc: 'You learn one additional druid cantrip of your choice. It doesn\'t count against your number of cantrips known.' },
    { id: 'land-recovery', name: 'Natural Recovery', level: 2, source: 'Circle of the Land', combat: true,
      desc: 'During a short rest, recover expended spell slots with a combined level up to half your druid level (rounded up), none of 6th level or higher. Once you do this, you can\'t again until you finish a long rest.' },
    { id: 'land-spells', name: 'Circle Spells', level: 3, source: 'Circle of the Land', combat: true,
      desc: 'Choose your land — arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark. At 3rd, 5th, 7th, and 9th level you gain its circle spells, which are always prepared and don\'t count against your prepared spells (and count as druid spells for you).' },
    { id: 'land-stride', name: "Land's Stride", level: 6, source: 'Circle of the Land',
      desc: 'Moving through nonmagical difficult terrain costs no extra movement, and you can pass through nonmagical plants without being slowed or harmed by them. You have advantage on saves against plants that magically impede movement (such as Entangle).' },
    { id: 'land-ward', name: "Nature's Ward", level: 10, source: 'Circle of the Land',
      desc: 'You can\'t be charmed or frightened by elementals or fey, and you are immune to poison and disease.' },
    { id: 'land-sanctuary', name: "Nature's Sanctuary", level: 14, source: 'Circle of the Land', combat: true,
      desc: 'When a beast or plant creature attacks you, it must make a Wisdom save against your druid spell save DC or choose a different target (or the attack misses). On a success, it is immune for 24 hours. The creature knows of this effect before attacking.' },
  ],
};
