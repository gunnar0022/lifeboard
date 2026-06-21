/** Cleric base-class progression. */
export default [
  {
    "id": "clr-spellcasting",
    "name": "Spellcasting",
    "level": 1,
    "source": "Cleric",
    "desc": "You cast cleric spells using Wisdom (save DC = 8 + proficiency bonus + WIS modifier; attack = proficiency bonus + WIS modifier). You prepare WIS modifier + cleric level spells from the cleric list after a long rest, and can cast a prepared spell with the ritual tag as a ritual. Manage prepared spells and slots on the Spells tab."
  },
  {
    "id": "clr-divine-domain",
    "name": "Divine Domain",
    "level": 1,
    "source": "Cleric",
    "desc": "Your Divine Domain grants domain spells (always prepared, not counting against your limit — pin them as Always Prepared on the Spells tab) and features at 1st, 2nd, 6th, 8th, and 17th level."
  },
  {
    "id": "clr-channel-divinity",
    "name": "Channel Divinity",
    "level": 2,
    "source": "Cleric",
    "combat": true,
    "desc": "Channel divine energy to fuel effects — Turn Undead plus domain options. Once per short or long rest at 2nd level, twice at 6th, three times at 18th. Track uses on the Combat tab. Turn Undead (action): undead within 30 ft that can see/hear you make a WIS save or flee for 1 minute."
  },
  {
    "id": "clr-harness-divine-power",
    "name": "Harness Divine Power (Optional)",
    "level": 2,
    "source": "Cleric",
    "combat": true,
    "desc": "Bonus action: expend a Channel Divinity use to regain one spell slot (level ≤ half your proficiency bonus, rounded up). Usable once per long rest at 2nd level, twice at 6th, three times at 18th."
  },
  {
    "id": "clr-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Cleric",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one cleric cantrip."
  },
  {
    "id": "clr-destroy-undead",
    "name": "Destroy Undead",
    "level": 5,
    "source": "Cleric",
    "combat": true,
    "desc": "When an undead fails its save against Turn Undead, it is instantly destroyed if its CR is at or below your threshold: CR 1/2 at 5th, 1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th."
  },
  {
    "id": "clr-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Cleric",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one cleric cantrip."
  },
  {
    "id": "clr-blessed-strikes",
    "name": "Blessed Strikes (Optional)",
    "level": 8,
    "source": "Cleric",
    "desc": "When a creature takes damage from one of your cantrips or weapon attacks, deal an extra 1d8 radiant damage to it. Once per turn. (Replaces a domain's Divine Strike or Potent Spellcasting.)"
  },
  {
    "id": "clr-divine-intervention",
    "name": "Divine Intervention",
    "level": 10,
    "source": "Cleric",
    "combat": true,
    "desc": "Action: roll percentile dice; if you roll ≤ your cleric level, your deity intervenes (DM chooses an appropriate cleric/domain effect). On success you can't use it for 7 days; otherwise retry after a long rest. At 20th level it succeeds automatically."
  },
  {
    "id": "clr-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Cleric",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one cleric cantrip."
  },
  {
    "id": "clr-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Cleric",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one cleric cantrip."
  },
  {
    "id": "clr-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Cleric",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Cantrip Versatility (optional): instead replace one cleric cantrip."
  }
];
