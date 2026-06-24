/** Artificer base-class progression. A half-caster (Intelligence) whose
 * identity is gear: Magical Tinkering, Infuse Item (the infusion workbench on
 * the Combat tab), Flash of Genius, Spell-Storing Item, and an escalating
 * attunement ceiling. Long descriptions stay collapsed in the Features tab. */
export default [
  {
    "id": "artificer-hit-points",
    "name": "Hit Points",
    "level": 1,
    "source": "Artificer",
    "noTruncate": true,
    "desc": "Hit Dice: 1d8 per artificer level\nHit Points at 1st Level: 8 + your Constitution modifier\nHit Points at Higher Levels: 1d8 (or 5) + your Constitution modifier per artificer level after 1st"
  },
  {
    "id": "art-magical-tinkering",
    "name": "Magical Tinkering",
    "level": 1,
    "source": "Artificer",
    "combat": true,
    "desc": "With thieves' or artisan's tools in hand, touch a Tiny nonmagical object (action) to give it one minor property: shed dim light; emit a recorded 6-second message when tapped; continuously emit a smell or nonverbal sound (10 ft); or display a small static visual. The property lasts until you end it (action). Max active objects = your INT modifier (min 1); a new one past the cap ends the oldest. Track active objects on the Combat tab."
  },
  {
    "id": "art-spellcasting",
    "name": "Spellcasting",
    "level": 1,
    "source": "Artificer",
    "desc": "You channel spells through tools, using Intelligence (save DC = 8 + proficiency bonus + INT modifier; attack = proficiency bonus + INT modifier). You must hold a spellcasting focus — thieves' tools or an artisan's tool you're proficient with (or, from 2nd level, any item bearing one of your infusions) — to cast a spell with a material component. You're a half-caster but gain a 1st-level slot at level 1. You prepare INT modifier + half your artificer level (rounded down, min 1) spells each long rest, and can cast any artificer spell with the ritual tag if it's prepared. Manage cantrips, prepared spells, and slots on the Spells tab."
  },
  {
    "id": "art-infuse-item",
    "name": "Infuse Item",
    "level": 2,
    "source": "Artificer",
    "combat": true,
    "choice": "infusions",
    "desc": "You learn artificer infusions (chosen below) and, after each long rest, imbue nonmagical objects with them — turning them into magic items. Each infusion can occupy only one object, and no object can hold more than one infusion. You can attune to a required item the instant you infuse it. The number of items you can keep infused at once is set by the Infused Items column; infuse and attune them on the Combat tab. Whenever you level up you can swap one known infusion for another."
  },
  {
    "id": "art-artificer-specialist",
    "name": "Artificer Specialist",
    "level": 3,
    "source": "Artificer",
    "desc": "Choose your Artificer Specialist (Alchemist, Armorer, Artillerist, or Battle Smith). It grants features now and again at 5th, 9th, and 15th level."
  },
  {
    "id": "art-right-tool",
    "name": "The Right Tool for the Job",
    "level": 3,
    "source": "Artificer",
    "desc": "With thieves' or artisan's tools in hand, you can spend 1 hour of work (during a short or long rest) to magically create one set of artisan's tools of your choice in an unoccupied space within 5 ft. The tools are nonmagical and vanish the next time you use this feature."
  },
  {
    "id": "art-asi-4",
    "name": "Ability Score Improvement",
    "level": 4,
    "source": "Artificer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "art-tool-expertise",
    "name": "Tool Expertise",
    "level": 6,
    "source": "Artificer",
    "desc": "Your proficiency bonus is doubled for any ability check you make that uses your proficiency with a tool."
  },
  {
    "id": "art-flash-of-genius",
    "name": "Flash of Genius",
    "level": 7,
    "source": "Artificer",
    "combat": true,
    "desc": "When you or a creature you can see within 30 ft makes an ability check or saving throw, you can use your reaction to add your INT modifier to the roll. Uses = your INT modifier (min 1), regained on a long rest. Track uses on the Combat tab."
  },
  {
    "id": "art-asi-8",
    "name": "Ability Score Improvement",
    "level": 8,
    "source": "Artificer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "art-magic-item-adept",
    "name": "Magic Item Adept",
    "level": 10,
    "source": "Artificer",
    "combat": true,
    "desc": "You can attune to up to four magic items at once. Crafting a common or uncommon magic item takes you a quarter of the normal time and half the usual gold."
  },
  {
    "id": "art-spell-storing-item",
    "name": "Spell-Storing Item",
    "level": 11,
    "source": "Artificer",
    "combat": true,
    "desc": "After a long rest, touch a simple/martial weapon or a usable spellcasting focus and store a 1st- or 2nd-level artificer spell in it that has a casting time of 1 action (you needn't have it prepared). While holding the object, any creature can take an action to produce the spell's effect using your spellcasting modifier (concentration still applies). The spell remains until used a number of times equal to twice your INT modifier (min twice) or until you store another. Track the stored spell on the Combat tab."
  },
  {
    "id": "art-asi-12",
    "name": "Ability Score Improvement",
    "level": 12,
    "source": "Artificer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "art-magic-item-savant",
    "name": "Magic Item Savant",
    "level": 14,
    "source": "Artificer",
    "combat": true,
    "desc": "You can attune to up to five magic items at once, and you ignore all class, race, spell, and level requirements on attuning to or using a magic item."
  },
  {
    "id": "art-asi-16",
    "name": "Ability Score Improvement",
    "level": 16,
    "source": "Artificer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "art-magic-item-master",
    "name": "Magic Item Master",
    "level": 18,
    "source": "Artificer",
    "combat": true,
    "desc": "You can attune to up to six magic items at once."
  },
  {
    "id": "art-asi-19",
    "name": "Ability Score Improvement",
    "level": 19,
    "source": "Artificer",
    "choice": "asi",
    "desc": "Increase one ability score by 2, or two by 1 (max 20) — or take a feat."
  },
  {
    "id": "art-soul-of-artifice",
    "name": "Soul of Artifice",
    "level": 20,
    "source": "Artificer",
    "combat": true,
    "desc": "You gain a +1 bonus to all saving throws for each magic item you're currently attuned to. And if you're reduced to 0 HP but not killed outright, you can use your reaction to end one of your infusions, dropping to 1 HP instead."
  }
];
