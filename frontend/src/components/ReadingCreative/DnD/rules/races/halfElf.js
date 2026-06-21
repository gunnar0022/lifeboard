/** Half-Elf race + subraces. */
export default {
  "name": "Half-Elf",
  "race": {
    "traits": [
      {
        "id": "helf-physiology",
        "name": "Physiology",
        "source": "Half-Elf",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "helf-darkvision",
        "name": "Darkvision",
        "source": "Half-Elf",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "helf-fey-ancestry",
        "name": "Fey Ancestry",
        "source": "Half-Elf",
        "desc": "You have advantage on saving throws against being charmed, and magic can't put you to sleep."
      },
      {
        "id": "helf-versatility",
        "name": "Half-Elf Versatility",
        "source": "Half-Elf",
        "choice": "versatility",
        "options": [
          {
            "name": "Skill Versatility",
            "desc": "You gain proficiency in two skills of your choice."
          },
          {
            "name": "Elf Weapon Training",
            "desc": "You have proficiency with the longsword, shortsword, shortbow, and longbow."
          },
          {
            "name": "Cantrip",
            "desc": "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it."
          },
          {
            "name": "Fleet of Foot",
            "desc": "Your base walking speed increases to 35 feet."
          },
          {
            "name": "Mask of the Wild",
            "desc": "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena."
          },
          {
            "name": "Drow Magic",
            "desc": "You know the Dancing Lights cantrip. At 3rd level you can cast Faerie Fire once per long rest; at 5th level, Darkness once per long rest. Charisma is your spellcasting ability for these spells."
          },
          {
            "name": "Swim Speed",
            "desc": "You have a swimming speed of 30 feet."
          }
        ],
        "desc": "Choose one versatility trait, reflecting your elven heritage."
      },
      {
        "id": "helf-languages",
        "name": "Languages",
        "source": "Half-Elf",
        "choice": "language",
        "desc": "You can speak, read, and write Common, Elven, and one extra language of your choice."
      }
    ]
  },
  "subraces": {}
};
