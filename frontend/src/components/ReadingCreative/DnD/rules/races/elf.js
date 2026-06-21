/** Elf race + subraces. */
export default {
  "name": "Elf",
  "race": {
    "subraces": [
      "Dark Elf",
      "High Elf",
      "Wood Elf"
    ],
    "traits": [
      {
        "id": "elf-physiology",
        "name": "Physiology",
        "source": "Elf",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "elf-darkvision",
        "name": "Darkvision",
        "source": "Elf",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "elf-fey-ancestry",
        "name": "Fey Ancestry",
        "source": "Elf",
        "desc": "You have advantage on saving throws against being charmed, and magic can't put you to sleep."
      },
      {
        "id": "elf-trance",
        "name": "Trance",
        "source": "Elf",
        "desc": "Elves don't sleep. Instead they meditate deeply, remaining semiconscious, for 4 hours a day, gaining the same benefit a human does from 8 hours of sleep."
      },
      {
        "id": "elf-keen-senses",
        "name": "Keen Senses",
        "source": "Elf",
        "desc": "You have proficiency in the Perception skill."
      },
      {
        "id": "elf-languages",
        "name": "Languages",
        "source": "Elf",
        "desc": "You can speak, read, and write Common and Elven."
      }
    ]
  },
  "subraces": {
    "Dark Elf": {
      "race": "Elf",
      "traits": [
        {
          "id": "elf-drow-darkvision",
          "name": "Superior Darkvision",
          "source": "Dark Elf",
          "desc": "Your darkvision has a range of 120 feet, instead of 60."
        },
        {
          "id": "elf-drow-sunlight",
          "name": "Sunlight Sensitivity",
          "source": "Dark Elf",
          "desc": "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight."
        },
        {
          "id": "elf-drow-magic",
          "name": "Drow Magic",
          "source": "Dark Elf",
          "desc": "You know the Dancing Lights cantrip. At 3rd level you can cast Faerie Fire once per long rest; at 5th level you can cast Darkness once per long rest. Charisma is your spellcasting ability for these spells."
        },
        {
          "id": "elf-drow-weapons",
          "name": "Drow Weapon Training",
          "source": "Dark Elf",
          "desc": "You have proficiency with rapiers, shortswords, and hand crossbows."
        }
      ]
    },
    "High Elf": {
      "race": "Elf",
      "traits": [
        {
          "id": "elf-high-cantrip",
          "name": "Cantrip",
          "source": "High Elf",
          "choice": "cantrip",
          "desc": "You know one cantrip of your choice from the Wizard spell list. Intelligence is your spellcasting ability for it."
        },
        {
          "id": "elf-high-weapons",
          "name": "Elf Weapon Training",
          "source": "High Elf",
          "desc": "You have proficiency with the longsword, shortsword, shortbow, and longbow."
        },
        {
          "id": "elf-high-language",
          "name": "Extra Language",
          "source": "High Elf",
          "choice": "language",
          "desc": "You can speak, read, and write one extra language of your choice."
        }
      ]
    },
    "Wood Elf": {
      "race": "Elf",
      "traits": [
        {
          "id": "elf-wood-weapons",
          "name": "Elf Weapon Training",
          "source": "Wood Elf",
          "desc": "You have proficiency with the longsword, shortsword, shortbow, and longbow."
        },
        {
          "id": "elf-wood-fleet",
          "name": "Fleet of Foot",
          "source": "Wood Elf",
          "desc": "Your base walking speed increases to 35 feet."
        },
        {
          "id": "elf-wood-mask",
          "name": "Mask of the Wild",
          "source": "Wood Elf",
          "desc": "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena."
        }
      ]
    }
  }
};
