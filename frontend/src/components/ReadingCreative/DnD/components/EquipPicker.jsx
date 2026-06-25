import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { ITEM_KINDS, KIND_LABELS } from '../rules/items';

/**
 * Add-from-library modal for the Equipment tab. Searches the shared items
 * library (/api/dnd/items) with an optional kind filter; picking a row hands the
 * full library item back so the tab can spin up a per-character instance.
 */
export default function EquipPicker({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('any');
  const [results, setResults] = useState([]);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { if (searchRef.current) searchRef.current.focus(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (kind !== 'any') params.set('kind', kind);
      params.set('limit', '50');
      fetch(`/api/dnd/items?${params}`)
        .then(r => r.json())
        .then(rows => setResults(Array.isArray(rows) ? rows : []))
        .catch(() => setResults([]));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, kind]);

  return (
    <div className="spell-modal__overlay" onClick={onClose}>
      <div className="spell-modal" onClick={e => e.stopPropagation()}>
        <div className="spell-modal__header">
          <h3>Add from Library</h3>
          <button className="spell-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="spell-modal__search">
          <Search size={14} />
          <input ref={searchRef} className="dnd-field" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search items…" />
          <select className="dnd-field spell-modal__level-filter" value={kind} onChange={e => setKind(e.target.value)}>
            <option value="any">Any kind</option>
            {ITEM_KINDS.map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
        </div>

        <div className="spell-modal__results">
          {results.map(it => (
            <button key={it.id} className="spell-modal__result" onClick={() => { onPick(it); onClose(); }}>
              <span className="spell-modal__result-name">{it.name}</span>
              <span className="spell-modal__result-level">{KIND_LABELS[it.kind] || it.kind}</span>
              {it.damage_dice && <span className="spell-modal__result-damage">{it.damage_dice}</span>}
              {it.base_ac != null && (
                <span className="spell-modal__result-range">
                  {it.kind === 'shield' ? `+${it.base_ac} AC` : `AC ${it.base_ac}`}
                </span>
              )}
            </button>
          ))}
          {results.length === 0 && q && <div className="spell-modal__no-results">No items found</div>}
        </div>
      </div>
    </div>
  );
}
