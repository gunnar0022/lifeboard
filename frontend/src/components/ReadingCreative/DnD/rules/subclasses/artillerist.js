/**
 * Artillerist — Artificer specialist. Built around the Eldritch Cannon: the
 * Combat-tab ArtilleristBlock is a cannon emplacement with a type picker
 * (Flamethrower / Force Ballista / Protector), HP tracking, and a summon/dismiss
 * + detonate flow. Damage scales with Explosive Cannon (9th), and Fortified
 * Position (15th) lets you field two cannons at once.
 */
export default {
  name: 'Artillerist',
  className: 'Artificer',
  features: [
    {
      id: 'art-tools', name: 'Tool Proficiency', level: 3,
      source: 'Artillerist',
      desc: "You gain proficiency with woodcarver's tools. If you already have it, gain proficiency with one other type of artisan's tools of your choice.",
    },
    {
      id: 'art-spells', name: 'Artillerist Spells', level: 3,
      source: 'Artillerist',
      desc: "Always-prepared spells (they don't count against your prepared spells): 3rd Shield, Thunderwave · 5th Scorching Ray, Shatter · 9th Fireball, Wind Wall · 13th Ice Storm, Wall of Fire · 17th Cone of Cold, Wall of Force. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'art-cannon', name: 'Eldritch Cannon', level: 3,
      source: 'Artillerist', combat: true, noTruncate: true,
      desc: "Action (woodcarver's or smith's tools): create a Small or Tiny eldritch cannon within 5 ft. — AC 18, HP = 5 × your artificer level, immune to poison & psychic. Choose Flamethrower (15-ft cone, 2d8 fire, DEX save), Force Ballista (ranged spell attack, 2d8 force + 5-ft push), or Protector (1d8 + INT temp HP to allies within 10 ft). Activate it (and move it 15 ft if it has legs) as a bonus action within 60 ft. It lasts 1 hour, until 0 HP, or until dismissed. One cannon at a time; recreate it only after a long rest or by expending a spell slot. Summon, switch type, and track it on the Combat tab.",
    },
    {
      id: 'art-firearm', name: 'Arcane Firearm', level: 5,
      source: 'Artillerist', combat: true,
      desc: "After a long rest, carve sigils (woodcarver's tools) into a wand, staff, or rod to make it your arcane firearm and use it as a spellcasting focus. When you cast an artificer spell through it, roll a d8 and add it to one of the spell's damage rolls.",
    },
    {
      id: 'art-explosive', name: 'Explosive Cannon', level: 9,
      source: 'Artillerist', combat: true,
      desc: "Every eldritch cannon's damage rolls increase by 1d8. As an action (within 60 ft), you can command a cannon to detonate, destroying it and forcing each creature within 20 ft to make a DEX save (your spell DC), taking 3d8 force (half on success).",
    },
    {
      id: 'art-fortified', name: 'Fortified Position', level: 15,
      source: 'Artillerist', combat: true,
      desc: "You and your allies have half cover while within 10 ft of a cannon you create. You can now have two cannons at once — create both with one action (but not the same spell slot) and activate both with one bonus action; they can be identical or different. You can't create a third while you have two.",
    },
  ],
};
