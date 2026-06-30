export default {
  name: 'Chronurgy Magic',
  className: 'Wizard',
  features: [
    { id: 'chron-chronal-shift', name: 'Chronal Shift', level: 2, source: 'Chronurgy Magic', combat: true,
      desc: 'As a reaction, after you or a creature you can see within 30 feet makes an attack roll, ability check, or saving throw, you can force the creature to reroll. You decide after seeing whether the roll succeeds or fails; the target must use the second roll. Twice per long rest. Track uses on the Combat tab.' },
    { id: 'chron-temporal-awareness', name: 'Temporal Awareness', level: 2, source: 'Chronurgy Magic', combat: true,
      desc: 'You can add your Intelligence modifier to your initiative rolls.' },
    { id: 'chron-momentary-stasis', name: 'Momentary Stasis', level: 6, source: 'Chronurgy Magic', combat: true,
      desc: 'As an action, force a Large or smaller creature you can see within 60 feet to make a Constitution saving throw against your spell save DC. On a failure it is encased in magical energy until the end of your next turn or until it takes any damage — while encased it is incapacitated and has a speed of 0. Uses equal to your Intelligence modifier (min 1), regained on a long rest.' },
    { id: 'chron-arcane-abeyance', name: 'Arcane Abeyance', level: 10, source: 'Chronurgy Magic', combat: true,
      desc: 'When you cast a spell using a slot of 4th level or lower, you can condense its magic into a gray bead (Tiny object, AC 15, 1 HP, immune to poison and psychic) for 1 hour. A creature holding the bead can use its action to release the frozen spell (using your spell attack bonus and save DC, treated as the caster otherwise); the bead then disappears. Once used, you can\'t do so again until you finish a short or long rest.' },
    { id: 'chron-convergent-future', name: 'Convergent Future', level: 14, source: 'Chronurgy Magic', combat: true,
      desc: 'When you or a creature you can see within 60 feet makes an attack roll, ability check, or saving throw, you can use your reaction to ignore the die roll and decide whether the number rolled is the minimum needed to succeed, or one less (your choice). Each use gives you one level of exhaustion that only a long rest can remove.' },
  ],
};
