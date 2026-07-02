import { useState } from 'react';
import OptionPickerModal from './OptionPickerModal';
import { pickerTheme } from './pickerThemes';
import { FIGHTING_STYLES } from '../../rules/shared/fightingStyles';

// A light category tag per style, so the themed list scans like the other
// pickers (which show a type/cost/school meta chip).
const STYLE_TAG = {
  Archery: 'Ranged',
  'Close Quarters Shooter': 'Ranged',
  'Thrown Weapon Fighting': 'Ranged',
  Defense: 'Defense',
  Protection: 'Defense',
  Interception: 'Defense',
  Mariner: 'Defense',
  Dueling: 'Offense',
  'Great Weapon Fighting': 'Offense',
  'Two-Weapon Fighting': 'Offense',
  'Unarmed Fighting': 'Offense',
  'Blind Fighting': 'Utility',
  'Tunnel Fighter': 'Utility',
  'Superior Technique': 'Technique',
};

/**
 * Single-select Fighting Style picker (Fighter, Paladin, Ranger). Stores the
 * chosen style name as the string `classFeature.fightingStyle`, so it stays
 * compatible with everything that reads that field. Reuses the themed
 * OptionPickerModal in `singleSelect` mode: picking a style swaps the choice and
 * closes; the chip's remove clears it.
 */
export default function FightingStylePicker({ classFeature, onUpdate }) {
  const cf = classFeature || {};
  const selected = cf.fightingStyle || '';
  const [open, setOpen] = useState(false);
  const theme = pickerTheme('fightingStyle');
  const { Icon } = theme;

  const byName = (name) => FIGHTING_STYLES.find(s => s.name === name);
  const selectedStyle = byName(selected);

  const options = FIGHTING_STYLES.map(s => ({
    id: s.name, name: s.name, meta: STYLE_TAG[s.name], desc: s.desc,
  }));
  const chosen = selected
    ? [{ key: selected, id: selected, name: selected, desc: selectedStyle?.desc || '' }]
    : [];

  const choose = (opt) => {
    onUpdate({ classFeature: { ...cf, fightingStyle: opt.id } });
    setOpen(false);
  };
  const clear = () => onUpdate({ classFeature: { ...cf, fightingStyle: '' } });

  return (
    <div className="dnd-feature-choice op-trigger" style={{ '--op-accent': theme.accent }}>
      <div className="op-trigger__head">
        <span className="op-trigger__count">{selected ? '1' : '0'}/1 style</span>
        <button className="op-trigger__btn" onClick={() => setOpen(true)}>
          <Icon size={14} /> {selected ? 'Change Fighting Style' : 'Choose Fighting Style'}
        </button>
      </div>
      {selectedStyle ? (
        <div className="op-summary">
          <span className="op-summary__chip" title={selectedStyle.desc}>{selectedStyle.name}</span>
          <p className="dnd-feature-choice__detail">{selectedStyle.desc}</p>
        </div>
      ) : (
        <p className="op-trigger__empty">None chosen yet.</p>
      )}

      {open && (
        <OptionPickerModal
          themeKey="fightingStyle"
          singleSelect
          count={selected ? 1 : 0}
          max={1}
          options={options}
          chosen={chosen}
          chosenIds={new Set(selected ? [selected] : [])}
          onAdd={choose}
          onRemove={clear}
          emptyHint="No style yet — choose one from the list below."
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
