import { useState } from 'react';
import { Eye } from 'lucide-react';
import { invocationsKnown } from '../../classProgression';
import { INVOCATION_LIST } from '../../rules/shared/invocations';
import OptionPickerModal from './OptionPickerModal';

// Lightweight homebrew builder shown inside the picker's "Create custom" panel.
function InvocationBuilder({ atCap, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const valid = name.trim() && desc.trim() && !atCap;
  return (
    <div className="op-builder">
      <p className="op-builder__lede">
        Add any invocation we haven’t listed — the full list is long, so build your own here and it’ll join your known invocations.
      </p>
      <label className="op-builder__field">
        <span>Name</span>
        <input className="dnd-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Gift of the Ever-Living Ones" />
      </label>
      <label className="op-builder__field">
        <span>Effect</span>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={desc}
          onChange={e => setDesc(e.target.value)} placeholder="What does it do?" />
      </label>
      {atCap && <p className="op-builder__warn">You’re at your invocations-known limit — remove one first.</p>}
      <button className="op-builder__submit" disabled={!valid}
        onClick={() => { onCreate(name.trim(), desc.trim()); setName(''); setDesc(''); }}>
        Add Invocation
      </button>
    </div>
  );
}

/**
 * Warlock Eldritch Invocations picker. Replaces the old free-text inline editor:
 * a compact summary + a button that opens the themed library modal (browse the
 * starter list or build a custom one). Stored on classFeature.invocations as
 * [{ name, desc, custom? }] — unchanged shape, so existing data still reads.
 */
export default function InvocationPicker({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const stored = cf.invocations || [];
  const max = invocationsKnown(level);
  const count = stored.length;
  const atCap = count >= max;
  const [open, setOpen] = useState(false);

  const setList = (next) => onUpdate({ classFeature: { ...cf, invocations: next } });

  const options = INVOCATION_LIST.map(inv => ({
    id: inv.name,
    name: inv.name,
    meta: inv.prereq || undefined,
    desc: inv.desc,
    locked: (inv.minLevel || 0) > level,
    lockedReason: `Level ${inv.minLevel}+`,
  }));
  const chosenIds = new Set(stored.map(s => s.name));
  const chosen = stored.map((inv, i) => ({ key: i, id: inv.name, name: inv.name, desc: inv.desc, custom: inv.custom }));

  const addFromLibrary = (opt) => {
    if (atCap || chosenIds.has(opt.id)) return;
    setList([...stored, { name: opt.name, desc: opt.desc }]);
  };
  const addCustom = (name, desc) => {
    if (atCap || stored.some(s => s.name === name)) return;
    setList([...stored, { name, desc, custom: true }]);
  };
  const removeAt = (idx) => setList(stored.filter((_, i) => i !== idx));

  return (
    <div className="dnd-feature-choice op-trigger" style={{ '--op-accent': 'var(--dnd-class-warlock)' }}>
      <div className="op-trigger__head">
        <span className="op-trigger__count">{count}/{max} invocations known</span>
        <button className="op-trigger__btn" onClick={() => setOpen(true)}>
          <Eye size={14} /> Choose Invocations
        </button>
      </div>
      {stored.length === 0 ? (
        <p className="op-trigger__empty">None learned yet.</p>
      ) : (
        <div className="op-summary">
          {stored.map((inv, i) => (
            <span key={i} className={`op-summary__chip ${inv.custom ? 'op-summary__chip--custom' : ''}`} title={inv.desc}>
              {inv.name}
            </span>
          ))}
        </div>
      )}

      {open && (
        <OptionPickerModal
          themeKey="invocations"
          count={count}
          max={max}
          options={options}
          chosen={chosen}
          chosenIds={chosenIds}
          onAdd={addFromLibrary}
          onRemove={removeAt}
          emptyHint="No invocations learned yet — browse the library or create your own."
          customBuilder={<InvocationBuilder atCap={atCap} onCreate={addCustom} />}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
