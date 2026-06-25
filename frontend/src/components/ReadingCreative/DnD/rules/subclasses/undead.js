/**
 * The Undead — Warlock. A pact with a deathless horror (lich, mummy, vampire),
 * letting the warlock take on a dreadful aspect. The Form of Dread transformation
 * is the engine; Grave Touched, Necrotic Husk, and Spirit Projection build on it.
 * All surfaced on the UndeadBlock.
 */
export default {
  name: 'The Undead',
  className: 'Warlock',
  features: [
    {
      id: 'und-spells', name: 'Undead Expanded Spells', level: 1,
      source: 'The Undead',
      desc: 'These spells are added to the warlock spell list for you: 1st Bane, False Life · 2nd Blindness/Deafness, Phantasmal Force · 3rd Phantom Steed, Speak with Dead · 4th Death Ward, Greater Invisibility · 5th Antilife Shell, Cloudkill. Learn them as warlock spells on the Spells tab.',
    },
    {
      id: 'und-form-of-dread', name: 'Form of Dread', level: 1,
      source: 'The Undead', combat: true,
      desc: 'Bonus action: transform for 1 minute. While transformed you gain temporary hit points equal to 1d10 + your warlock level; once on each of your turns when you hit a creature you can force a Wisdom save or it is frightened of you until the end of your next turn; and you are immune to the frightened condition. Uses equal to your proficiency bonus, regained on a long rest. Transform on the Combat tab.',
    },
    {
      id: 'und-grave-touched', name: 'Grave Touched', level: 6,
      source: 'The Undead', combat: true,
      desc: "You don't need to eat, drink, or breathe. Once on each of your turns when you hit a creature and roll damage, you can replace the damage type with necrotic. While using Form of Dread, you can roll one additional damage die when determining that necrotic damage.",
    },
    {
      id: 'und-necrotic-husk', name: 'Necrotic Husk', level: 10,
      source: 'The Undead', combat: true,
      desc: 'You gain resistance to necrotic damage (immunity while using Form of Dread). When reduced to 0 HP, you can use your reaction to drop to 1 HP instead and erupt: each creature of your choice within 30 ft takes 2d10 + your warlock level necrotic damage, and you gain 1 level of exhaustion. Once used, you can\'t do so again until you finish 1d4 long rests.',
    },
    {
      id: 'und-spirit-projection', name: 'Spirit Projection', level: 14,
      source: 'The Undead', combat: true,
      desc: 'Action: project your spirit from your body (left unconscious in suspended animation) for up to 1 hour or until your concentration breaks. Your spirit and body gain resistance to bludgeoning, piercing, and slashing; conjuration/necromancy spells need no V/S/M components (without a gold cost); you gain a flying speed equal to your walking speed and can move through creatures/objects (1d10 force if you end your turn inside one). While in Form of Dread, once per turn when you deal necrotic damage you regain HP equal to half the amount dealt. Once per long rest.',
    },
  ],
};
