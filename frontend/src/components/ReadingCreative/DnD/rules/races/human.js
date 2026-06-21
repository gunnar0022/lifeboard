/** Human race + subraces. */
export default {
  "name": "Human",
  "race": {
    "traits": [
      {
        "id": "hum-physiology",
        "name": "Physiology",
        "source": "Human",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "hum-versatility",
        "name": "Human Versatility",
        "source": "Human",
        "choice": "versatility",
        "options": [
          {
            "name": "Standard",
            "desc": "Your ability scores each increase by 1."
          },
          {
            "name": "Variant",
            "desc": "Instead of the standard +1 to all: two different ability scores of your choice increase by 1, you gain proficiency in one skill of your choice, and you gain one feat of your choice."
          }
        ],
        "desc": "Choose your human origin: standard or variant."
      },
      {
        "id": "hum-languages",
        "name": "Languages",
        "source": "Human",
        "choice": "language",
        "desc": "You can speak, read, and write Common and one extra language of your choice."
      }
    ]
  },
  "subraces": {}
};
