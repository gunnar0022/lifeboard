/** Half-Orc race + subraces. */
export default {
  "name": "Half-Orc",
  "race": {
    "traits": [
      {
        "id": "horc-physiology",
        "name": "Physiology",
        "source": "Half-Orc",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "horc-darkvision",
        "name": "Darkvision",
        "source": "Half-Orc",
        "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light (shades of gray only)."
      },
      {
        "id": "horc-menacing",
        "name": "Menacing",
        "source": "Half-Orc",
        "desc": "You gain proficiency in the Intimidation skill."
      },
      {
        "id": "horc-relentless",
        "name": "Relentless Endurance",
        "source": "Half-Orc",
        "combat": true,
        "desc": "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest."
      },
      {
        "id": "horc-savage",
        "name": "Savage Attacks",
        "source": "Half-Orc",
        "desc": "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit."
      },
      {
        "id": "horc-languages",
        "name": "Languages",
        "source": "Half-Orc",
        "desc": "You can speak, read, and write Common and Orc."
      }
    ]
  },
  "subraces": {}
};
