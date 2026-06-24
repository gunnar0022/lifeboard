/**
 * Per-class scaling helpers (cantrips/spells known, resource dice, pools).
 * Grouped here as small pure functions; consumed by the Combat-tab trackers,
 * the Spells tab, and FeatureList. (metamagicKnown lives in shared/metamagic.js.)
 */

// ── Druid ──
export function druidCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}

// ── Bard ──
export function bardicInspirationDie(level) {
  if (level >= 15) return 'd12';
  if (level >= 10) return 'd10';
  if (level >= 5) return 'd8';
  return 'd6';
}
export function songOfRestDie(level) {
  if (level >= 17) return 'd12';
  if (level >= 13) return 'd10';
  if (level >= 9) return 'd8';
  return 'd6';
}
export function bardCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}
export function bardSpellsKnown(level) {
  const table = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
  return table[Math.max(1, Math.min(20, level || 1)) - 1];
}

// ── Cleric ──
export function clericCantripsKnown(level) {
  if (level >= 10) return 5;
  if (level >= 4) return 4;
  return 3;
}
export function channelDivinityUses(level) {
  if (level >= 18) return 3;
  if (level >= 6) return 2;
  return 1;
}
export function harnessDivinePowerUses(level) {
  if (level >= 18) return 3;
  if (level >= 6) return 2;
  return 1;
}
export function destroyUndeadCR(level) {
  if (level >= 17) return '4';
  if (level >= 14) return '3';
  if (level >= 11) return '2';
  if (level >= 8) return '1';
  if (level >= 5) return '1/2';
  return null;
}

// ── Monk ──
export function martialArtsDie(level) {
  if (level >= 17) return 'd10';
  if (level >= 11) return 'd8';
  if (level >= 5) return 'd6';
  return 'd4';
}
export function kiPoints(level) {
  return (level || 1) >= 2 ? level : 0;
}
export function unarmoredMovement(level) {
  if (level >= 18) return 30;
  if (level >= 14) return 25;
  if (level >= 10) return 20;
  if (level >= 6) return 15;
  if (level >= 2) return 10;
  return 0;
}

// ── Paladin ──
export function layOnHandsPool(level) {
  return (level || 1) * 5;
}

// ── Sorcerer ──
export function sorceryPoints(level) {
  return (level || 1) >= 2 ? level : 0;
}
export function sorcererCantripsKnown(level) {
  if (level >= 10) return 6;
  if (level >= 4) return 5;
  return 4;
}
export function sorcererSpellsKnown(level) {
  const table = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
  return table[Math.max(1, Math.min(20, level || 1)) - 1];
}

// ── Artificer ──
export function artificerCantripsKnown(level) {
  if (level >= 14) return 4;
  if (level >= 10) return 3;
  return 2;
}

// ── Ranger ──
export function favoredFoeDie(level) {
  if (level >= 14) return 'd8';
  if (level >= 6) return 'd6';
  return 'd4';
}
export function rangerSpellsKnown(level) {
  if ((level || 1) < 2) return 0;
  const table = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];
  return table[Math.max(1, Math.min(20, level)) - 1];
}

// ── Warlock ──
export function warlockCantripsKnown(level) {
  if (level >= 10) return 4;
  if (level >= 4) return 3;
  return 2;
}
export function invocationsKnown(level) {
  const l = level || 1;
  if (l >= 18) return 8;
  if (l >= 15) return 7;
  if (l >= 12) return 6;
  if (l >= 9) return 5;
  if (l >= 7) return 4;
  if (l >= 5) return 3;
  if (l >= 2) return 2;
  return 0;
}
export function mysticArcanumLevels(level) {
  return [{ lvl: 6, at: 11 }, { lvl: 7, at: 13 }, { lvl: 8, at: 15 }, { lvl: 9, at: 17 }]
    .filter(a => (level || 1) >= a.at)
    .map(a => a.lvl);
}

// ── Rogue ──
export function sneakAttackDice(level) {
  return Math.ceil((level || 1) / 2);
}
// Arcane Trickster (third-caster, wizard list): Mage Hand + 2 cantrips, +1 at 10th.
// Its 1st-level-and-higher spells-known table matches the Eldritch Knight's.
export function arcaneTricksterCantripsKnown(level) {
  return (level || 1) >= 10 ? 4 : 3;
}

// ── Fighter: Eldritch Knight (third-caster, wizard list) ──
export function eldritchKnightCantripsKnown(level) {
  return (level || 1) >= 10 ? 3 : 2;
}
export function eldritchKnightSpellsKnown(level) {
  // By fighter level; first spells at 3rd.
  const table = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
  return table[Math.max(1, Math.min(20, level || 1)) - 1];
}

// ── Wizard ──
export function arcaneRecoveryMax(level) {
  return Math.max(1, Math.ceil((level || 1) / 2));
}
export function wizardCantripsKnown(level) {
  if (level >= 10) return 5;
  if (level >= 4) return 4;
  return 3;
}
export function powerSurgeDamage(level) {
  return Math.floor((level || 1) / 2);
}
