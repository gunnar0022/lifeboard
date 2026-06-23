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
import pathOfTheBerserker from './pathOfTheBerserker';
import pathOfTheBattlerager from './pathOfTheBattlerager';
import pathOfTheBeast from './pathOfTheBeast';
import pathOfTheGiant from './pathOfTheGiant';
import pathOfTheStormHerald from './pathOfTheStormHerald';
import pathOfTheTotemWarrior from './pathOfTheTotemWarrior';
import pathOfWildMagic from './pathOfWildMagic';
import pathOfTheZealot from './pathOfTheZealot';
import collegeOfLore from './collegeOfLore';
import collegeOfEloquence from './collegeOfEloquence';
import collegeOfGlamour from './collegeOfGlamour';
import collegeOfCreation from './collegeOfCreation';
import collegeOfSpirits from './collegeOfSpirits';
import collegeOfSwords from './collegeOfSwords';
import collegeOfValor from './collegeOfValor';
import collegeOfWhispers from './collegeOfWhispers';
import battleMaster from './battleMaster';
import arcaneArcher from './arcaneArcher';
import banneret from './banneret';
import echoKnight from './echoKnight';
import champion from './champion';
import cavalier from './cavalier';
import eldritchKnight from './eldritchKnight';
import psiWarrior from './psiWarrior';
import samurai from './samurai';
import circleOfDreams from './circleOfDreams';
import circleOfTheLand from './circleOfTheLand';
import circleOfTheMoon from './circleOfTheMoon';
import circleOfTheShepherd from './circleOfTheShepherd';
import circleOfWildfire from './circleOfWildfire';
import draconicBloodline from './draconicBloodline';
import aberrantMind from './aberrantMind';
import clockworkSoul from './clockworkSoul';
import divineSoul from './divineSoul';
import inquisitive from './inquisitive';
import mastermind from './mastermind';
import phantom from './phantom';
import scout from './scout';
import soulknife from './soulknife';
import arcaneTrickster from './arcaneTrickster';
import thief from './thief';
import swashbuckler from './swashbuckler';

const ALL = [
  runeKnight, ancestralGuardian, assassin,
  circleOfStars, circleOfSpores, warMagic, archfey,
  pathOfTheBerserker, pathOfTheBattlerager, pathOfTheBeast, pathOfTheGiant,
  pathOfTheStormHerald, pathOfTheTotemWarrior, pathOfWildMagic, pathOfTheZealot,
  collegeOfLore, collegeOfEloquence, collegeOfGlamour, collegeOfCreation,
  collegeOfSpirits, collegeOfSwords, collegeOfValor, collegeOfWhispers,
  battleMaster, arcaneArcher, banneret, echoKnight,
  champion, cavalier, eldritchKnight, psiWarrior, samurai,
  circleOfDreams, circleOfTheLand, circleOfTheMoon, circleOfTheShepherd, circleOfWildfire,
  draconicBloodline, aberrantMind, clockworkSoul, divineSoul,
  inquisitive, mastermind, phantom, scout, soulknife,
  arcaneTrickster, thief, swashbuckler,
];

export const SUBCLASS_PROGRESSION = Object.fromEntries(
  ALL.map(s => [s.name, { className: s.className, features: s.features }])
);
