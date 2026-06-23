/** Warlock base-class progression. */
export default [
  {
    "id": "warlock-hit-points",
    "name": "Hit Points",
    "level": 1,
    "source": "Warlock",
    "noTruncate": true,
    "desc": "Hit Dice: 1d8 per warlock level\nHit Points at 1st Level: 8 + your Constitution modifier\nHit Points at Higher Levels: 1d8 (or 5) + your Constitution modifier per warlock level after 1st"
  },
  {
    "id": "wl-patron",
    "name": "Otherworldly Patron",
    "level": 1,
    "source": "Warlock",
    "desc": "Your pact with an otherworldly patron grants features at 1st, 6th, 10th, and 14th level."
  },
  {
    "id": "wl-pact-magic",
    "name": "Pact Magic",
    "level": 1,
    "source": "Warlock",
    "desc": "You cast warlock spells using Charisma. All of your pact slots are the same level and you regain them on a short or long rest. Manage cantrips, known spells, and pact slots on the Spells tab."
  },
  {
    "id": "wl-invocations",
    "name": "Eldritch Invocations",
    "level": 2,
    "source": "Warlock",
    "choice": "invocations",
    "desc": "You learn fragments of forbidden knowledge that grant an array of magical abilities. You know a number of invocations that grows with your level; you can replace one when you gain a warlock level."
  },
  {
    "id": "wl-pact-boon",
    "name": "Pact Boon",
    "level": 3,
    "source": "Warlock",
    "choice": "pact-boon",
    "desc": "Your patron bestows a gift for your service. Choose one Pact Boon below."
  },
  {
    "id": "wl-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Warlock",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or (12th+) a Mystic Arcanum spell."
  },
  {
    "id": "wl-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Warlock",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or (12th+) a Mystic Arcanum spell."
  },
  {
    "id": "wl-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Warlock",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or a Mystic Arcanum spell."
  },
  {
    "id": "wl-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Warlock",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or a Mystic Arcanum spell."
  },
  {
    "id": "wl-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Warlock",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Eldritch Versatility (optional): instead swap a cantrip, your Pact Boon, or a Mystic Arcanum spell."
  },
  {
    "id": "wl-mystic-arcanum",
    "name": "Mystic Arcanum",
    "level": 11,
    "source": "Warlock",
    "desc": "Your patron grants higher-level secrets: a 6th-level spell at 11th, 7th at 13th, 8th at 15th, and 9th at 17th. You can cast each once without a slot, regaining all uses on a long rest. Add each as a Granted Spell (once / long rest) on the Spells tab."
  },
  {
    "id": "wl-eldritch-master",
    "name": "Eldritch Master",
    "level": 20,
    "source": "Warlock",
    "desc": "Spend 1 minute entreating your patron to regain all expended Pact Magic slots. Once you do, you must finish a long rest before using it again."
  }
];
