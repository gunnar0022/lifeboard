/**
 * Config for the closed-set list pickers (Maneuvers, Metamagic, Arcane Shots,
 * Runes, Infusions). Each stores an array of option names on classFeature[key];
 * the generic ListPicker reads these to build the themed modal. Feats and
 * Invocations are bespoke (async / custom builder) and live in their own files.
 */
import {
  MANEUVER_LIST, maneuversKnown,
  METAMAGIC_OPTIONS, metamagicKnown,
  ARCANE_SHOT_LIST, arcaneShotsKnown,
  RUNE_LIST, maxRunesKnown,
  INFUSION_LIST, infusionsKnown,
} from '../../classProgression';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const LIST_PICKER_CONFIGS = {
  maneuvers: {
    themeKey: 'maneuvers',
    storageKey: 'knownManeuvers',
    triggerLabel: 'Choose Maneuvers',
    unit: 'maneuvers known',
    list: MANEUVER_LIST,
    capFn: maneuversKnown,
    optionMeta: (m) => cap(m.type || ''),
    optionDesc: (m) => m.desc,
  },
  metamagic: {
    themeKey: 'metamagic',
    storageKey: 'metamagic',
    triggerLabel: 'Choose Metamagic',
    unit: 'metamagic known',
    list: METAMAGIC_OPTIONS,
    capFn: metamagicKnown,
    optionMeta: (m) => m.cost,
    optionDesc: (m) => m.desc,
  },
  arcaneShots: {
    themeKey: 'arcaneShots',
    storageKey: 'knownArcaneShots',
    triggerLabel: 'Choose Arcane Shots',
    unit: 'shots known',
    list: ARCANE_SHOT_LIST,
    capFn: arcaneShotsKnown,
    optionMeta: (s) => s.school,
    optionDesc: (s) => s.desc,
  },
  runes: {
    themeKey: 'runes',
    storageKey: 'knownRunes',
    triggerLabel: 'Choose Runes',
    unit: 'runes known',
    list: RUNE_LIST,
    capFn: maxRunesKnown,
    optionMinLevel: (r) => r.minLevel || 0,
    optionMeta: (r) => (r.minLevel > 3 ? `Lvl ${r.minLevel}+` : undefined),
    optionDesc: (r) => `Passive — ${r.passive}\nInvoke — ${r.invoke}`,
  },
  infusions: {
    themeKey: 'infusions',
    storageKey: 'knownInfusions',
    triggerLabel: 'Choose Infusions',
    unit: 'infusions known',
    list: INFUSION_LIST,
    capFn: infusionsKnown,
    optionMinLevel: (inf) => inf.prereq || 0,
    optionMeta: (inf) => `${inf.target}${inf.attune ? ' · ⚜ attune' : ''}`,
    optionDesc: (inf) => inf.desc,
    repeatableName: 'Replicate Magic Item',
    // Dropping an infusion you no longer know also clears any item using it.
    onRemoveExtra: (cf, removedName, nextList) =>
      nextList.includes(removedName)
        ? {}
        : { infusedItems: (cf.infusedItems || []).filter(it => it.infusion !== removedName) },
  },
};
