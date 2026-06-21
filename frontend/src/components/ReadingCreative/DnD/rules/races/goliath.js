/** Goliath race + subraces. */
export default {
  "name": "Goliath",
  "race": {
    "traits": [
      {
        "id": "gol-physiology",
        "name": "Physiology",
        "source": "Goliath",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "gol-little-giant",
        "name": "Little Giant",
        "source": "Goliath",
        "desc": "You have proficiency in the Athletics skill, and you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift."
      },
      {
        "id": "gol-mountain-born",
        "name": "Mountain Born",
        "source": "Goliath",
        "desc": "You have resistance to cold damage. You also naturally acclimate to high altitudes, even those above 20,000 feet, even if you've never been to one."
      },
      {
        "id": "gol-stones-endurance",
        "name": "Stone's Endurance",
        "source": "Goliath",
        "combat": true,
        "desc": "When you take damage, you can use your reaction to roll a d12, add your Constitution modifier, and reduce the damage by that total. You can use this a number of times equal to your proficiency bonus, regaining all expended uses when you finish a long rest."
      },
      {
        "id": "gol-languages",
        "name": "Languages",
        "source": "Goliath",
        "choice": "language",
        "desc": "You can speak, read, and write Common and one other language of your choice (with your DM's approval)."
      }
    ]
  },
  "subraces": {}
};
