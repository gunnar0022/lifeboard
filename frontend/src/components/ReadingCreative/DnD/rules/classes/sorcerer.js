/** Sorcerer base-class progression. */
export default [
  {
    "id": "sorcerer-hit-points",
    "name": "Hit Points",
    "level": 1,
    "source": "Sorcerer",
    "noTruncate": true,
    "desc": "Hit Dice: 1d6 per sorcerer level\nHit Points at 1st Level: 6 + your Constitution modifier\nHit Points at Higher Levels: 1d6 (or 4) + your Constitution modifier per sorcerer level after 1st"
  },
  {
    "id": "sor-spellcasting",
    "name": "Spellcasting",
    "level": 1,
    "source": "Sorcerer",
    "desc": "Innate arcane magic fuels your spells. You cast using Charisma (save DC = 8 + proficiency bonus + CHA modifier; attack = proficiency bonus + CHA modifier). You know a set number of spells (Spells Known) and can swap one each level. Manage spells and slots on the Spells tab."
  },
  {
    "id": "sor-font",
    "name": "Font of Magic",
    "level": 2,
    "source": "Sorcerer",
    "combat": true,
    "desc": "You gain sorcery points equal to your sorcerer level (regained on a long rest). Flexible Casting lets you convert sorcery points into spell slots (and slots back into points) as a bonus action. Track sorcery points on the Combat tab."
  },
  {
    "id": "sor-metamagic",
    "name": "Metamagic",
    "level": 3,
    "source": "Sorcerer",
    "choice": "metamagic",
    "desc": "You can twist your spells by spending sorcery points. You know two Metamagic options, gaining another at 10th and 17th level. You can use only one Metamagic option per spell (unless an option says otherwise)."
  },
  {
    "id": "sor-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Sorcerer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Sorcerous Versatility (optional): instead swap a Metamagic option or replace a cantrip."
  },
  {
    "id": "sor-magical-guidance",
    "name": "Magical Guidance (Optional)",
    "level": 5,
    "source": "Sorcerer",
    "desc": "When you fail an ability check, you can spend 1 sorcery point to reroll the d20 and use the new roll."
  },
  {
    "id": "sor-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Sorcerer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Sorcerous Versatility (optional): instead swap a Metamagic option or replace a cantrip."
  },
  {
    "id": "sor-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Sorcerer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Sorcerous Versatility (optional): instead swap a Metamagic option or replace a cantrip."
  },
  {
    "id": "sor-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Sorcerer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Sorcerous Versatility (optional): instead swap a Metamagic option or replace a cantrip."
  },
  {
    "id": "sor-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Sorcerer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Sorcerous Versatility (optional): instead swap a Metamagic option or replace a cantrip."
  },
  {
    "id": "sor-restoration",
    "name": "Sorcerous Restoration",
    "level": 20,
    "source": "Sorcerer",
    "desc": "You regain 4 expended sorcery points whenever you finish a short rest."
  }
];
