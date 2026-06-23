export default {
  name: 'Circle of the Shepherd',
  className: 'Druid',
  features: [
    { id: 'shep-speech', name: 'Speech of the Woods', level: 2, source: 'Circle of the Shepherd',
      desc: 'You learn to speak, read, and write Sylvan, and beasts can understand your speech and you can decipher their noises and motions. A friendly beast can relay what it has recently seen or heard.' },
    { id: 'shep-totem', name: 'Spirit Totem', level: 2, source: 'Circle of the Shepherd', combat: true,
      desc: 'As a bonus action, summon an incorporeal spirit to a point within 60 feet, creating a 30-foot-radius aura for 1 minute (move it up to 60 feet as a bonus action). Bear: creatures of your choice in the aura gain 5 + your druid level temp HP, and you and allies have advantage on Strength checks and saves in it. Hawk: as a reaction, grant advantage to an attack roll against a target in the aura, and you and allies have advantage on Perception in it. Unicorn: you and allies have advantage on ability checks to detect creatures in the aura, and when you cast a healing spell with a slot, each chosen creature in the aura also regains hit points equal to your druid level. Once you use this, you can\'t again until you finish a short or long rest.' },
    { id: 'shep-mighty', name: 'Mighty Summoner', level: 6, source: 'Circle of the Shepherd', combat: true,
      desc: 'Beasts and fey you summon or create with a spell gain 2 extra hit points per Hit Die, and their natural weapons count as magical for overcoming resistance and immunity to nonmagical attacks and damage.' },
    { id: 'shep-guardian', name: 'Guardian Spirit', level: 10, source: 'Circle of the Shepherd', combat: true,
      desc: 'When a beast or fey you summoned or created with a spell ends its turn in your Spirit Totem aura, it regains hit points equal to half your druid level.' },
    { id: 'shep-faithful', name: 'Faithful Summons', level: 14, source: 'Circle of the Shepherd', combat: true,
      desc: 'If you are reduced to 0 hit points or incapacitated against your will, you immediately gain the benefits of Conjure Animals as if cast with a 9th-level slot, summoning four beasts of CR 2 or lower within 20 feet that protect you for 1 hour (no concentration). Once you use this, you can\'t again until you finish a long rest.' },
  ],
};
