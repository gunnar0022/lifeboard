import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import OptionPickerModal from './OptionPickerModal';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

function featDesc(f) {
  return [f.description, ...((f.benefits || []).map(b => `• ${b}`))].filter(Boolean).join('\n');
}

// Lightweight homebrew feat builder (shown in the picker's "Create custom" panel).
function FeatBuilder({ onCreate }) {
  const [name, setName] = useState('');
  const [prerequisite, setPrereq] = useState('');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [asiAbility, setAsiAbility] = useState('');
  const [saving, setSaving] = useState(false);
  const valid = name.trim() && description.trim() && !saving;

  const submit = async () => {
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        prerequisite: prerequisite.trim(),
        description: description.trim(),
        benefits: benefits.split('\n').map(b => b.trim()).filter(Boolean),
        asi: asiAbility ? { fixed: { [asiAbility]: 1 } } : {},
        is_custom: true,
        source: 'Homebrew',
      });
      setName(''); setPrereq(''); setDescription(''); setBenefits(''); setAsiAbility('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="op-builder">
      <p className="op-builder__lede">Build a homebrew feat. It’s saved to your feat library so you can reuse it on any character.</p>
      <label className="op-builder__field"><span>Name</span>
        <input className="dnd-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lucky" />
      </label>
      <label className="op-builder__field"><span>Prerequisite (optional)</span>
        <input className="dnd-field" value={prerequisite} onChange={e => setPrereq(e.target.value)} placeholder="e.g. Strength 13 or higher" />
      </label>
      <label className="op-builder__field"><span>Description</span>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={description}
          onChange={e => setDescription(e.target.value)} placeholder="Flavor / summary of the feat" />
      </label>
      <label className="op-builder__field"><span>Benefits (one per line)</span>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={benefits}
          onChange={e => setBenefits(e.target.value)} placeholder={'You have advantage on…\nYou gain proficiency in…'} />
      </label>
      <label className="op-builder__field"><span>Ability Score rider (optional)</span>
        <select className="dnd-field" value={asiAbility} onChange={e => setAsiAbility(e.target.value)}>
          <option value="">No ability increase</option>
          {ABILITIES.map(a => <option key={a} value={a}>+1 {a}</option>)}
        </select>
      </label>
      <button className="op-builder__submit" disabled={!valid} onClick={submit}>
        {saving ? 'Saving…' : 'Create & Select'}
      </button>
    </div>
  );
}

/**
 * Feat picker for the ASI screen. Browses the dnd_feats library (with a custom
 * builder that persists new feats app-wide) and stores the single chosen feat on
 * the character. Single-select: remove the current feat (× on the chip) to swap.
 */
export default function FeatPicker({ value, onChange }) {
  const [feats, setFeats] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    fetch('/api/dnd/feats?limit=300').then(r => r.json()).then(d => setFeats(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const chosenName = value?.name;
  const options = feats.map(f => ({
    id: f.id, name: f.name, meta: f.prerequisite || undefined, desc: featDesc(f),
  }));
  const chosen = chosenName
    ? [{ key: value.featId ?? chosenName, id: value.featId, name: chosenName, desc: value.description }]
    : [];
  const chosenIds = new Set(value?.featId != null ? [value.featId] : []);

  const selectFeat = (f) => {
    onChange({
      featId: f.id, name: f.name, prerequisite: f.prerequisite,
      description: f.description, benefits: f.benefits, asi: f.asi,
    });
  };
  const onAdd = (opt) => {
    const f = feats.find(x => x.id === opt.id);
    if (f) { selectFeat(f); setOpen(false); }
  };
  const createCustom = async (payload) => {
    try {
      const res = await fetch('/api/dnd/feats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const feat = await res.json();
      setFeats(prev => (prev.some(p => p.id === feat.id) ? prev : [...prev, feat]));
      selectFeat(feat);
      setOpen(false);
    } catch (e) { console.error('Create feat failed:', e); }
  };

  return (
    <div className="op-trigger" style={{ '--op-accent': 'var(--dnd-accent)' }}>
      <div className="op-trigger__head">
        <span className="op-trigger__count">{chosenName ? 'Feat chosen' : 'No feat chosen'}</span>
        <button className="op-trigger__btn" onClick={() => setOpen(true)}>
          <Star size={14} /> {chosenName ? 'Change Feat' : 'Choose Feat'}
        </button>
      </div>
      {chosenName ? (
        <div className="op-feat-chosen">
          <div className="op-feat-chosen__name">{chosenName}</div>
          {value.prerequisite && <div className="op-feat-chosen__prereq">Prerequisite: {value.prerequisite}</div>}
          {value.description && <p className="op-feat-chosen__desc">{value.description}</p>}
          {(value.benefits || []).length > 0 && (
            <ul className="op-feat-chosen__benefits">
              {value.benefits.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>
      ) : (
        <p className="op-trigger__empty">Pick a feat instead of an ability score increase.</p>
      )}

      {open && (
        <OptionPickerModal
          themeKey="feats"
          count={chosenName ? 1 : 0}
          max={1}
          options={options}
          chosen={chosen}
          chosenIds={chosenIds}
          onAdd={onAdd}
          onRemove={() => onChange(null)}
          emptyHint="No feat chosen yet — browse the library or build your own."
          customBuilder={<FeatBuilder onCreate={createCustom} />}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
