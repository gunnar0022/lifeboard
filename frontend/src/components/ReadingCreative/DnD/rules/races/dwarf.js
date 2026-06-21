/** Dwarf race + subraces. */
export default {
  "name": "Dwarf",
  "race": {
    "subraces": [
      "Hill Dwarf",
      "Mountain Dwarf"
    ],
    "traits": [
      {
        "id": "dwa-physiology",
        "name": "Physiology",
        "source": "Dwarf",
        "desc": "Medium Humanoid. Walking speed 25 ft, which is not reduced by wearing heavy armor."
      },
      {
        "id": "dwa-darkvision",
        "name": "Darkvision",
        "source": "Dwarf",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "dwa-resilience",
        "name": "Dwarven Resilience",
        "source": "Dwarf",
        "desc": "You have advantage on saving throws against poison, and you have resistance against poison damage."
      },
      {
        "id": "dwa-combat-training",
        "name": "Dwarven Combat Training",
        "source": "Dwarf",
        "desc": "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer."
      },
      {
        "id": "dwa-tool-prof",
        "name": "Tool Proficiency",
        "source": "Dwarf",
        "choice": "tool",
        "options": [
          "Smith's Tools",
          "Brewer's Supplies",
          "Mason's Tools"
        ],
        "desc": "You gain proficiency with the artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools."
      },
      {
        "id": "dwa-stonecunning",
        "name": "Stonecunning",
        "source": "Dwarf",
        "desc": "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check."
      },
      {
        "id": "dwa-languages",
        "name": "Languages",
        "source": "Dwarf",
        "desc": "You can speak, read, and write Common and Dwarvish."
      }
    ]
  },
  "subraces": {
    "Hill Dwarf": {
      "race": "Dwarf",
      "traits": [
        {
          "id": "dwa-hill-toughness",
          "name": "Dwarven Toughness",
          "source": "Hill Dwarf",
          "desc": "Your hit point maximum increases by 1, and it increases by 1 again every time you gain a level."
        }
      ]
    },
    "Mountain Dwarf": {
      "race": "Dwarf",
      "traits": [
        {
          "id": "dwa-mtn-armor",
          "name": "Dwarven Armor Training",
          "source": "Mountain Dwarf",
          "desc": "You have proficiency with light and medium armor."
        }
      ]
    }
  }
};
