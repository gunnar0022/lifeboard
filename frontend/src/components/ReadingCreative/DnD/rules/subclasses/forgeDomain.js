/**
 * Forge Domain — Cleric. The divine smith. Combat hooks: the once-per-rest
 * Blessing of the Forge (a +1 weapon or armor you imbue) and Channel Divinity:
 * Artisan's Blessing, both surfaced on the cleric-styled ForgeDomainBlock, plus
 * Divine Strike and the fire-resistance defenses.
 */
export default {
  name: 'Forge Domain',
  className: 'Cleric',
  features: [
    {
      id: 'forge-spells', name: 'Forge Domain Spells', level: 1,
      source: 'Forge Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Identify, Searing Smite · 3rd Heat Metal, Magic Weapon · 5th Elemental Weapon, Protection from Energy · 7th Fabricate, Wall of Fire · 9th Animate Objects, Creation. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'forge-bonus-prof', name: 'Bonus Proficiencies', level: 1,
      source: 'Forge Domain',
      desc: "You gain proficiency with heavy armor and smith's tools.",
    },
    {
      id: 'forge-blessing', name: 'Blessing of the Forge', level: 1,
      source: 'Forge Domain', combat: true,
      desc: "At the end of a long rest, touch one nonmagical suit of armor or a simple/martial weapon. Until your next long rest, it becomes magical: +1 AC if armor, or +1 to attack and damage if a weapon. Once used, recharges on a long rest. Set the target on the Combat tab.",
    },
    {
      id: 'forge-artisan', name: "Channel Divinity: Artisan's Blessing", level: 2,
      source: 'Forge Domain', combat: true,
      desc: 'Spend a Channel Divinity use to conduct a 1-hour ritual that crafts a nonmagical item containing metal worth no more than 100 gp (a weapon, armor, 10 ammo, tools, or another metal object), laying out metal of equal value. Spend the use on the Combat tab.',
    },
    {
      id: 'forge-soul', name: 'Soul of the Forge', level: 6,
      source: 'Forge Domain', combat: true,
      desc: 'You gain resistance to fire damage. While wearing heavy armor, you gain a +1 bonus to AC.',
    },
    {
      id: 'forge-divine-strike', name: 'Divine Strike', level: 8,
      source: 'Forge Domain', combat: true,
      desc: 'Once on each of your turns when you hit with a weapon attack, you can deal an extra 1d8 fire damage. This increases to 2d8 at 14th level.',
    },
    {
      id: 'forge-saint', name: 'Saint of Forge and Fire', level: 17,
      source: 'Forge Domain', combat: true,
      desc: 'You gain immunity to fire damage. While wearing heavy armor, you have resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.',
    },
  ],
};
