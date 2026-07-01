import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronRight, Plus, X } from 'lucide-react';
import BackgroundForm, { blankBackgroundDraft, backgroundDraftToPayload } from './BackgroundForm';

/**
 * The backgrounds library browser — mirrors the Feats pillar. Search by name,
 * grouped by Standard vs Homebrew. "+ New Background" opens an inline create
 * modal; each row drills into the detail view for edit/delete. Only one demo
 * background ships seeded — the rest are added here by hand.
 */
export default function BackgroundListView({ onOpenBackground }) {
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
      fetch(`/api/dnd/backgrounds?${params}`)
        .then(r => r.json())
        .then(rows => setResults(Array.isArray(rows) ? rows : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, bump]);

  const groups = useMemo(() => {
    const standard = results.filter(b => !b.is_custom);
    const homebrew = results.filter(b => b.is_custom);
    return [['Standard', standard], ['Homebrew', homebrew]].filter(([, list]) => list.length > 0);
  }, [results]);

  return (
    <div className="wiki-spells">
      <div className="wiki-items__head">
        <h2 className="wiki-list__title">Backgrounds</h2>
        <button className="dnd-add-btn" onClick={() => setCreating(true)}>
          <Plus size={14} /> New Background
        </button>
      </div>

      <div className="wiki-spellfilter">
        <div className="wiki-spellfilter__search">
          <Search size={14} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or flavor…" />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="wiki-spells__empty">{loading ? 'Searching…' : 'No backgrounds yet — add one with “New Background”.'}</p>
      ) : (
        groups.map(([label, backgrounds]) => (
          <section key={label} className="wiki-spelltier" style={{ '--tier': 'var(--dnd-accent)' }}>
            <h3 className="wiki-spelltier__head">{label} <span className="wiki-spelltier__count">{backgrounds.length}</span></h3>
            <div className="wiki-spellrows">
              {backgrounds.map(b => (
                <button key={b.id} className="wiki-spellrow" onClick={() => onOpenBackground(b)}>
                  <span className="wiki-spellrow__name">{b.name}</span>
                  {(b.skill_proficiencies || []).length > 0 && (
                    <span className="wiki-spellrow__range">{b.skill_proficiencies.join(', ')}</span>
                  )}
                  <ChevronRight size={15} className="wiki-spellrow__chev" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {creating && (
        <CreateBackgroundModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setBump(b => b + 1); }} />
      )}
    </div>
  );
}

function CreateBackgroundModal({ onClose, onCreated }) {
  const [draft, setDraft] = useState(blankBackgroundDraft);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/dnd/backgrounds', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backgroundDraftToPayload(draft)),
      });
      onCreated();
    } catch (e) {
      console.error('Create background failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="spell-modal__overlay" onClick={onClose}>
      <div className="spell-modal" onClick={e => e.stopPropagation()}>
        <div className="spell-modal__header">
          <h3>New Background</h3>
          <button className="spell-modal__close" onClick={onClose}><X size={16} /></button>
        </div>
        <BackgroundForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={onClose}>Cancel</button>
          <button className="spell-modal__submit" onClick={submit} disabled={saving || !draft.name.trim()}>
            {saving ? 'Creating…' : 'Create Background'}
          </button>
        </div>
      </div>
    </div>
  );
}
