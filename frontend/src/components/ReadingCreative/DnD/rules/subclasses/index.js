/**
 * Assembles SUBCLASS_PROGRESSION from the per-subclass modules. Adding a new
 * implemented subclass = drop a file here and add it to ALL below.
 */
import runeKnight from './runeKnight';
import ancestralGuardian from './ancestralGuardian';
import assassin from './assassin';
import circleOfStars from './circleOfStars';
import circleOfSpores from './circleOfSpores';
import warMagic from './warMagic';
import archfey from './archfey';

const ALL = [
  runeKnight, ancestralGuardian, assassin,
  circleOfStars, circleOfSpores, warMagic, archfey,
];

export const SUBCLASS_PROGRESSION = Object.fromEntries(
  ALL.map(s => [s.name, { className: s.className, features: s.features }])
);
