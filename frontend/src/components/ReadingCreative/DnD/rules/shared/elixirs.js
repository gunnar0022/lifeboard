/**
 * Alchemist — Experimental Elixir effects (the d6 table). Shared by the
 * Features-tab text and the Combat-tab AlchemistBlock, which lets you brew a
 * rack of flasks (rolled or chosen) and drink them. `roll` is the d6 face.
 */
export const ELIXIR_EFFECTS = [
  { roll: 1, name: 'Healing', short: 'Regain 2d4 + INT HP', desc: 'The drinker regains hit points equal to 2d4 + your Intelligence modifier.' },
  { roll: 2, name: 'Swiftness', short: '+10 ft speed (1 hr)', desc: "The drinker's walking speed increases by 10 feet for 1 hour." },
  { roll: 3, name: 'Resilience', short: '+1 AC (10 min)', desc: 'The drinker gains a +1 bonus to AC for 10 minutes.' },
  { roll: 4, name: 'Boldness', short: '+1d4 attacks & saves (1 min)', desc: 'The drinker can roll a d4 and add it to every attack roll and saving throw for 1 minute.' },
  { roll: 5, name: 'Flight', short: 'Fly 10 ft (10 min)', desc: 'The drinker gains a flying speed of 10 feet for 10 minutes.' },
  { roll: 6, name: 'Transformation', short: 'Alter Self (10 min)', desc: "The drinker's body is transformed as if by the Alter Self spell (drinker chooses) for 10 minutes." },
];

// Base elixirs produced free at the end of a long rest.
export function elixirsPerRest(level) {
  if (level >= 15) return 3;
  if (level >= 6) return 2;
  return 1;
}
