export default {
  name: 'Circle of Dreams',
  className: 'Druid',
  features: [
    { id: 'dream-balm', name: 'Balm of the Summer Court', level: 2, source: 'Circle of Dreams', combat: true,
      desc: 'You have a pool of fey energy: a number of d6s equal to your druid level. As a bonus action, choose an ally within 120 feet and spend up to half your druid level of these dice; roll them and the target regains that many hit points and gains 1 temporary hit point per die spent. You regain the dice on a long rest.' },
    { id: 'dream-hearth', name: 'Hearth of Moonlight and Shadow', level: 6, source: 'Circle of Dreams', combat: true,
      desc: 'During a short or long rest, you can touch a point and create an invisible 30-foot-radius sphere (blocked by total cover). While within it, you and your allies gain a +5 bonus to Dexterity (Stealth) and Wisdom (Perception) checks, and open-flame light inside isn\'t visible outside. It ends when the rest ends or you leave it.' },
    { id: 'dream-paths', name: 'Hidden Paths', level: 10, source: 'Circle of Dreams', combat: true,
      desc: 'As a bonus action, teleport up to 60 feet to an unoccupied space you can see; or, as an action, teleport one willing creature you touch up to 30 feet. You can use this a number of times equal to your Wisdom modifier (minimum once), regaining all uses on a long rest.' },
    { id: 'dream-walker', name: 'Walker in Dreams', level: 14, source: 'Circle of Dreams', combat: true,
      desc: 'When you finish a short rest, you can cast Dream (as the messenger), Scrying, or Teleportation Circle without a slot or material components. The Teleportation Circle opens a portal to the last place you finished a long rest on your current plane (the spell fails, but isn\'t wasted, if you haven\'t). Once you use this, you can\'t again until you finish a long rest.' },
  ],
};
