/** Tabaxi race + subraces. */
export default {
  "name": "Tabaxi",
  "race": {
    "traits": [
      {
        "id": "tab-physiology",
        "name": "Physiology",
        "source": "Tabaxi",
        "desc": "Medium or Small Humanoid (your choice). Walking speed 30 ft, with a climbing speed equal to your walking speed."
      },
      {
        "id": "tab-claws",
        "name": "Cat's Claws",
        "source": "Tabaxi",
        "desc": "You can use your claws to make unarmed strikes. On a hit they deal 1d6 + your Strength modifier slashing damage, instead of the normal bludgeoning damage.",
        "attack": {
          "name": "Cat's Claws",
          "ability": "STR",
          "proficient": true,
          "damage": "1d6",
          "addAbilityToDamage": true,
          "damageType": "slashing",
          "actionType": "action",
          "note": "Unarmed strike."
        }
      },
      {
        "id": "tab-talent",
        "name": "Cat's Talent",
        "source": "Tabaxi",
        "desc": "You have proficiency in the Perception and Stealth skills."
      },
      {
        "id": "tab-darkvision",
        "name": "Darkvision",
        "source": "Tabaxi",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "tab-feline-agility",
        "name": "Feline Agility",
        "source": "Tabaxi",
        "desc": "When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this trait, you can't use it again until you move 0 feet on one of your turns."
      },
      {
        "id": "tab-languages",
        "name": "Languages",
        "source": "Tabaxi",
        "choice": "language",
        "desc": "You can speak, read, and write Common and one other language of your choice (with your DM's approval)."
      }
    ]
  },
  "subraces": {}
};
