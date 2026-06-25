/** Warlock Pact Boons (the Pact Boon choice).
 *  `desc` is the one-line summary; `tagline` + `points` drive the richer
 *  browse/preview UI shared by the Features tab picker and the Combat tab block. */
export const PACT_BOONS = [
  {
    name: 'Pact of the Blade',
    desc: 'Action: create a magical pact weapon in your empty hand (choose its form each time); you are proficient with it. It counts as magical, and you can bond a magic weapon to it via a 1-hour ritual.',
    tagline: 'Conjure a soul-bound weapon from nothing.',
    points: [
      'Action: create a magical melee weapon in your empty hand — choose its form each time; you are proficient while wielding it.',
      'Counts as magical for overcoming resistance/immunity to nonmagical attacks.',
      'Bond a magic weapon to it with a 1-hour ritual (can be done on a short rest); dismiss it into an extradimensional space and recall it later.',
      'Vanishes if it is more than 5 ft from you for 1 min, if you re-create it, dismiss it (no action), or die.',
    ],
  },
  {
    name: 'Pact of the Chain',
    desc: 'You learn find familiar and can cast it as a ritual; it can take special forms (imp, pseudodragon, quasit, sprite). When you take the Attack action you can forgo an attack to let your familiar attack with its reaction.',
    tagline: 'A fiendish familiar fights at your side.',
    points: [
      "You learn find familiar and can cast it as a ritual; it doesn't count against your spells known.",
      'Your familiar can take a special form: imp, pseudodragon, quasit, or sprite.',
      'When you take the Attack action, you can forgo one of your attacks to let your familiar make one attack with its reaction.',
    ],
  },
  {
    name: 'Pact of the Tome',
    desc: 'You gain a Book of Shadows holding three cantrips from any class’s list, castable at will and not counting against cantrips known.',
    tagline: 'A Book of Shadows grants stolen cantrips.',
    points: [
      "Choose three cantrips from any class's spell list; while the book is on you, cast them at will.",
      "They don't count against your cantrips known and are warlock spells for you.",
      'A 1-hour ceremony (on a short or long rest) replaces a lost book, destroying the old one.',
    ],
  },
  {
    name: 'Pact of the Talisman',
    desc: 'You gain a talisman: when the wearer fails an ability check, they can add a d4. Usable a number of times equal to your proficiency bonus, restored on a long rest.',
    tagline: 'An amulet that turns failure to fortune.',
    points: [
      'When the wearer fails an ability check, they can add a d4 to the roll — potentially turning it into a success.',
      'Usable a number of times equal to your proficiency bonus; all uses return on a long rest.',
      'A 1-hour ceremony replaces a lost talisman, destroying the old one.',
    ],
  },
  {
    name: 'Pact of the Star Chain (UA)',
    desc: 'Prerequisite: Seeker patron. You know augury and can cast it as a ritual. You can also gain advantage on an Intelligence check once per short or long rest.',
    tagline: "Seeker's chain of starlight (UA).",
    points: [
      'Prerequisite: the Seeker patron. You know augury and can cast it as a ritual.',
      'Once per short or long rest, you can gain advantage on an Intelligence check.',
    ],
  },
];
