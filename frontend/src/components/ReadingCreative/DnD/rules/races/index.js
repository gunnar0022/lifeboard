/**
 * Assembles RACE_PROGRESSION, SUBRACE_PROGRESSION, and RACES from the per-race
 * modules (each holds a race + its subraces), plus the race feature getters.
 * Adding a race = drop a file and add it to ALL below.
 */
import dragonborn from './dragonborn';
import dwarf from './dwarf';
import elf from './elf';
import fairy from './fairy';
import genasi from './genasi';
import gnome from './gnome';
import goliath from './goliath';
import halfElf from './halfElf';
import halfOrc from './halfOrc';
import halfling from './halfling';
import human from './human';
import tabaxi from './tabaxi';
import tiefling from './tiefling';
import uma from './uma';

const ALL = [
  dragonborn, dwarf, elf, fairy, genasi, gnome, goliath,
  halfElf, halfOrc, halfling, human, tabaxi, tiefling, uma,
];

export const RACES = ALL.map(r => r.name);
export const RACE_PROGRESSION = Object.fromEntries(ALL.map(r => [r.name, r.race]));
export const SUBRACE_PROGRESSION = Object.assign({}, ...ALL.map(r => r.subraces));

export function getSubraces(race) {
  return RACE_PROGRESSION[race]?.subraces || [];
}
export function getRaceFeatures(race, subrace) {
  const base = RACE_PROGRESSION[race]?.traits || [];
  const sub = (subrace && SUBRACE_PROGRESSION[subrace]?.race === race)
    ? SUBRACE_PROGRESSION[subrace].traits
    : [];
  return [...base, ...sub];
}
export function getRacialSpells(race, subrace, level) {
  const lvl = level || 1;
  const traits = getRaceFeatures(race, subrace);
  const out = [];
  traits.forEach(t => (t.spells || []).forEach(sp => {
    if ((sp.minLevel || 1) <= lvl) out.push(sp);
  }));
  return out;
}

/**
 * Natural weapons / racial attacks (Tabaxi claws, Uma thundering rush, etc.).
 * Returns the raw attack descriptors declared on race traits; the combat tab
 * computes to-hit/damage numbers from the character's abilities & proficiency.
 */
export function getRacialAttacks(race, subrace) {
  return getRaceFeatures(race, subrace)
    .filter(t => t.attack)
    .map(t => ({ traitId: t.id, ...t.attack }));
}
