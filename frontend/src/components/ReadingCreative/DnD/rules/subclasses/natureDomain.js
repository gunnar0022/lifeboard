/**
 * Nature Domain — Cleric. A priest of the wild. Channel Divinity: Charm Animals
 * and Plants headlines the cleric-styled NatureDomainBlock, with a choosable
 * Divine Strike damage type and Dampen Elements / Master of Nature reminders.
 */
export default {
  name: 'Nature Domain',
  className: 'Cleric',
  features: [
    {
      id: 'nature-spells', name: 'Nature Domain Spells', level: 1,
      source: 'Nature Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Animal Friendship, Speak with Animals · 3rd Barkskin, Spike Growth · 5th Plant Growth, Wind Wall · 7th Dominate Beast, Grasping Vine · 9th Insect Plague, Tree Stride. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'nature-acolyte', name: 'Acolyte of Nature', level: 1,
      source: 'Nature Domain',
      desc: "You learn one druid cantrip (counts as a cleric cantrip, doesn't count against your known; add it on the Spells tab) and gain proficiency in one of Animal Handling, Nature, or Survival.",
    },
    {
      id: 'nature-bonus-prof', name: 'Bonus Proficiency', level: 1,
      source: 'Nature Domain',
      desc: 'You gain proficiency with heavy armor.',
    },
    {
      id: 'nature-charm', name: 'Channel Divinity: Charm Animals and Plants', level: 2,
      source: 'Nature Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use; each beast or plant creature within 30 ft that can see you makes a WIS save or is charmed by you for 1 minute (or until it takes damage), becoming friendly to you and your allies. Spend the use on the Combat tab.',
    },
    {
      id: 'nature-dampen', name: 'Dampen Elements', level: 6,
      source: 'Nature Domain', combat: true,
      desc: 'Reaction: when you or a creature within 30 ft takes acid, cold, fire, lightning, or thunder damage, grant that creature resistance against that instance of damage.',
    },
    {
      id: 'nature-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Nature Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 cold, fire, or lightning damage (your choice). This increases to 2d8 at 14th level.',
    },
    {
      id: 'nature-master', name: 'Master of Nature', level: 17,
      source: 'Nature Domain', combat: true,
      desc: 'While creatures are charmed by your Charm Animals and Plants, you can use a bonus action to verbally command what each does on its next turn.',
    },
  ],
};
