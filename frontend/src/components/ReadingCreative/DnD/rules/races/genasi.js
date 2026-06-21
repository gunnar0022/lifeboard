/** Genasi race + subraces. */
export default {
  "name": "Genasi",
  "race": {
    "subraces": [
      "Air Genasi",
      "Earth Genasi",
      "Fire Genasi",
      "Water Genasi"
    ],
    "traits": [
      {
        "id": "gen-physiology",
        "name": "Physiology",
        "source": "Genasi",
        "desc": "Medium or Small Humanoid (your choice). Walking speed 35 ft."
      },
      {
        "id": "gen-darkvision",
        "name": "Darkvision",
        "source": "Genasi",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light."
      },
      {
        "id": "gen-spellcasting",
        "name": "Elemental Spellcasting",
        "source": "Genasi",
        "choice": "spellAbility",
        "desc": "Choose Intelligence, Wisdom, or Charisma as your spellcasting ability for the elemental spells granted by your Genasi variant."
      },
      {
        "id": "gen-languages",
        "name": "Languages",
        "source": "Genasi",
        "choice": "language",
        "desc": "You can speak, read, and write Common and one other language of your choice."
      }
    ]
  },
  "subraces": {
    "Air Genasi": {
      "race": "Genasi",
      "traits": [
        {
          "id": "gen-air-breath",
          "name": "Unending Breath",
          "source": "Air Genasi",
          "desc": "You can hold your breath indefinitely while you aren't incapacitated."
        },
        {
          "id": "gen-air-resist",
          "name": "Lightning Resistance",
          "source": "Air Genasi",
          "desc": "You have resistance to lightning damage."
        },
        {
          "id": "gen-air-mingle",
          "name": "Mingle with the Wind",
          "source": "Air Genasi",
          "combat": true,
          "spells": [
            {
              "name": "Feather Fall",
              "minLevel": 3
            },
            {
              "name": "Levitate",
              "minLevel": 5
            }
          ],
          "desc": "You know the Shocking Grasp cantrip. At 3rd level you can cast Feather Fall with this trait; at 5th level you can also cast Levitate. Once you cast either with this trait, you can't cast that spell with it again until you finish a long rest (you can also use spell slots). Uses your chosen elemental spellcasting ability."
        }
      ]
    },
    "Earth Genasi": {
      "race": "Genasi",
      "traits": [
        {
          "id": "gen-earth-walk",
          "name": "Earth Walk",
          "source": "Earth Genasi",
          "desc": "You can move across difficult terrain made of earth or stone without expending extra movement."
        },
        {
          "id": "gen-earth-merge",
          "name": "Merge with Stone",
          "source": "Earth Genasi",
          "combat": true,
          "spells": [
            {
              "name": "Blade Ward",
              "minLevel": 1,
              "uses": "pb"
            },
            {
              "name": "Pass Without Trace",
              "minLevel": 5
            }
          ],
          "desc": "You know the Blade Ward cantrip; you can also cast it as a bonus action a number of times equal to your proficiency bonus, regaining all uses on a long rest. At 5th level you can cast Pass Without Trace once with this trait, regaining it on a long rest (or use a 2nd-level-or-higher slot). Uses your chosen elemental spellcasting ability."
        }
      ]
    },
    "Fire Genasi": {
      "race": "Genasi",
      "traits": [
        {
          "id": "gen-fire-resist",
          "name": "Fire Resistance",
          "source": "Fire Genasi",
          "desc": "You have resistance to fire damage."
        },
        {
          "id": "gen-fire-blaze",
          "name": "Reach to the Blaze",
          "source": "Fire Genasi",
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
          "desc": "You know the Produce Flame cantrip. At 3rd level you can cast Burning Hands with this trait; at 5th level you can also cast Flame Blade. Once you cast either with this trait, you can't cast that spell with it again until you finish a long rest (you can also use spell slots). Uses your chosen elemental spellcasting ability."
        }
      ]
    },
    "Water Genasi": {
      "race": "Genasi",
      "traits": [
        {
          "id": "gen-water-resist",
          "name": "Acid Resistance",
          "source": "Water Genasi",
          "desc": "You have resistance to acid damage."
        },
        {
          "id": "gen-water-amphibious",
          "name": "Amphibious",
          "source": "Water Genasi",
          "desc": "You can breathe air and water."
        },
        {
          "id": "gen-water-wave",
          "name": "Call to the Wave",
          "source": "Water Genasi",
          "combat": true,
          "spells": [
            {
              "name": "Create or Destroy Water",
              "minLevel": 3
            },
            {
              "name": "Water Walk",
              "minLevel": 5
            }
          ],
          "desc": "You know the Acid Splash cantrip. At 3rd level you can cast Create or Destroy Water with this trait; at 5th level you can also cast Water Walk. Once you cast either with this trait, you can't cast that spell with it again until you finish a long rest (you can also use spell slots). Uses your chosen elemental spellcasting ability."
        }
      ]
    }
  }
};
