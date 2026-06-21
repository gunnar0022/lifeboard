/** Gnome race + subraces. */
export default {
  "name": "Gnome",
  "race": {
    "subraces": [
      "Forest Gnome",
      "Rock Gnome"
    ],
    "traits": [
      {
        "id": "gno-physiology",
        "name": "Physiology",
        "source": "Gnome",
        "desc": "Small Humanoid. Walking speed 25 ft."
      },
      {
        "id": "gno-darkvision",
        "name": "Darkvision",
        "source": "Gnome",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "gno-cunning",
        "name": "Gnome Cunning",
        "source": "Gnome",
        "desc": "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic."
      },
      {
        "id": "gno-languages",
        "name": "Languages",
        "source": "Gnome",
        "desc": "You can speak, read, and write Common and Gnomish."
      }
    ]
  },
  "subraces": {
    "Forest Gnome": {
      "race": "Gnome",
      "traits": [
        {
          "id": "gno-forest-illusionist",
          "name": "Natural Illusionist",
          "source": "Forest Gnome",
          "desc": "You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it."
        },
        {
          "id": "gno-forest-beasts",
          "name": "Speak with Small Beasts",
          "source": "Forest Gnome",
          "desc": "Through sound and gestures, you can communicate simple ideas with Small or smaller beasts."
        }
      ]
    },
    "Rock Gnome": {
      "race": "Gnome",
      "traits": [
        {
          "id": "gno-rock-lore",
          "name": "Artificer's Lore",
          "source": "Rock Gnome",
          "desc": "Whenever you make an Intelligence (History) check related to magical, alchemical, or technological items, you add twice your proficiency bonus instead of any other proficiency bonus that may apply."
        },
        {
          "id": "gno-rock-tinker",
          "name": "Tinker",
          "source": "Rock Gnome",
          "desc": "You have proficiency with tinker's tools. Using them, you can spend 1 hour and 10 gp of materials to construct a Tiny clockwork device (AC 5, 1 hp) — a Clockwork Toy, Fire Starter, or Music Box. It functions for 24 hours (or until you dismantle it or stop repairing it), and you can have up to three active at a time."
        }
      ]
    }
  }
};
