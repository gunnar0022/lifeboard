/**
 * Spell class tags — which class spell lists a spell belongs to. Spells can carry
 * multiple tags; `other` is the catch-all for homebrew / runes / edge cases so
 * the set stays flexible as the library grows.
 *
 * Stored on a spell as the `classes` column: a JSON array string (e.g.
 * '["wizard","sorcerer"]'). Use parseSpellClasses() to read it (tolerates both
 * the stored string and an already-parsed array, since edited spells in the
 * client cache hold an array).
 */
export const SPELL_CLASS_TAGS = [
  { id: 'artificer', label: 'Artificer' },
  { id: 'bard', label: 'Bard' },
  { id: 'cleric', label: 'Cleric' },
  { id: 'druid', label: 'Druid' },
  { id: 'paladin', label: 'Paladin' },
  { id: 'ranger', label: 'Ranger' },
  { id: 'sorcerer', label: 'Sorcerer' },
  { id: 'warlock', label: 'Warlock' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'other', label: 'Other' },
];

const LABELS = Object.fromEntries(SPELL_CLASS_TAGS.map(t => [t.id, t.label]));

/** Read a spell's class tags as a string array, from string or array form. */
export function parseSpellClasses(classes) {
  if (Array.isArray(classes)) return classes;
  if (typeof classes === 'string' && classes.trim()) {
    try {
      const arr = JSON.parse(classes);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Display label for a tag id. */
export function spellClassLabel(id) {
  return LABELS[id] || id;
}
