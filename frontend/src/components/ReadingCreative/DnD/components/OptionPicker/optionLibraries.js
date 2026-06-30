/**
 * Shared, read-only accessor over the class-option libraries (Invocations,
 * Metamagic, Infusions, Maneuvers, Arcane Shots, Runes). The level-up pickers
 * build their own option lists for editing; this gives the Encyclopedia the same
 * underlying data in a uniform shape for browsing, themed by the picker key.
 */
import { INVOCATION_LIST } from '../../rules/shared/invocations';
import { LIST_PICKER_CONFIGS } from './listPickerConfigs';

// Front-page order + which class/subclass each belongs to. `key` matches the
// PICKER_THEMES key so the Encyclopedia lists reuse the bespoke picker skins.
export const OPTION_CATEGORIES = [
  { key: 'invocations', label: 'Eldritch Invocations', owner: 'Warlock' },
  { key: 'metamagic', label: 'Metamagic', owner: 'Sorcerer' },
  { key: 'infusions', label: 'Artificer Infusions', owner: 'Artificer' },
  { key: 'maneuvers', label: 'Combat Maneuvers', owner: 'Battle Master' },
  { key: 'arcaneShots', label: 'Arcane Shots', owner: 'Arcane Archer' },
  { key: 'runes', label: 'Giant Runes', owner: 'Rune Knight' },
];

// class/subclass name → category key, for contextual cross-links on class pages.
export const CLASS_OPTION_CATEGORY = Object.fromEntries(
  OPTION_CATEGORIES.map(c => [c.owner, c.key])
);

/** A uniform, browsable view of one option library. */
export function getOptionLibrary(key) {
  if (key === 'invocations') {
    return {
      themeKey: 'invocations',
      options: INVOCATION_LIST.map(inv => ({
        id: inv.name, name: inv.name, meta: inv.prereq || undefined,
        desc: inv.desc, minLevel: inv.minLevel || 0,
      })),
    };
  }
  const cfg = LIST_PICKER_CONFIGS[key];
  if (!cfg) return { themeKey: key, options: [] };
  return {
    themeKey: cfg.themeKey,
    options: cfg.list.map(item => ({
      id: item.name,
      name: item.name,
      meta: cfg.optionMeta ? cfg.optionMeta(item) : undefined,
      desc: cfg.optionDesc(item),
      minLevel: cfg.optionMinLevel ? cfg.optionMinLevel(item) : 0,
    })),
  };
}
