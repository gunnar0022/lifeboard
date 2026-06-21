/** Halfling race + subraces. */
export default {
  "name": "Halfling",
  "race": {
    "subraces": [
      "Lightfoot",
      "Stout"
    ],
    "traits": [
      {
        "id": "hfl-physiology",
        "name": "Physiology",
        "source": "Halfling",
        "desc": "Small Humanoid. Walking speed 25 ft."
      },
      {
        "id": "hfl-lucky",
        "name": "Lucky",
        "source": "Halfling",
        "desc": "When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll."
      },
      {
        "id": "hfl-brave",
        "name": "Brave",
        "source": "Halfling",
        "desc": "You have advantage on saving throws against being frightened."
      },
      {
        "id": "hfl-nimble",
        "name": "Halfling Nimbleness",
        "source": "Halfling",
        "desc": "You can move through the space of any creature that is of a size larger than yours."
      },
      {
        "id": "hfl-languages",
        "name": "Languages",
        "source": "Halfling",
        "desc": "You can speak, read, and write Common and Halfling."
      }
    ]
  },
  "subraces": {
    "Lightfoot": {
      "race": "Halfling",
      "traits": [
        {
          "id": "hfl-lightfoot-stealthy",
          "name": "Naturally Stealthy",
          "source": "Lightfoot",
          "desc": "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you."
        }
      ]
    },
    "Stout": {
      "race": "Halfling",
      "traits": [
        {
          "id": "hfl-stout-resilience",
          "name": "Stout Resilience",
          "source": "Stout",
          "desc": "You have advantage on saving throws against poison, and you have resistance against poison damage."
        }
      ]
    }
  }
};
