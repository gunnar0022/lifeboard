/**
 * Spell-tier visual language: a color ramp from cantrip (cool slate) up through
 * 9th level (deep arcane violet), so a spell's power reads at a glance and the
 * list feels like more than a table. Indexed by spell level 0–9.
 */
export const SPELL_LEVEL_COLORS = [
  '#6a7a8a', // Cantrip
  '#3a7a6a', // 1st
  '#3a7a3a', // 2nd
  '#7a7a2a', // 3rd
  '#a86a1a', // 4th
  '#a8501a', // 5th
  '#a8302a', // 6th
  '#8a2a5a', // 7th
  '#6a2a8a', // 8th
  '#4a2a9a', // 9th
];

export const spellLevelColor = (lvl) => SPELL_LEVEL_COLORS[lvl] || SPELL_LEVEL_COLORS[9];

export const spellLevelLabel = (lvl) => (lvl === 0 ? 'Cantrip' : `Level ${lvl}`);
export const spellLevelShort = (lvl) => (lvl === 0 ? 'C' : String(lvl));

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
export const spellLevelOrdinal = (lvl) => (lvl === 0 ? 'Cantrip' : ORD[lvl] || `${lvl}th`);
