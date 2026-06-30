/** Uma race + subraces. */
export default {
  "name": "Uma",
  "race": {
    "traits": [
      {
        "id": "uma-physiology",
        "name": "Physiology",
        "source": "Uma",
        "desc": "Medium Humanoid. Walking speed 35 ft."
      },
      {
        "id": "uma-thundering-rush",
        "name": "Thundering Rush",
        "source": "Uma",
        "desc": "If you move at least 25 feet straight toward a target, you can make a leaping kick as a bonus action, rolled with expertise. On a hit, deal 1d6 bludgeoning damage; on a miss, you land prone behind the target.",
        "attack": {
          "name": "Thundering Rush (Leaping Kick)",
          "ability": "STR",
          "proficient": true,
          "expertise": true,
          "damage": "1d6",
          "addAbilityToDamage": false,
          "damageType": "bludgeoning",
          "actionType": "bonus",
          "note": "Move 25+ ft straight toward the target first. Miss: you land prone behind it."
        }
      },
      {
        "id": "uma-equine-build",
        "name": "Equine Build",
        "source": "Uma",
        "desc": "You count as one size larger when determining your carrying capacity and the weight you can push or drag."
      },
      {
        "id": "uma-natural-affinity",
        "name": "Natural Affinity",
        "source": "Uma",
        "choice": "skill",
        "options": [
          "Animal Handling",
          "Medicine",
          "Nature",
          "Survival"
        ],
        "desc": "Your fey connection to nature grants you proficiency in one of the following skills of your choice: Animal Handling, Medicine, Nature, or Survival."
      },
      {
        "id": "uma-languages",
        "name": "Languages",
        "source": "Uma",
        "choice": "language",
        "desc": "You can speak, read, and write Common and one other language of your choice (with your DM's approval)."
      }
    ]
  },
  "subraces": {}
};
