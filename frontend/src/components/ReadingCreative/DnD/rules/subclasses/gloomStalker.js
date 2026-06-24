/**
 * Gloom Stalker — Ranger subclass. A first-strike ambusher: no per-rest pools,
 * so the Combat-tab GloomStalkerBlock leans into a flashy Dread Ambusher panel
 * (computed initiative bonus + the turn-one burst) with the rest as reminders.
 * Gloom Stalker Magic spells are always-prepared extras pinned on the Spells tab.
 */
export default {
  name: 'Gloom Stalker',
  className: 'Ranger',
  features: [
    {
      id: 'gs-magic', name: 'Gloom Stalker Magic', level: 3,
      source: 'Gloom Stalker',
      desc: "You learn an additional always-prepared ranger spell at certain levels (it doesn't count against your spells known): 3rd Disguise Self · 5th Rope Trick · 9th Fear · 13th Greater Invisibility · 17th Seeming. Pin these as Always Prepared on the Spells tab.",
    },
    {
      id: 'gs-ambusher', name: 'Dread Ambusher', level: 3,
      source: 'Gloom Stalker', combat: true,
      desc: "You add your Wisdom modifier to your initiative rolls. At the start of your first turn of each combat, your walking speed increases by 10 ft. until the end of that turn, and if you take the Attack action you can make one additional weapon attack as part of it — on a hit, that attack deals an extra 1d8 of the weapon's damage type.",
    },
    {
      id: 'gs-umbral', name: 'Umbral Sight', level: 3,
      source: 'Gloom Stalker', combat: true,
      desc: 'You gain darkvision out to 60 ft. (or +30 ft. if you already have it). While in darkness, you are invisible to any creature that relies on darkvision to see you in that darkness.',
    },
    {
      id: 'gs-ironmind', name: 'Iron Mind', level: 7,
      source: 'Gloom Stalker',
      desc: 'You gain proficiency in Wisdom saving throws. If you already have it, you instead gain proficiency in Intelligence or Charisma saving throws (your choice). Add the save proficiency on the Stats tab.',
    },
    {
      id: 'gs-flurry', name: "Stalker's Flurry", level: 11,
      source: 'Gloom Stalker', combat: true,
      desc: 'Once on each of your turns when you miss with a weapon attack, you can make another weapon attack as part of the same action.',
    },
    {
      id: 'gs-dodge', name: 'Shadowy Dodge', level: 15,
      source: 'Gloom Stalker', combat: true,
      desc: "Whenever a creature makes an attack roll against you and doesn't have advantage on the roll, you can use your reaction to impose disadvantage on it. You must use this before you know the attack's outcome.",
    },
  ],
};
