/** Dragonborn draconic ancestry → breath weapon damage type, area, save; + scaling. */
export const DRAGON_ANCESTRY = {
  Black:  { damage: 'Acid', area: '5×30 ft line', save: 'DEX' },
  Blue:   { damage: 'Lightning', area: '5×30 ft line', save: 'DEX' },
  Brass:  { damage: 'Fire', area: '5×30 ft line', save: 'DEX' },
  Bronze: { damage: 'Lightning', area: '5×30 ft line', save: 'DEX' },
  Copper: { damage: 'Acid', area: '5×30 ft line', save: 'DEX' },
  Gold:   { damage: 'Fire', area: '15 ft cone', save: 'DEX' },
  Green:  { damage: 'Poison', area: '15 ft cone', save: 'CON' },
  Red:    { damage: 'Fire', area: '15 ft cone', save: 'DEX' },
  Silver: { damage: 'Cold', area: '15 ft cone', save: 'CON' },
  White:  { damage: 'Cold', area: '15 ft cone', save: 'CON' },
};
export const DRAGON_COLORS = Object.keys(DRAGON_ANCESTRY);

/** Dragonborn breath weapon damage dice by level. */
export function breathWeaponDice(level) {
  if (level >= 16) return '5d6';
  if (level >= 11) return '4d6';
  if (level >= 6) return '3d6';
  return '2d6';
}
