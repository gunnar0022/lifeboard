/**
 * Horizon Walker — Ranger subclass. A planar skirmisher. The Combat-tab block
 * headlines Planar Warrior (scaling force-damage strike with an optional marked
 * target) and tracks the two short-rest abilities (Detect Portal, Ethereal Step);
 * Distant Strike and the at-will Spectral Defense reaction ride as reminders.
 */
export default {
  name: 'Horizon Walker',
  className: 'Ranger',
  features: [
    {
      id: 'hw-magic', name: 'Horizon Walker Magic', level: 3,
      source: 'Horizon Walker',
      desc: "You learn an additional always-prepared ranger spell at certain levels (it doesn't count against your spells known): 3rd Protection from Evil and Good · 5th Misty Step · 9th Haste · 13th Banishment · 17th Teleportation Circle. Pin these as Always Prepared on the Spells tab.",
    },
    {
      id: 'hw-detect', name: 'Detect Portal', level: 3,
      source: 'Horizon Walker', combat: true,
      desc: 'As an action, detect the distance and direction to the closest planar portal within 1 mile. Once per short or long rest.',
    },
    {
      id: 'hw-planar', name: 'Planar Warrior', level: 3,
      source: 'Horizon Walker', combat: true,
      desc: 'As a bonus action, choose a creature within 30 ft. The next time you hit it with a weapon attack this turn, all the attack\'s damage becomes force and it takes an extra 1d8 force damage (2d8 at 11th level).',
    },
    {
      id: 'hw-ethereal', name: 'Ethereal Step', level: 7,
      source: 'Horizon Walker', combat: true,
      desc: 'As a bonus action, cast Etherealness without a spell slot, but it ends at the end of the current turn. Once per short or long rest.',
    },
    {
      id: 'hw-distant', name: 'Distant Strike', level: 11,
      source: 'Horizon Walker', combat: true,
      desc: 'On your Attack action, you can teleport up to 10 ft. before each attack to a space you can see. If you attack at least two different creatures with the action, you can make one additional attack against a third creature.',
    },
    {
      id: 'hw-spectral', name: 'Spectral Defense', level: 15,
      source: 'Horizon Walker', combat: true,
      desc: "When you take damage from an attack, you can use your reaction to give yourself resistance to all of that attack's damage on this turn.",
    },
  ],
};
