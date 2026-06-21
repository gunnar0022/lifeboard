/** Monk base-class progression. */
export default [
  {
    "id": "mnk-unarmored-defense",
    "name": "Unarmored Defense",
    "level": 1,
    "source": "Monk",
    "desc": "While wearing no armor and no shield, your AC equals 10 + Dexterity modifier + Wisdom modifier."
  },
  {
    "id": "mnk-martial-arts",
    "name": "Martial Arts",
    "level": 1,
    "source": "Monk",
    "combat": true,
    "desc": "While unarmed or wielding only monk weapons (no armor/shield): use Dexterity for attack and damage; your unarmed/monk-weapon damage die scales (d4 → d6 at 5th, d8 at 11th, d10 at 17th); and when you take the Attack action you can make one unarmed strike as a bonus action."
  },
  {
    "id": "mnk-ki",
    "name": "Ki",
    "level": 2,
    "source": "Monk",
    "combat": true,
    "desc": "You gain ki points equal to your monk level, regained on a short or long rest (Ki save DC = 8 + proficiency bonus + WIS modifier). Spend them on Flurry of Blows (1 ki: two unarmed strikes as a bonus action), Patient Defense (1 ki: Dodge as a bonus action), and Step of the Wind (1 ki: Disengage or Dash as a bonus action, jump doubled). Track ki on the Combat tab."
  },
  {
    "id": "mnk-unarmored-movement",
    "name": "Unarmored Movement",
    "level": 2,
    "source": "Monk",
    "desc": "Your speed increases while unarmored and without a shield (+10 ft at 2nd, rising to +30 ft at 18th). At 9th level you can move along vertical surfaces and across liquids without falling."
  },
  {
    "id": "mnk-dedicated-weapon",
    "name": "Dedicated Weapon (Optional)",
    "level": 2,
    "source": "Monk",
    "desc": "After a short or long rest, you can focus your ki on one simple/martial weapon (no heavy or special property) you are proficient with to count it as a monk weapon until you use this feature again."
  },
  {
    "id": "mnk-tradition",
    "name": "Monastic Tradition",
    "level": 3,
    "source": "Monk",
    "desc": "Your Monastic Tradition grants features at 3rd, 6th, 11th, and 17th level."
  },
  {
    "id": "mnk-deflect-missiles",
    "name": "Deflect Missiles",
    "level": 3,
    "source": "Monk",
    "combat": true,
    "desc": "Reaction when hit by a ranged weapon attack: reduce the damage by 1d10 + DEX modifier + monk level. If you reduce it to 0 and can catch the missile, you can spend 1 ki to throw it back (range 20/60) as part of the reaction."
  },
  {
    "id": "mnk-ki-fueled-attack",
    "name": "Ki-Fueled Attack (Optional)",
    "level": 3,
    "source": "Monk",
    "desc": "If you spend 1+ ki as part of your action, you can make one unarmed/monk-weapon attack as a bonus action before the end of your turn."
  },
  {
    "id": "mnk-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Monk",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "mnk-slow-fall",
    "name": "Slow Fall",
    "level": 4,
    "source": "Monk",
    "desc": "Reaction when you fall: reduce the falling damage by five times your monk level."
  },
  {
    "id": "mnk-quickened-healing",
    "name": "Quickened Healing (Optional)",
    "level": 4,
    "source": "Monk",
    "desc": "Action: spend 2 ki and roll a Martial Arts die to regain HP equal to the roll + your proficiency bonus."
  },
  {
    "id": "mnk-extra-attack",
    "name": "Extra Attack",
    "level": 5,
    "source": "Monk",
    "desc": "You can attack twice whenever you take the Attack action on your turn."
  },
  {
    "id": "mnk-stunning-strike",
    "name": "Stunning Strike",
    "level": 5,
    "source": "Monk",
    "combat": true,
    "desc": "When you hit with a melee weapon attack, spend 1 ki to force a Constitution save or the target is stunned until the end of your next turn."
  },
  {
    "id": "mnk-focused-aim",
    "name": "Focused Aim (Optional)",
    "level": 5,
    "source": "Monk",
    "desc": "When you miss with an attack roll, spend 1–3 ki to increase the roll by 2 per ki spent, possibly turning a miss into a hit."
  },
  {
    "id": "mnk-ki-empowered",
    "name": "Ki-Empowered Strikes",
    "level": 6,
    "source": "Monk",
    "desc": "Your unarmed strikes count as magical for overcoming resistance and immunity to nonmagical damage."
  },
  {
    "id": "mnk-evasion",
    "name": "Evasion",
    "level": 7,
    "source": "Monk",
    "desc": "When you make a Dexterity save for half damage, you instead take no damage on a success and half on a failure."
  },
  {
    "id": "mnk-stillness",
    "name": "Stillness of Mind",
    "level": 7,
    "source": "Monk",
    "desc": "Action: end one effect on yourself causing you to be charmed or frightened."
  },
  {
    "id": "mnk-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Monk",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "mnk-purity",
    "name": "Purity of Body",
    "level": 10,
    "source": "Monk",
    "desc": "You are immune to disease and poison."
  },
  {
    "id": "mnk-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Monk",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "mnk-tongue",
    "name": "Tongue of the Sun and Moon",
    "level": 13,
    "source": "Monk",
    "desc": "You understand all spoken languages, and any creature that knows a language can understand you."
  },
  {
    "id": "mnk-diamond-soul",
    "name": "Diamond Soul",
    "level": 14,
    "source": "Monk",
    "desc": "You gain proficiency in all saving throws, and can spend 1 ki to reroll a failed save (taking the second result)."
  },
  {
    "id": "mnk-timeless-body",
    "name": "Timeless Body",
    "level": 15,
    "source": "Monk",
    "desc": "You no longer age, can't be magically aged, and need no food or water."
  },
  {
    "id": "mnk-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Monk",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "mnk-empty-body",
    "name": "Empty Body",
    "level": 18,
    "source": "Monk",
    "combat": true,
    "desc": "Action: spend 4 ki to become invisible for 1 minute with resistance to all damage except force. You can also spend 8 ki to cast Astral Projection (yourself only) without material components."
  },
  {
    "id": "mnk-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Monk",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "mnk-perfect-self",
    "name": "Perfect Self",
    "level": 20,
    "source": "Monk",
    "desc": "When you roll initiative with no ki points remaining, you regain 4 ki points."
  }
];
