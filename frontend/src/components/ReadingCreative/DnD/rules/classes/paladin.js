/** Paladin base-class progression. */
export default [
  {
    "id": "pal-divine-sense",
    "name": "Divine Sense",
    "level": 1,
    "source": "Paladin",
    "combat": true,
    "desc": "Action: until the end of your next turn, detect celestials, fiends, and undead within 60 ft (and consecrated/desecrated places). Uses equal to 1 + your Charisma modifier, regained on a long rest."
  },
  {
    "id": "pal-lay-on-hands",
    "name": "Lay on Hands",
    "level": 1,
    "source": "Paladin",
    "combat": true,
    "desc": "A pool of healing equal to 5 × your paladin level, restored on a long rest. Action: touch a creature to restore HP from the pool, or spend 5 points to cure a disease or neutralize a poison. No effect on undead or constructs."
  },
  {
    "id": "pal-fighting-style",
    "name": "Fighting Style",
    "level": 2,
    "source": "Paladin",
    "choice": "fighting-style",
    "desc": "Adopt a fighting style as your specialty. (Blessed Warrior grants two cleric cantrips cast with Charisma.)"
  },
  {
    "id": "pal-spellcasting",
    "name": "Spellcasting",
    "level": 2,
    "source": "Paladin",
    "desc": "You cast paladin spells using Charisma (save DC = 8 + proficiency bonus + CHA modifier; attack = proficiency bonus + CHA modifier). As a half caster you prepare CHA modifier + half your paladin level spells after a long rest. Manage prepared spells and slots on the Spells tab."
  },
  {
    "id": "pal-divine-smite",
    "name": "Divine Smite",
    "level": 2,
    "source": "Paladin",
    "combat": true,
    "desc": "When you hit with a melee weapon attack, expend a spell slot to deal extra radiant damage: 2d8 for a 1st-level slot, +1d8 per slot level above 1st (max 5d8), +1d8 more against undead or fiends. Expend the slot on the Spells tab."
  },
  {
    "id": "pal-divine-health",
    "name": "Divine Health",
    "level": 3,
    "source": "Paladin",
    "desc": "The divine magic flowing through you makes you immune to disease."
  },
  {
    "id": "pal-sacred-oath",
    "name": "Sacred Oath",
    "level": 3,
    "source": "Paladin",
    "desc": "Your Sacred Oath grants oath spells (always prepared, not counting against your limit — pin them as Always Prepared on the Spells tab), a Channel Divinity, and features at 3rd, 7th, 15th, and 20th level."
  },
  {
    "id": "pal-channel-divinity",
    "name": "Channel Divinity",
    "level": 3,
    "source": "Paladin",
    "combat": true,
    "desc": "Your oath grants Channel Divinity options. Use one, then finish a short or long rest to use it again. Save DC equals your paladin spell save DC."
  },
  {
    "id": "pal-harness-divine-power",
    "name": "Harness Divine Power (Optional)",
    "level": 3,
    "source": "Paladin",
    "combat": true,
    "desc": "Bonus action: expend a Channel Divinity use to regain one spell slot (level ≤ half your proficiency bonus, rounded up). Once per long rest at 3rd level, twice at 7th, three times at 15th."
  },
  {
    "id": "pal-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Paladin",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "pal-extra-attack",
    "name": "Extra Attack",
    "level": 5,
    "source": "Paladin",
    "desc": "You can attack twice whenever you take the Attack action on your turn."
  },
  {
    "id": "pal-aura-protection",
    "name": "Aura of Protection",
    "level": 6,
    "source": "Paladin",
    "combat": true,
    "desc": "While conscious, you and friendly creatures within 10 ft (30 ft at 18th) gain a bonus to all saving throws equal to your Charisma modifier (min +1)."
  },
  {
    "id": "pal-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Paladin",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "pal-aura-courage",
    "name": "Aura of Courage",
    "level": 10,
    "source": "Paladin",
    "desc": "While conscious, you and friendly creatures within 10 ft (30 ft at 18th) can't be frightened."
  },
  {
    "id": "pal-improved-smite",
    "name": "Improved Divine Smite",
    "level": 11,
    "source": "Paladin",
    "combat": true,
    "desc": "Your melee weapon hits deal an extra 1d8 radiant damage."
  },
  {
    "id": "pal-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Paladin",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "pal-cleansing-touch",
    "name": "Cleansing Touch",
    "level": 14,
    "source": "Paladin",
    "combat": true,
    "desc": "Action: end one spell on yourself or a willing creature you touch. Uses equal to your Charisma modifier (min 1), regained on a long rest."
  },
  {
    "id": "pal-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Paladin",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "pal-aura-improvements",
    "name": "Aura Improvements",
    "level": 18,
    "source": "Paladin",
    "desc": "The range of your Aura of Protection and Aura of Courage increases to 30 feet."
  },
  {
    "id": "pal-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Paladin",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  }
];
