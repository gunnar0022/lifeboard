/**
 * Oath of Conquest — Paladin subclass. Fear and domination. Flavor on the
 * Features tab; the Combat-tab ConquestBlock surfaces the two Channel Divinity
 * options plus the fear-leveraging aura and the trackable capstone.
 */
export default {
  name: 'Oath of Conquest',
  className: 'Paladin',
  features: [
    {
      id: 'con-tenets', name: 'Tenets of Conquest', level: 3,
      source: 'Oath of Conquest', noTruncate: true,
      desc: 'Rule through overwhelming force. • Douse the Flame of Hope: victory must shatter the enemy\'s will to fight — fear can end an empire. • Rule with an Iron Fist: once you have conquered, tolerate no dissent; your word is law. • Strength Above All: rule until a stronger one arises, then grow mightier or fall.',
    },
    {
      id: 'con-spells', name: 'Oath of Conquest Spells', level: 3,
      source: 'Oath of Conquest',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Armor of Agathys, Command · 5th Hold Person, Spiritual Weapon · 9th Bestow Curse, Fear · 13th Dominate Beast, Stoneskin · 17th Cloudkill, Dominate Person. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'con-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of Conquest', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Conquering Presence: action — each creature of your choice within 30 ft. makes a WIS save or is frightened of you for 1 minute (repeating the save at the end of each turn). • Guided Strike: gain a +10 bonus to one attack roll (decide after seeing the roll, before the result).',
    },
    {
      id: 'con-aura', name: 'Aura of Conquest', level: 7,
      source: 'Oath of Conquest', combat: true,
      desc: "While you're not incapacitated, you emanate a 10-ft. aura (not through total cover). A creature frightened of you has its speed reduced to 0 in the aura and takes psychic damage equal to half your paladin level if it starts its turn there. The aura increases to 30 ft. at 18th level.",
    },
    {
      id: 'con-rebuke', name: 'Scornful Rebuke', level: 15,
      source: 'Oath of Conquest', combat: true,
      desc: "While you're not incapacitated, whenever a creature hits you with an attack, it takes psychic damage equal to your Charisma modifier (minimum 1).",
    },
    {
      id: 'con-avatar', name: 'Invincible Conqueror', level: 20,
      source: 'Oath of Conquest', combat: true,
      desc: 'Action: for 1 minute, gain resistance to all damage; make one extra attack as part of your Attack action; and your melee weapon attacks score a critical hit on a 19 or 20. Once per long rest.',
    },
  ],
};
