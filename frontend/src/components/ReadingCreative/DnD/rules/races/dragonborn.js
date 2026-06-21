/** Dragonborn race + subraces. */
export default {
  "name": "Dragonborn",
  "race": {
    "traits": [
      {
        "id": "drb-physiology",
        "name": "Physiology",
        "source": "Dragonborn",
        "desc": "Medium Humanoid. Walking speed 30 ft."
      },
      {
        "id": "drb-ancestry",
        "name": "Draconic Ancestry",
        "source": "Dragonborn",
        "choice": "dragon",
        "desc": "You are distantly related to a particular kind of dragon. Choose a dragon type; it determines your breath weapon's damage type, area, and saving throw, and the damage type you resist."
      },
      {
        "id": "drb-breath",
        "name": "Breath Weapon",
        "source": "Dragonborn",
        "combat": true,
        "desc": "As an action, you exhale destructive energy in an area determined by your ancestry. Each creature in the area makes a saving throw (DC = 8 + your Constitution modifier + your proficiency bonus), taking 2d6 damage on a failed save and half as much on a success. The damage increases to 3d6 at 6th level, 4d6 at 11th, and 5d6 at 16th. Once you use it, you can't use it again until you finish a short or long rest."
      },
      {
        "id": "drb-resistance",
        "name": "Damage Resistance",
        "source": "Dragonborn",
        "desc": "You have resistance to the damage type associated with your draconic ancestry."
      },
      {
        "id": "drb-languages",
        "name": "Languages",
        "source": "Dragonborn",
        "desc": "You can speak, read, and write Common and Draconic."
      }
    ]
  },
  "subraces": {}
};
