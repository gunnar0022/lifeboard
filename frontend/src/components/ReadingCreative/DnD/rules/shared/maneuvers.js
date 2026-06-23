/** Battle Master (Fighter) maneuvers + superiority-dice scaling helpers. */
export const MANEUVER_LIST = [
  { name: 'Ambush', type: 'skill', desc: 'Add the die to a Dexterity (Stealth) check or an initiative roll (if not incapacitated).' },
  { name: 'Bait and Switch', type: 'bonus', desc: 'Spend 5 ft of movement to switch places with a willing creature within 5 ft (no opportunity attacks); you or it gains AC = the die until your next turn.' },
  { name: 'Brace', type: 'reaction', desc: 'Reaction when a creature enters your melee reach: make one attack against it, adding the die to damage on a hit.' },
  { name: "Commander's Strike", type: 'bonus', desc: 'Forgo one attack to direct an ally (bonus action): it uses its reaction to make one weapon attack, adding the die to damage.' },
  { name: 'Commanding Presence', type: 'skill', desc: 'Add the die to a Charisma (Intimidation, Performance, or Persuasion) check.' },
  { name: 'Disarming Attack', type: 'attack', desc: 'On a hit, add the die to damage; target makes a STR save or drops one item of your choice.' },
  { name: 'Distracting Strike', type: 'attack', desc: 'On a hit, add the die to damage; the next attack against the target by another attacker has advantage (before your next turn).' },
  { name: 'Evasive Footwork', type: 'defense', desc: 'When you move, add the die to your AC until you stop moving.' },
  { name: 'Feinting Attack', type: 'bonus', desc: 'Bonus action: feint a creature within 5 ft — advantage on your next attack against it this turn, adding the die to damage on a hit.' },
  { name: 'Goading Attack', type: 'attack', desc: 'On a hit, add the die to damage; target makes a WIS save or has disadvantage attacking anyone but you until end of your next turn.' },
  { name: 'Grappling Strike', type: 'bonus', desc: 'After a melee hit, bonus action to grapple the target, adding the die to your Strength (Athletics) check.' },
  { name: 'Lunging Attack', type: 'attack', desc: 'Increase your melee reach by 5 ft for one attack; on a hit, add the die to damage.' },
  { name: 'Maneuvering Attack', type: 'attack', desc: 'On a hit, add the die to damage; an ally can use its reaction to move half its speed without provoking from your target.' },
  { name: 'Menacing Attack', type: 'attack', desc: 'On a hit, add the die to damage; target makes a WIS save or is frightened of you until end of your next turn.' },
  { name: 'Parry', type: 'reaction', desc: 'Reaction when a melee attack damages you: reduce the damage by the die + your Dexterity modifier.' },
  { name: 'Precision Attack', type: 'special', desc: 'Add the die to a weapon attack roll (before or after rolling, before effects apply).' },
  { name: 'Pushing Attack', type: 'attack', desc: 'On a hit, add the die to damage; a Large or smaller target makes a STR save or is pushed up to 15 ft away.' },
  { name: 'Quick Toss', type: 'bonus', desc: 'Bonus action: make a ranged attack with a thrown weapon (you can draw it); on a hit, add the die to damage.' },
  { name: 'Rally', type: 'bonus', desc: 'Bonus action: a chosen ally gains temporary HP equal to the die + your Charisma modifier.' },
  { name: 'Riposte', type: 'reaction', desc: 'Reaction when a creature misses you with a melee attack: make a melee attack against it, adding the die to damage on a hit.' },
  { name: 'Sweeping Attack', type: 'special', desc: 'On a melee hit, if the roll would also hit a second creature within 5 ft of the target and your reach, deal die damage of the same type to it.' },
  { name: 'Tactical Assessment', type: 'skill', desc: 'Add the die to an Intelligence (Investigation or History) or Wisdom (Insight) check.' },
  { name: 'Trip Attack', type: 'attack', desc: 'On a hit, add the die to damage; a Large or smaller target makes a STR save or is knocked prone.' },
];

// Maneuvers known: 3 at 3rd, +2 at 7th/10th/15th.
export function maneuversKnown(level) {
  if (level >= 15) return 9;
  if (level >= 10) return 7;
  if (level >= 7) return 5;
  return 3;
}

// Superiority dice: 4 at 3rd, 5 at 7th, 6 at 15th.
export function superiorityDiceCount(level) {
  if (level >= 15) return 6;
  if (level >= 7) return 5;
  return 4;
}

// Superiority die size: d8 → d10 at 10th → d12 at 18th.
export function superiorityDie(level) {
  if (level >= 18) return 'd12';
  if (level >= 10) return 'd10';
  return 'd8';
}
