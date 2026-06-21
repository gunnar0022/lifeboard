/** Tiefling race + subraces. */
export default {
  "name": "Tiefling",
  "race": {
    "subraces": [
      "Bloodline of Asmodeus",
      "Bloodline of Baalzebul",
      "Bloodline of Dispater",
      "Bloodline of Fierna",
      "Bloodline of Glasya",
      "Bloodline of Levistus",
      "Bloodline of Mammon",
      "Bloodline of Mephistopheles",
      "Bloodline of Zariel"
    ],
    "traits": [
      {
        "id": "tie-physiology",
        "name": "Physiology",
        "source": "Tiefling",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "tie-darkvision",
        "name": "Darkvision",
        "source": "Tiefling",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "tie-hellish",
        "name": "Hellish Resistance",
        "source": "Tiefling",
        "desc": "You have resistance to fire damage."
      },
      {
        "id": "tie-languages",
        "name": "Languages",
        "source": "Tiefling",
        "desc": "You can speak, read, and write Common and Infernal."
      }
    ]
  },
  "subraces": {
    "Bloodline of Asmodeus": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-asmodeus",
          "name": "Infernal Legacy",
          "source": "Bloodline of Asmodeus",
          "combat": true,
          "spells": [
            {
              "name": "Hellish Rebuke",
              "minLevel": 3
            },
            {
              "name": "Darkness",
              "minLevel": 5
            }
          ],
          "desc": "You know the Thaumaturgy cantrip. At 3rd level you can cast Hellish Rebuke once (as a 2nd-level spell); at 5th level you can also cast Darkness once. You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Baalzebul": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-baalzebul",
          "name": "Legacy of Maladomini",
          "source": "Bloodline of Baalzebul",
          "combat": true,
          "spells": [
            {
              "name": "Ray of Sickness",
              "minLevel": 3
            },
            {
              "name": "Crown of Madness",
              "minLevel": 5
            }
          ],
          "desc": "You know the Thaumaturgy cantrip. At 3rd level you can cast Ray of Sickness once (as a 2nd-level spell); at 5th level you can also cast Crown of Madness once. You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Dispater": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-dispater",
          "name": "Legacy of Dis",
          "source": "Bloodline of Dispater",
          "combat": true,
          "spells": [
            {
              "name": "Disguise Self",
              "minLevel": 3
            },
            {
              "name": "Detect Thoughts",
              "minLevel": 5
            }
          ],
          "desc": "You know the Thaumaturgy cantrip. At 3rd level you can cast Disguise Self once (as a 2nd-level spell); at 5th level you can also cast Detect Thoughts once. You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Fierna": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-fierna",
          "name": "Legacy of Phlegethos",
          "source": "Bloodline of Fierna",
          "combat": true,
          "spells": [
            {
              "name": "Charm Person",
              "minLevel": 3
            },
            {
              "name": "Suggestion",
              "minLevel": 5
            }
          ],
          "desc": "You know the Friends cantrip. At 3rd level you can cast Charm Person once (as a 2nd-level spell); at 5th level you can also cast Suggestion once. You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Glasya": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-glasya",
          "name": "Legacy of Malbolge",
          "source": "Bloodline of Glasya",
          "combat": true,
          "spells": [
            {
              "name": "Disguise Self",
              "minLevel": 3
            },
            {
              "name": "Invisibility",
              "minLevel": 5
            }
          ],
          "desc": "You know the Minor Illusion cantrip. At 3rd level you can cast Disguise Self once (as a 2nd-level spell); at 5th level you can also cast Invisibility once (as a 2nd-level spell). You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Levistus": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-levistus",
          "name": "Legacy of Stygia",
          "source": "Bloodline of Levistus",
          "combat": true,
          "spells": [
            {
              "name": "Armor of Agathys",
              "minLevel": 3
            },
            {
              "name": "Darkness",
              "minLevel": 5
            }
          ],
          "desc": "You know the Ray of Frost cantrip. At 3rd level you can cast Armor of Agathys once (as a 2nd-level spell); at 5th level you can also cast Darkness once. You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Mammon": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-mammon",
          "name": "Legacy of Minauros",
          "source": "Bloodline of Mammon",
          "combat": true,
          "spells": [
            {
              "name": "Tenser's Floating Disk",
              "minLevel": 3
            },
            {
              "name": "Arcane Lock",
              "minLevel": 5
            }
          ],
          "desc": "You know the Mage Hand cantrip. At 3rd level you can cast Tenser's Floating Disk once (as a 2nd-level spell); at 5th level you can also cast Arcane Lock once. You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Mephistopheles": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-mephistopheles",
          "name": "Legacy of Cania",
          "source": "Bloodline of Mephistopheles",
          "combat": true,
          "spells": [
            {
              "name": "Burning Hands",
              "minLevel": 3
            },
            {
              "name": "Flame Blade",
              "minLevel": 5
            }
          ],
          "desc": "You know the Mage Hand cantrip. At 3rd level you can cast Burning Hands once (as a 2nd-level spell); at 5th level you can also cast Flame Blade once (as a 3rd-level spell). You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    },
    "Bloodline of Zariel": {
      "race": "Tiefling",
      "traits": [
        {
          "id": "tie-zariel",
          "name": "Legacy of Avernus",
          "source": "Bloodline of Zariel",
          "combat": true,
          "spells": [
            {
              "name": "Searing Smite",
              "minLevel": 3
            },
            {
              "name": "Branding Smite",
              "minLevel": 5
            }
          ],
          "desc": "You know the Thaumaturgy cantrip. At 3rd level you can cast Searing Smite once (as a 2nd-level spell); at 5th level you can also cast Branding Smite once (as a 3rd-level spell). You regain both with a long rest. Charisma is your spellcasting ability for these spells."
        }
      ]
    }
  }
};
