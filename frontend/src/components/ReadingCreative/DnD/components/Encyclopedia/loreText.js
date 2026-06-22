/** Lore-section key → display title, plus ordering and slug helpers shared by
 * the race and class detail pages. Unknown / user-added keys title-case from
 * the key and sort after the known ones. */
export const LORE_TITLE = {
  // races
  physical: 'Physical', lifespan: 'Lifespan', society: 'Society', origin: 'Origin', names: 'Names',
  // classes
  role: 'Role', playstyle: 'Playstyle', subclasses: 'Subclasses',
};

// Preferred section order per node type; anything else appends in insertion order.
export const LORE_ORDER = {
  race: ['physical', 'lifespan', 'society', 'origin', 'names'],
  class: ['role', 'playstyle', 'subclasses'],
};

export const titleFor = (key) => LORE_TITLE[key]
  || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export function orderedKeys(lore, order = []) {
  const keys = Object.keys(lore || {});
  return [...order.filter(k => keys.includes(k)), ...keys.filter(k => !order.includes(k))];
}

export const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
