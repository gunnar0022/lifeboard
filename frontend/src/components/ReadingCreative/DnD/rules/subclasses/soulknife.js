export default {
  name: 'Soulknife',
  className: 'Rogue',
  features: [
    { id: 'sk-psionic-power', name: 'Psionic Power', level: 3, source: 'Soulknife', combat: true,
      desc: 'You have Psionic Energy dice (d6s) equal to twice your proficiency bonus, regaining all of them on a long rest; as a bonus action you can regain one expended die (once per short or long rest). The die grows at 5th (d8), 11th (d10), and 17th (d12). Psi-Bolstered Knack: when you fail an ability check with a proficient skill or tool, roll a die and add it (expended only if it succeeds). Psychic Whispers: as an action, link up to your proficiency bonus in creatures for a number of hours equal to a die roll (the first use after each long rest doesn\'t expend the die).' },
    { id: 'sk-psychic-blades', name: 'Psychic Blades', level: 3, source: 'Soulknife', combat: true,
      desc: 'When you take the Attack action, you can manifest a psychic blade (finesse, thrown, range 60 ft) dealing 1d6 + your ability modifier psychic damage; it vanishes after the attack. You can then make a bonus-action attack with a second blade (1d4 instead of 1d6) if your other hand is free.' },
    { id: 'sk-soul-blades', name: 'Soul Blades', level: 9, source: 'Soulknife', combat: true,
      desc: 'Homing Strikes: when you miss an attack roll with your Psychic Blades, roll a Psionic Energy die and add it (expended if it hits). Psychic Teleportation: as a bonus action, expend and roll a die, throw a blade at an unoccupied space up to 10 × the roll feet away, and teleport there.' },
    { id: 'sk-psychic-veil', name: 'Psychic Veil', level: 13, source: 'Soulknife', combat: true,
      desc: 'As an action, become invisible (with your gear) for 1 hour or until you dismiss it; it ends early when you deal damage or force a saving throw. Once you use this, you can\'t again until a long rest, unless you expend a Psionic Energy die.' },
    { id: 'sk-rend-mind', name: 'Rend Mind', level: 17, source: 'Soulknife', combat: true,
      desc: 'When you deal Sneak Attack damage with your Psychic Blades, you can force the target to make a Wisdom save (DC 8 + your proficiency bonus + your Dexterity modifier) or be stunned for 1 minute (it repeats the save at the end of each of its turns). Once you use this, you can\'t again until a long rest, unless you expend three Psionic Energy dice.' },
  ],
};
