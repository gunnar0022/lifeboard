export default {
  name: 'Circle of Wildfire',
  className: 'Druid',
  features: [
    { id: 'wf-circle-spells', name: 'Circle Spells', level: 2, source: 'Circle of Wildfire', combat: true,
      desc: 'Your bond with a wildfire spirit grants always-prepared spells at certain levels (they don\'t count against your prepared spells and count as druid spells for you): 2nd — Burning Hands, Cure Wounds; 3rd — Flaming Sphere, Scorching Ray; 5th — Plant Growth, Revivify; 7th — Aura of Life, Fire Shield; 9th — Flame Strike, Mass Cure Wounds.' },
    { id: 'wf-summon', name: 'Summon Wildfire Spirit', level: 2, source: 'Circle of Wildfire', combat: true,
      desc: 'As an action, expend one use of Wild Shape to summon your wildfire spirit (instead of assuming a beast form) to an unoccupied space within 30 feet. Each creature within 10 feet of it when it appears (other than you) must succeed on a Dexterity save against your spell save DC or take 2d6 fire damage. The spirit (AC 13, HP 5 + five times your druid level, fly 30) acts on your initiative right after you, taking the Dodge action unless you spend a bonus action to command another. Its Flame Seed attack uses your spell attack modifier for 1d6 + PB fire at 60 ft; Fiery Teleportation moves it and willing allies 15 feet (and burns creatures it leaves behind for 1d6 + PB fire). It lasts 1 hour, until reduced to 0 HP, resummoned, or you die.' },
    { id: 'wf-enhanced-bond', name: 'Enhanced Bond', level: 6, source: 'Circle of Wildfire', combat: true,
      desc: 'While your wildfire spirit is summoned, whenever you cast a spell that deals fire damage or restores hit points, roll a d8 and add it as a bonus to one damage or healing roll of that spell. Also, a spell with a range other than self can originate from you or from your wildfire spirit.' },
    { id: 'wf-cauterizing', name: 'Cauterizing Flames', level: 10, source: 'Circle of Wildfire', combat: true,
      desc: 'When a Small or larger creature dies within 30 feet of you or your spirit, a spectral flame lingers in its space for 1 minute. When a creature you can see enters that space, you can use your reaction to extinguish the flame and either heal it or deal fire damage to it equal to 2d10 + your Wisdom modifier. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
    { id: 'wf-blazing-revival', name: 'Blazing Revival', level: 14, source: 'Circle of Wildfire', combat: true,
      desc: 'If your spirit is within 120 feet when you are reduced to 0 hit points and fall unconscious, you can cause the spirit to drop to 0 hit points; you then regain half your hit points and immediately rise to your feet. Once you use this, you can\'t again until you finish a long rest.' },
  ],
};
