export default {
  name: 'Divine Soul',
  className: 'Sorcerer',
  features: [
    { id: 'divine-magic', name: 'Divine Magic', level: 1, source: 'Divine Soul', combat: true,
      desc: 'When you learn a sorcerer cantrip or spell, you can choose it from the cleric spell list or the sorcerer list (it becomes a sorcerer spell for you). Choose an affinity — good, evil, law, chaos, or neutrality — and gain an extra always-known spell: Good = Cure Wounds, Evil = Inflict Wounds, Law = Bless, Chaos = Bane, Neutrality = Protection from Evil and Good.' },
    { id: 'divine-favored', name: 'Favored by the Gods', level: 1, source: 'Divine Soul', combat: true,
      desc: 'If you fail a saving throw or miss with an attack roll, you can roll 2d4 and add it to the total, possibly changing the outcome. Once you use this, you can\'t again until you finish a short or long rest.' },
    { id: 'divine-empowered', name: 'Empowered Healing', level: 6, source: 'Divine Soul', combat: true,
      desc: 'When you or an ally within 5 feet rolls dice to determine the hit points a spell restores, you can spend 1 sorcery point to reroll any number of those dice once (provided you aren\'t incapacitated). Once per turn.' },
    { id: 'divine-angelic', name: 'Angelic Form', level: 14, source: 'Divine Soul', combat: true,
      desc: 'As a bonus action, manifest spectral wings and gain a flying speed of 30 feet until you\'re incapacitated, die, or dismiss them (bonus action). Their look matches your affinity: eagle (good/law), bat (evil/chaos), or dragonfly (neutrality).' },
    { id: 'divine-recovery', name: 'Unearthly Recovery', level: 18, source: 'Divine Soul', combat: true,
      desc: 'As a bonus action when you have fewer than half your hit points, regain hit points equal to half your hit point maximum. Once you use this, you can\'t again until you finish a long rest.' },
  ],
};
