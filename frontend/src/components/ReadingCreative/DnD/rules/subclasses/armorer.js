/**
 * Armorer — Artificer specialist. The identity is the Arcane Armor and its two
 * swappable models (Guardian / Infiltrator). The Combat-tab ArmorerBlock is a
 * model switch that surfaces the active model's special weapon and trackable
 * resources (Guardian's Defensive Field; the Perfected pull at 15th), with
 * Infiltrator's launcher and stealth as the alternative loadout.
 */
export default {
  name: 'Armorer',
  className: 'Artificer',
  features: [
    {
      id: 'arm-tools', name: 'Tools of the Trade', level: 3,
      source: 'Armorer',
      desc: "You gain proficiency with heavy armor and with smith's tools. If you already have smith's tools, gain proficiency with one other type of artisan's tools of your choice.",
    },
    {
      id: 'arm-spells', name: 'Armorer Spells', level: 3,
      source: 'Armorer',
      desc: "Always-prepared spells (they don't count against your prepared spells): 3rd Magic Missile, Thunderwave · 5th Mirror Image, Shatter · 9th Hypnotic Pattern, Lightning Bolt · 13th Fire Shield, Greater Invisibility · 17th Passwall, Wall of Force. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'arm-arcane-armor', name: 'Arcane Armor', level: 3,
      source: 'Armorer', combat: true, noTruncate: true,
      desc: "Action (smith's tools in hand): turn a suit of armor you wear into Arcane Armor. It ignores any Strength requirement, serves as your spellcasting focus, attaches to you (can't be removed against your will), covers your whole body, replaces missing limbs, and you can retract/deploy the helmet as a bonus action. You can doff or don it as an action. It stays Arcane Armor until you don another suit or die.",
    },
    {
      id: 'arm-model', name: 'Armor Model', level: 3,
      source: 'Armorer', combat: true,
      desc: "Customize your Arcane Armor as Guardian or Infiltrator (swap on a short or long rest with smith's tools). Each includes a special weapon that uses your INT modifier for attack and damage. Guardian: Thunder Gauntlets (1d8 thunder; hit imposes disadvantage on the target's attacks vs. others) + Defensive Field (bonus action: temp HP = artificer level, PB uses/long rest). Infiltrator: Lightning Launcher (1d6 lightning, 90/300 ft, +1d6 once per turn) + Powered Steps (+5 ft speed) + Dampening Field (advantage on Stealth). Switch models on the Combat tab.",
    },
    {
      id: 'arm-extra-attack', name: 'Extra Attack', level: 5,
      source: 'Armorer',
      desc: 'You can attack twice, rather than once, whenever you take the Attack action on your turn.',
    },
    {
      id: 'arm-mods', name: 'Armor Modifications', level: 9,
      source: 'Armorer', combat: true,
      desc: "Your Arcane Armor counts as four separate items for Infuse Item — armor, boots, helmet, and its special weapon — each able to bear an infusion (infusions transfer when you change model). Your maximum infused items also increases by 2, but those extra items must be part of your Arcane Armor.",
    },
    {
      id: 'arm-perfected', name: 'Perfected Armor', level: 15,
      source: 'Armorer', combat: true,
      desc: "Guardian: when a Huge or smaller creature ends its turn within 30 ft, use your reaction to force a STR save (your spell DC); on a failure, pull it up to 25 ft, and if it lands within 5 ft you can make a melee attack against it (PB uses/long rest). Infiltrator: a creature that takes Lightning Launcher damage glimmers until your next turn — it sheds dim light (5 ft), has disadvantage on attacks against you, the next attack against it has advantage, and that hit deals +1d6 lightning.",
    },
  ],
};
