/** Fairy race + subraces. */
export default {
  "name": "Fairy",
  "race": {
    "traits": [
      {
        "id": "fae-physiology",
        "name": "Physiology",
        "source": "Fairy",
        "desc": "Small Fey. Walking speed 30 ft."
      },
      {
        "id": "fae-magic",
        "name": "Fairy Magic",
        "source": "Fairy",
        "combat": true,
        "choice": "spellAbility",
        "spells": [
          {
            "name": "Faerie Fire",
            "minLevel": 3
          },
          {
            "name": "Enlarge/Reduce",
            "minLevel": 5
          }
        ],
        "desc": "You know the Druidcraft cantrip. At 3rd level you can cast Faerie Fire with this trait; at 5th level you can also cast Enlarge/Reduce. Once you cast either with this trait, you can't cast that spell with it again until you finish a long rest (you can also cast them using spell slots). Choose Intelligence, Wisdom, or Charisma as your spellcasting ability for these spells."
      },
      {
        "id": "fae-flight",
        "name": "Flight",
        "source": "Fairy",
        "desc": "Because of your wings, you have a flying speed equal to your walking speed. You can't use this flying speed while wearing medium or heavy armor."
      },
      {
        "id": "fae-languages",
        "name": "Languages",
        "source": "Fairy",
        "choice": "language",
        "desc": "You can speak, read, and write Common and one other language of your choice."
      }
    ]
  },
  "subraces": {}
};
