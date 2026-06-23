/**
 * Assembles CLASS_PROGRESSION from the per-class modules and holds CLASS_META
 * (hit die, subclass label/level, spell-list tag). Adding a class = drop a file
 * and add it here. Artificer is stubbed (Hit Points header only).
 */
import fighter from './fighter';
import rogue from './rogue';
import barbarian from './barbarian';
import druid from './druid';
import wizard from './wizard';
import warlock from './warlock';
import bard from './bard';
import cleric from './cleric';
import monk from './monk';
import paladin from './paladin';
import sorcerer from './sorcerer';
import ranger from './ranger';
import artificer from './artificer';

export const CLASS_PROGRESSION = {
  Fighter: fighter, Rogue: rogue, Barbarian: barbarian, Druid: druid,
  Wizard: wizard, Warlock: warlock, Bard: bard, Cleric: cleric,
  Monk: monk, Paladin: paladin, Sorcerer: sorcerer, Ranger: ranger,
  Artificer: artificer,
};

export const CLASS_META = {
  Barbarian: { hitDie: 'd12', subclassLabel: 'Primal Path',          subclassLevel: 3 },
  Bard:      { hitDie: 'd8',  subclassLabel: 'Bard College',         subclassLevel: 3, spellList: 'bard' },
  Cleric:    { hitDie: 'd8',  subclassLabel: 'Divine Domain',        subclassLevel: 1, spellList: 'cleric' },
  Druid:     { hitDie: 'd8',  subclassLabel: 'Druid Circle',         subclassLevel: 2, spellList: 'druid' },
  Fighter:   { hitDie: 'd10', subclassLabel: 'Martial Archetype',    subclassLevel: 3 },
  Monk:      { hitDie: 'd8',  subclassLabel: 'Monastic Tradition',   subclassLevel: 3 },
  Paladin:   { hitDie: 'd10', subclassLabel: 'Sacred Oath',          subclassLevel: 3, spellList: 'paladin' },
  Ranger:    { hitDie: 'd10', subclassLabel: 'Ranger Conclave',      subclassLevel: 3, spellList: 'ranger' },
  Rogue:     { hitDie: 'd8',  subclassLabel: 'Roguish Archetype',    subclassLevel: 3 },
  Sorcerer:  { hitDie: 'd6',  subclassLabel: 'Sorcerous Origin',     subclassLevel: 1, spellList: 'sorcerer' },
  Warlock:   { hitDie: 'd8',  subclassLabel: 'Otherworldly Patron',  subclassLevel: 1, spellList: 'warlock' },
  Wizard:    { hitDie: 'd6',  subclassLabel: 'Arcane Tradition',     subclassLevel: 2, spellList: 'wizard' },
  Artificer: { hitDie: 'd8',  subclassLabel: 'Artificer Specialist', subclassLevel: 3, spellList: 'artificer' },
};
