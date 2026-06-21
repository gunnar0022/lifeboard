/** Wizard base-class progression. */
export default [
  {
    "id": "wiz-spellcasting",
    "name": "Spellcasting",
    "level": 1,
    "source": "Wizard",
    "desc": "You cast wizard spells using Intelligence (spell save DC = 8 + proficiency bonus + INT modifier; attack = proficiency bonus + INT modifier). Manage your spellbook, prepared spells, slots, and casting on the Spells tab. You prepare INT modifier + wizard level spells from your spellbook after a long rest, and can cast any spell you know with the ritual tag as a ritual without preparing it."
  },
  {
    "id": "wiz-arcane-recovery",
    "name": "Arcane Recovery",
    "level": 1,
    "source": "Wizard",
    "combat": true,
    "desc": "Once per day when you finish a short rest, recover expended spell slots with a combined level up to half your wizard level (rounded up); none can be 6th level or higher. Track it on the Combat tab; recover the actual slots on the Spells tab."
  },
  {
    "id": "wiz-arcane-tradition",
    "name": "Arcane Tradition",
    "level": 2,
    "source": "Wizard",
    "desc": "Your Arcane Tradition shapes your practice of magic, granting features at 2nd, 6th, 10th, and 14th level."
  },
  {
    "id": "wiz-cantrip-formulas",
    "name": "Cantrip Formulas (Optional)",
    "level": 3,
    "source": "Wizard",
    "desc": "After a long rest, you can replace one wizard cantrip you know with another from the wizard spell list."
  },
  {
    "id": "wiz-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Wizard",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead."
  },
  {
    "id": "wiz-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Wizard",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead."
  },
  {
    "id": "wiz-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Wizard",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead."
  },
  {
    "id": "wiz-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Wizard",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two ability scores by 1 (max 20) — or take a feat instead."
  },
  {
    "id": "wiz-spell-mastery",
    "name": "Spell Mastery",
    "level": 18,
    "source": "Wizard",
    "desc": "Choose a 1st-level and a 2nd-level wizard spell in your spellbook. While prepared, you can cast them at their lowest level without expending a slot. Add them as Granted Spells (at-will) on the Spells tab to track."
  },
  {
    "id": "wiz-signature-spells",
    "name": "Signature Spells",
    "level": 20,
    "source": "Wizard",
    "desc": "Choose two 3rd-level wizard spells as signature spells. They are always prepared, don't count against your prepared limit, and you can cast each once at 3rd level without a slot, regaining that use on a short or long rest. Pin them as Always Prepared and add a Granted use on the Spells tab."
  }
];
