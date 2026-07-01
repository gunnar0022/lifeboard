import { ChevronRight } from 'lucide-react';

/**
 * Reusable master/detail chooser for the creation steps — generalized from the
 * SubclassPicker interaction. A scrollable name list on the left; the highlighted
 * entry's full detail (usually an encyclopedia detail view) on the right.
 * Selection is immediate (updates the draft); the flow's own footer handles nav.
 *
 * Props:
 *   items        [{ id, name, meta?, muted? }]
 *   selectedId   currently-selected id (or null)
 *   onSelect     (id) => void
 *   renderDetail (selectedId) => JSX | null
 *   accent       CSS color for the active highlight
 *   emptyHint    text shown in the detail pane when nothing is selected
 *   loading      show a loading line in the list
 */
export default function ChooserShell({ items, selectedId, onSelect, renderDetail, accent = 'var(--dnd-accent)', emptyHint, loading }) {
  return (
    <div className="crt-chooser" style={{ '--accent': accent }}>
      <nav className="crt-chooser__list">
        {loading && <p className="crt-chooser__empty">Loading…</p>}
        {!loading && items.length === 0 && <p className="crt-chooser__empty">Nothing to choose from.</p>}
        {items.map(it => (
          <button
            key={it.id}
            className={`crt-chooser__item ${selectedId === it.id ? 'crt-chooser__item--active' : ''}`}
            onClick={() => onSelect(it.id)}
          >
            <span className="crt-chooser__item-name">{it.name}</span>
            {it.meta && <span className="crt-chooser__item-meta">{it.meta}</span>}
            {it.muted && <span className="crt-chooser__item-soon">{it.muted}</span>}
            <ChevronRight size={14} className="crt-chooser__item-chev" />
          </button>
        ))}
      </nav>
      <div className="crt-chooser__detail">
        {selectedId ? renderDetail(selectedId) : <p className="crt-chooser__empty">{emptyHint}</p>}
      </div>
    </div>
  );
}
