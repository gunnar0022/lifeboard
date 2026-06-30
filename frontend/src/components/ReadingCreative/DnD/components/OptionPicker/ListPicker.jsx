import { useState } from 'react';
import OptionPickerModal from './OptionPickerModal';
import { pickerTheme } from './pickerThemes';
import { LIST_PICKER_CONFIGS } from './listPickerConfigs';

/**
 * Generic picker for closed-set, name-stored options (Maneuvers, Metamagic,
 * Arcane Shots, Runes, Infusions). Driven by a config in listPickerConfigs.js;
 * stores chosen option names on classFeature[storageKey]. Browse-only (no custom
 * builder) per the picker design. Renders a compact in-card trigger + summary
 * plus the themed modal.
 */
export default function ListPicker({ configKey, classFeature, onUpdate, level }) {
  const cfg = LIST_PICKER_CONFIGS[configKey];
  const theme = pickerTheme(cfg.themeKey);
  const { Icon } = theme;
  const cf = classFeature || {};
  const stored = cf[cfg.storageKey] || [];
  const max = cfg.capFn(level);
  const count = stored.length;
  const atCap = count >= max;
  const [open, setOpen] = useState(false);

  const byName = (name) => cfg.list.find(i => i.name === name);
  const write = (next, extra = {}) =>
    onUpdate({ classFeature: { ...cf, [cfg.storageKey]: next, ...extra } });

  const options = cfg.list.map(item => {
    const minL = cfg.optionMinLevel ? cfg.optionMinLevel(item) : 0;
    return {
      id: item.name,
      name: item.name,
      meta: cfg.optionMeta ? cfg.optionMeta(item) : undefined,
      desc: cfg.optionDesc(item),
      locked: minL > level,
      lockedReason: `Level ${minL}+`,
      repeatable: cfg.repeatableName === item.name,
    };
  });
  const chosenIds = new Set(stored);
  const chosen = stored.map((name, i) => ({
    key: i, id: name, name, desc: byName(name) ? cfg.optionDesc(byName(name)) : '',
  }));

  const addOpt = (opt) => {
    if (atCap) return;
    if (!opt.repeatable && stored.includes(opt.id)) return;
    write([...stored, opt.id]);
  };
  const removeAt = (idx) => {
    const removed = stored[idx];
    const next = stored.filter((_, i) => i !== idx);
    const extra = cfg.onRemoveExtra ? cfg.onRemoveExtra(cf, removed, next) : {};
    write(next, extra);
  };

  return (
    <div className="dnd-feature-choice op-trigger" style={{ '--op-accent': theme.accent }}>
      <div className="op-trigger__head">
        <span className="op-trigger__count">{count}/{max} {cfg.unit}</span>
        <button className="op-trigger__btn" onClick={() => setOpen(true)}>
          <Icon size={14} /> {cfg.triggerLabel}
        </button>
      </div>
      {stored.length === 0 ? (
        <p className="op-trigger__empty">None chosen yet.</p>
      ) : (
        <div className="op-summary">
          {stored.map((name, i) => (
            <span key={i} className="op-summary__chip" title={byName(name) ? cfg.optionDesc(byName(name)) : ''}>
              {name}
            </span>
          ))}
        </div>
      )}

      {open && (
        <OptionPickerModal
          themeKey={cfg.themeKey}
          count={count}
          max={max}
          options={options}
          chosen={chosen}
          chosenIds={chosenIds}
          onAdd={addOpt}
          onRemove={removeAt}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
