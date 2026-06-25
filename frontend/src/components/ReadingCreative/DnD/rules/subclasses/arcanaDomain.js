/**
 * Arcana Domain — Cleric. The scholar-priest of the Weave. Combat hook is the
 * Channel Divinity: Arcane Abjuration (turn/banish otherworldly creatures by CR),
 * surfaced on the cleric-styled ArcanaDomainBlock; the rest are passive boosts.
 */
export default {
  name: 'Arcana Domain',
  className: 'Cleric',
  features: [
    {
      id: 'arc-spells', name: 'Arcana Domain Spells', level: 1,
      source: 'Arcana Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Detect Magic, Magic Missile · 3rd Magic Weapon, Nystul's Magic Aura · 5th Dispel Magic, Magic Circle · 7th Arcane Eye, Leomund's Secret Chest · 9th Planar Binding, Teleportation Circle. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'arc-initiate', name: 'Arcane Initiate', level: 1,
      source: 'Arcana Domain',
      desc: 'You gain proficiency in the Arcana skill and learn two cantrips of your choice from the wizard spell list. They count as cleric cantrips for you — add them on the Spells tab.',
    },
    {
      id: 'arc-abjuration', name: 'Channel Divinity: Arcane Abjuration', level: 2,
      source: 'Arcana Domain', combat: true,
      desc: 'Action: present your holy symbol; one celestial, elemental, fey, or fiend within 30 ft that can see/hear you makes a WIS save or is turned for 1 minute (or until it takes damage). From 5th level, a creature not on its home plane is instead banished for 1 minute (no concentration) if its CR is at or below your threshold: ½ at 5th, 1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th. Spend a Channel Divinity use on the Combat tab.',
    },
    {
      id: 'arc-spell-breaker', name: 'Spell Breaker', level: 6,
      source: 'Arcana Domain', combat: true,
      desc: 'When you restore hit points to an ally with a spell of 1st level or higher, you can also end one spell on that creature whose level is at or below the slot you used.',
    },
    {
      id: 'arc-potent', name: 'Potent Spellcasting', level: 8,
      source: 'Arcana Domain', combat: true,
      desc: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.',
    },
    {
      id: 'arc-mastery', name: 'Arcane Mastery', level: 17,
      source: 'Arcana Domain',
      desc: 'Choose four wizard spells — one each of 6th, 7th, 8th, and 9th level. They become domain spells: always prepared and counting as cleric spells for you.',
    },
  ],
};
