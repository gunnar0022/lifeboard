import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronRight, Plus, X } from 'lucide-react';
import { ITEM_KINDS, KIND_LABELS } from '../../rules/items';
import ItemForm, { blankItemDraft, itemDraftToPayload } from './ItemForm';

/**
 * The items library browser — the central armory. Search by name, filter by
 * kind, grouped by kind for scanning. "+ New Item" opens an inline create modal
 * (full write); each row drills into the detail view for edit/delete.
 */
export default function ItemsListView({ onOpenItem }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('any');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bump, setBump] = useState(0); // re-fetch trigger after a create
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (kind !== 'any') params.set('kind', kind);
      params.set('limit', '400');
      setLoading(true);
      fetch(`/api/dnd/items?${params}`)
        .then(r => r.json())
        .then(rows => setResults(Array.isArray(rows) ? rows : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, kind, bump]);

  const groups = useMemo(() => {
    const byKind = new Map();
    for (const it of results) {
      if (!byKind.has(it.kind)) byKind.set(it.kind, []);
      byKind.get(it.kind).push(it);
    }
    return ITEM_KINDS.filter(k => byKind.has(k)).map(k => [k, byKind.get(k)]);
  }, [results]);

  return (
    <div className="wiki-spells">
      <div className="wiki-items__head">
        <h2 className="wiki-list__title">Items</h2>
        <button className="dnd-add-btn" onClick={() => setCreating(true)}>
          <Plus size={14} /> New Item
        </button>
      </div>

      <div className="wiki-spellfilter">
        <div className="wiki-spellfilter__search">
          <Search size={14} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name…" />
        </div>
        <select value={kind} onChange={e => setKind(e.target.value)} className="dnd-field">
          <option value="any">Any kind</option>
          {ITEM_KINDS.map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
        </select>
      </div>

      {groups.length === 0 ? (
        <p className="wiki-spells__empty">{loading ? 'Searching…' : 'No items match these filters.'}</p>
      ) : (
        groups.map(([k, items]) => (
          <section key={k} className="wiki-spelltier" style={{ '--tier': 'var(--dnd-accent)' }}>
            <h3 className="wiki-spelltier__head">
              {KIND_LABELS[k]} <span className="wiki-spelltier__count">{items.length}</span>
            </h3>
            <div className="wiki-spellrows">
              {items.map(it => (
                <button key={it.id} className="wiki-spellrow" onClick={() => onOpenItem(it)}>
                  <span className="wiki-spellrow__name">{it.name}</span>
                  {it.damage_dice && <span className="wiki-spellrow__dmg mech mech--dice">{it.damage_dice}</span>}
                  {it.base_ac != null && (
                    <span className="wiki-spellrow__dmg mech mech--num">
                      {k === 'shield' ? `+${it.base_ac}` : `AC ${it.base_ac}`}
                    </span>
                  )}
                  {it.has_charges ? <span className="wiki-spellrow__range">{it.max_charges} chg</span> : null}
                  <ChevronRight size={15} className="wiki-spellrow__chev" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {creating && (
        <CreateItemModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); setBump(b => b + 1); }}
        />
      )}
    </div>
  );
}

function CreateItemModal({ onClose, onCreated }) {
  const [draft, setDraft] = useState(() => blankItemDraft('melee'));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/dnd/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemDraftToPayload(draft)),
      });
      onCreated();
    } catch (e) {
      console.error('Create item failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="spell-modal__overlay" onClick={onClose}>
      <div className="spell-modal" onClick={e => e.stopPropagation()}>
        <div className="spell-modal__header">
          <h3>New Item</h3>
          <button className="spell-modal__close" onClick={onClose}><X size={16} /></button>
        </div>
        <ItemForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={onClose}>Cancel</button>
          <button className="spell-modal__submit" onClick={submit} disabled={saving || !draft.name.trim()}>
            {saving ? 'Creating…' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
