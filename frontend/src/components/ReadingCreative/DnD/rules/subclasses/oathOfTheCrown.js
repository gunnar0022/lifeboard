/**
 * Oath of the Crown — Paladin subclass. A guardian of civilization. Flavor on
 * the Features tab; the Combat-tab CrownBlock surfaces the two Channel Divinity
 * options (one of them a heal) plus the protective reaction and capstone.
 */
export default {
  name: 'Oath of the Crown',
  className: 'Paladin',
  features: [
    {
      id: 'crown-tenets', name: 'Tenets of the Crown', level: 3,
      source: 'Oath of the Crown', noTruncate: true,
      desc: 'Uphold the society you serve. • Law: the law is paramount, the mortar of civilization. • Loyalty: your word is your bond — without it, oaths and laws are meaningless. • Courage: do what must be done for order, even against overwhelming odds. • Responsibility: own the consequences of your actions and fulfill your duties.',
    },
    {
      id: 'crown-spells', name: 'Oath of the Crown Spells', level: 3,
      source: 'Oath of the Crown',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Command, Compelled Duel · 5th Warding Bond, Zone of Truth · 9th Aura of Vitality, Spirit Guardians · 13th Banishment, Guardian of Faith · 17th Circle of Power, Geas. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'crown-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of the Crown', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Champion Challenge: bonus action — each creature of your choice within 30 ft. makes a WIS save or can\'t willingly move more than 30 ft. away from you. • Turn the Tide: bonus action — each creature of your choice within 30 ft. that can hear you and has no more than half its HP regains 1d6 + your Charisma modifier (minimum 1) HP.',
    },
    {
      id: 'crown-allegiance', name: 'Divine Allegiance', level: 7,
      source: 'Oath of the Crown', combat: true,
      desc: "When a creature within 5 ft. of you takes damage, you can use your reaction to take that damage yourself instead — this damage to you can't be reduced or prevented in any way.",
    },
    {
      id: 'crown-saint', name: 'Unyielding Saint', level: 15,
      source: 'Oath of the Crown', combat: true,
      desc: 'You have advantage on saving throws to avoid becoming paralyzed or stunned.',
    },
    {
      id: 'crown-exalted', name: 'Exalted Champion', level: 20,
      source: 'Oath of the Crown', combat: true,
      desc: 'Action: for 1 hour, gain resistance to nonmagical bludgeoning, piercing, and slashing damage; you and allies within 30 ft. have advantage on Wisdom saves; and allies within 30 ft. have advantage on death saving throws. Ends early if you are incapacitated or die. Once per long rest.',
    },
  ],
};
