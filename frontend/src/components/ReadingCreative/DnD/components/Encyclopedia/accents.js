import { classColor } from '../../dndUtils';

/**
 * Per-page accent colors. Classes reuse the sheet's CLASS_COLOR_VARS via
 * classColor(). Races get their own palette so each major race page reads with
 * its own personality. Tuned to sit on the parchment/grimoire backgrounds in
 * both light and dark mode; falls back to the neutral accent.
 */
const RACE_ACCENTS = {
  Dragonborn: '#b5532a',
  Dwarf:      '#8a6a2e',
  Elf:        '#3a7a5a',
  Fairy:      '#b05a8a',
  Genasi:     '#3a7a88',
  Gnome:      '#a86010',
  Goliath:    '#6a7a8a',
  'Half-Elf': '#5a8a6a',
  'Half-Orc': '#5a7a3a',
  Halfling:   '#a8762a',
  Human:      '#7a6a4e',
  Tabaxi:     '#a8862a',
  Tiefling:   '#9a3a5a',
  Uma:        '#5a6aaa',
};

export function raceAccent(name) {
  return RACE_ACCENTS[name] || 'var(--dnd-accent)';
}

export function classAccent(name) {
  return classColor(name);
}
