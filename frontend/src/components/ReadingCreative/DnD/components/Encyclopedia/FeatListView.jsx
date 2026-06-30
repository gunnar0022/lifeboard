import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronRight, Plus, X } from 'lucide-react';
import FeatForm, { blankFeatDraft, featDraftToPayload } from './FeatForm';

/**
 * The feats library browser — mirrors the Items pillar. Search by name, grouped
 * by source (Standard vs Homebrew). "+ New Feat" opens an inline create modal;
 * each row drills into the detail view for edit/delete.
 */
export default function FeatListView({ onOpenFeat }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bump, setBump] = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('limit', '300');
      setLoading(true);
      fetch(`/api/dnd/feats?${params}`)
        .then(r => r.json())
        .then(rows => setResults(Array.isArray(rows) ? rows : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, bump]);

  const groups = useMemo(() => {
    const standard = results.filter(f => !f.is_custom);
    const homebrew = results.filter(f => f.is_custom);
    return [['Standard', standard], ['Homebrew', homebrew]].filter(([, list]) => list.length > 0);
  }, [results]);

  return (
    <div className="wiki-spells">
      <div className="wiki-items__head">
        <h2 className="wiki-list__title">Feats</h2>
        <button className="dnd-add-btn" onClick={() => setCreating(true)}>
          <Plus size={14} /> New Feat
        </button>
      </div>

      <div className="wiki-spellfilter">
        <div className="wiki-spellfilter__search">
          <Search size={14} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or effect…" />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="wiki-spells__empty">{loading ? 'Searching…' : 'No feats yet — add one with “New Feat”.'}</p>
      ) : (
        groups.map(([label, feats]) => (
          <section key={label} className="wiki-spelltier" style={{ '--tier': 'var(--dnd-accent)' }}>
            <h3 className="wiki-spelltier__head">{label} <span className="wiki-spelltier__count">{feats.length}</span></h3>
            <div className="wiki-spellrows">
              {feats.map(f => (
                <button key={f.id} className="wiki-spellrow" onClick={() => onOpenFeat(f)}>
                  <span className="wiki-spellrow__name">{f.name}</span>
                  {f.prerequisite && <span className="wiki-spellrow__range">{f.prerequisite}</span>}
                  {f.asi && f.asi.fixed && <span className="wiki-spellrow__dmg mech mech--num">+1 {Object.keys(f.asi.fixed)[0]}</span>}
                  <ChevronRight size={15} className="wiki-spellrow__chev" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {creating && (
        <CreateFeatModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setBump(b => b + 1); }} />
      )}
    </div>
  );
}

function CreateFeatModal({ onClose, onCreated }) {
  const [draft, setDraft] = useState(blankFeatDraft);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!draft.name.trim() || !draft.description.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/dnd/feats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featDraftToPayload(draft)),
      });
      onCreated();
    } catch (e) {
      console.error('Create feat failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="spell-modal__overlay" onClick={onClose}>
      <div className="spell-modal" onClick={e => e.stopPropagation()}>
        <div className="spell-modal__header">
          <h3>New Feat</h3>
          <button className="spell-modal__close" onClick={onClose}><X size={16} /></button>
        </div>
        <FeatForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={onClose}>Cancel</button>
          <button className="spell-modal__submit" onClick={submit} disabled={saving || !draft.name.trim() || !draft.description.trim()}>
            {saving ? 'Creating…' : 'Create Feat'}
          </button>
        </div>
      </div>
    </div>
  );
}
