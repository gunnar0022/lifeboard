/**
 * The Fiend — Warlock. A bargain with a lord of the Lower Planes, fueling the
 * warlock with infernal resilience and destructive might. Combat hooks: the
 * temp-HP reward of Dark One's Blessing, the d10 fate-bender Dark One's Own Luck,
 * the rest-chosen resistance of Fiendish Resilience, and Hurl Through Hell — all
 * surfaced on the FiendBlock.
 */
export default {
  name: 'The Fiend',
  className: 'Warlock',
  features: [
    {
      id: 'fiend-spells', name: 'Fiend Expanded Spells', level: 1,
      source: 'The Fiend',
      desc: 'These spells are added to the warlock spell list for you: 1st Burning Hands, Command · 2nd Blindness/Deafness, Scorching Ray · 3rd Fireball, Stinking Cloud · 4th Fire Shield, Wall of Fire · 5th Flame Strike, Hallow. Learn them as warlock spells on the Spells tab.',
    },
    {
      id: 'fiend-blessing', name: "Dark One's Blessing", level: 1,
      source: 'The Fiend', combat: true,
      desc: 'When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1). Grant the temp HP on the Combat tab.',
    },
    {
      id: 'fiend-luck', name: "Dark One's Own Luck", level: 6,
      source: 'The Fiend', combat: true,
      desc: "When you make an ability check or a saving throw, you can add a d10 to the roll. You can do this after seeing the roll but before its effects occur. Once per short or long rest.",
    },
    {
      id: 'fiend-resilience', name: 'Fiendish Resilience', level: 10,
      source: 'The Fiend', combat: true,
      desc: 'When you finish a short or long rest, choose one damage type. You gain resistance to that damage type until you choose a different one. Damage from magical or silvered weapons ignores this resistance. Choose the type on the Combat tab.',
    },
    {
      id: 'fiend-hurl', name: 'Hurl Through Hell', level: 14,
      source: 'The Fiend', combat: true,
      desc: 'When you hit a creature with an attack, you can instantly transport it through the Lower Planes. It vanishes and hurtles through a nightmare landscape; at the end of your next turn it returns to the space it occupied (or the nearest unoccupied space). If the target is not a fiend, it takes 10d10 psychic damage. Once per long rest.',
    },
  ],
};
