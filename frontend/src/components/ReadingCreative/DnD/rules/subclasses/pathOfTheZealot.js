export default {
  name: 'Path of the Zealot',
  className: 'Barbarian',
  features: [
    { id: 'zealot-fury', name: 'Divine Fury', level: 3, source: 'Path of the Zealot', combat: true,
      desc: 'While raging, the first creature you hit on each of your turns with a weapon attack takes extra damage equal to 1d6 + half your barbarian level. The extra damage is necrotic or radiant; you choose the type when you gain this feature.' },
    { id: 'zealot-warrior', name: 'Warrior of the Gods', level: 3, source: 'Path of the Zealot',
      desc: 'Your soul is marked for endless battle. If a spell (such as Raise Dead) has the sole effect of restoring you to life — but not as undeath — the caster needs no material components to cast it on you.' },
    { id: 'zealot-focus', name: 'Fanatical Focus', level: 6, source: 'Path of the Zealot', combat: true,
      desc: 'If you fail a saving throw while raging, you can reroll it and must use the new roll. You can use this only once per rage.' },
    { id: 'zealot-presence', name: 'Zealous Presence', level: 10, source: 'Path of the Zealot', combat: true,
      desc: 'As a bonus action, unleash a divine battle cry. Up to ten other creatures of your choice within 60 feet that can hear you gain advantage on attack rolls and saving throws until the start of your next turn. Once you use this, you can\'t use it again until you finish a long rest.' },
    { id: 'zealot-beyond-death', name: 'Rage Beyond Death', level: 14, source: 'Path of the Zealot', combat: true,
      desc: 'While raging, dropping to 0 hit points doesn\'t knock you unconscious. You still make death saving throws and suffer the effects of taking damage at 0 HP, but if you would die from failed death saves you don\'t die until your rage ends — and then only if you are still at 0 hit points.' },
  ],
};
