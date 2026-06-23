/** Ranger base-class progression. */
export default [
  {
    "id": "ranger-hit-points",
    "name": "Hit Points",
    "level": 1,
    "source": "Ranger",
    "noTruncate": true,
    "desc": "Hit Dice: 1d10 per ranger level\nHit Points at 1st Level: 10 + your Constitution modifier\nHit Points at Higher Levels: 1d10 (or 6) + your Constitution modifier per ranger level after 1st"
  },
  {
    "id": "rng-favored-enemy",
    "name": "Favored Enemy",
    "level": 1,
    "source": "Ranger",
    "desc": "Choose a favored enemy type. You have advantage on Survival checks to track them and Intelligence checks to recall lore about them, and learn a related language. Choose additional favored enemies at 6th and 14th level. (Favored Foe is the optional replacement.)"
  },
  {
    "id": "rng-favored-foe",
    "name": "Favored Foe (Optional)",
    "level": 1,
    "source": "Ranger",
    "combat": true,
    "desc": "Replaces Favored Enemy. When you hit a creature, mark it as your favored enemy (concentration, 1 min). The first time each turn you damage it, add 1d4 (1d6 at 6th, 1d8 at 14th). Uses equal to your proficiency bonus, regained on a long rest. Track it on the Combat tab."
  },
  {
    "id": "rng-natural-explorer",
    "name": "Natural Explorer",
    "level": 1,
    "source": "Ranger",
    "desc": "Choose a favored terrain; your proficiency bonus is doubled for INT/WIS checks tied to it, plus travel benefits (no difficult terrain, can't get lost, alert while busy, extra foraging, detailed tracking). Choose more terrains at 6th and 10th level. (Deft Explorer is the optional replacement.)"
  },
  {
    "id": "rng-deft-explorer",
    "name": "Deft Explorer (Optional)",
    "level": 1,
    "source": "Ranger",
    "combat": true,
    "desc": "Replaces Natural Explorer. Canny: double proficiency on one skill and learn 2 languages. Roving (6th): +5 speed plus climb and swim speeds. Tireless (10th): action to gain 1d8 + WIS temp HP (uses equal to proficiency bonus, long rest), and short rests reduce exhaustion by 1."
  },
  {
    "id": "rng-fighting-style",
    "name": "Fighting Style",
    "level": 2,
    "source": "Ranger",
    "choice": "fighting-style",
    "desc": "Adopt a fighting style as your specialty. (Druidic Warrior grants two druid cantrips cast with Wisdom.)"
  },
  {
    "id": "rng-spellcasting",
    "name": "Spellcasting",
    "level": 2,
    "source": "Ranger",
    "desc": "You draw on nature's magic to cast ranger spells using Wisdom (save DC = 8 + proficiency bonus + WIS modifier; attack = proficiency bonus + WIS modifier). As a half caster you know a set number of spells (Spells Known) and can swap one each level. Manage spells and slots on the Spells tab."
  },
  {
    "id": "rng-primeval-awareness",
    "name": "Primeval Awareness",
    "level": 3,
    "source": "Ranger",
    "desc": "Action: expend a ranger spell slot to sense whether aberrations, celestials, dragons, elementals, fey, fiends, or undead are within 1 mile (6 miles in favored terrain) for 1 min per slot level. (Primal Awareness is the optional replacement, granting always-known spells.)"
  },
  {
    "id": "rng-ranger-conclave",
    "name": "Ranger Conclave",
    "level": 3,
    "source": "Ranger",
    "desc": "Your Ranger Conclave grants features at 3rd, 7th, 11th, and 15th level."
  },
  {
    "id": "rng-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Ranger",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "rng-extra-attack",
    "name": "Extra Attack",
    "level": 5,
    "source": "Ranger",
    "desc": "You can attack twice whenever you take the Attack action on your turn."
  },
  {
    "id": "rng-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Ranger",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "rng-lands-stride",
    "name": "Land's Stride",
    "level": 8,
    "source": "Ranger",
    "desc": "Nonmagical difficult terrain costs no extra movement, and you pass through nonmagical plants unharmed. You have advantage on saves against plants that magically impede movement."
  },
  {
    "id": "rng-hide-plain-sight",
    "name": "Hide in Plain Sight",
    "level": 10,
    "source": "Ranger",
    "desc": "Spend 1 minute making camouflage to gain +10 to Stealth while pressed against a solid surface and not moving or acting. (Nature's Veil is the optional replacement.)"
  },
  {
    "id": "rng-natures-veil",
    "name": "Nature's Veil (Optional)",
    "level": 10,
    "source": "Ranger",
    "combat": true,
    "desc": "Replaces Hide in Plain Sight. Bonus action: become invisible until the start of your next turn. Uses equal to your proficiency bonus, regained on a long rest."
  },
  {
    "id": "rng-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Ranger",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "rng-vanish",
    "name": "Vanish",
    "level": 14,
    "source": "Ranger",
    "desc": "You can Hide as a bonus action, and can't be tracked by nonmagical means unless you choose to leave a trail."
  },
  {
    "id": "rng-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Ranger",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "rng-feral-senses",
    "name": "Feral Senses",
    "level": 18,
    "source": "Ranger",
    "desc": "No disadvantage attacking creatures you can't see, and you sense invisible creatures within 30 ft (unless hidden or you're blinded/deafened)."
  },
  {
    "id": "rng-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Ranger",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat. Martial Versatility (optional): instead replace a fighting style with another."
  },
  {
    "id": "rng-foe-slayer",
    "name": "Foe Slayer",
    "level": 20,
    "source": "Ranger",
    "desc": "Once per turn, add your Wisdom modifier to the attack or damage roll of an attack against your favored enemy (before or after the roll)."
  }
];
