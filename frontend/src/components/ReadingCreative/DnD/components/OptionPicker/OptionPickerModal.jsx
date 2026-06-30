import { useState, useMemo } from 'react';
import { X, Search, Plus, Check, Lock, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { pickerTheme } from './pickerThemes';

/**
 * Shared, bespoke-skinned option picker that layers on top of the screen (and on
 * top of the Level Up / spell modals when opened from there). The functional core
 * is generic — browse + search a library, see what's chosen, add/remove within a
 * cap — while the `themeKey` gives each class its own look via option-picker.css.
 *
 * The caller owns the data + storage; this component is presentational:
 *   options  [{ id, name, meta, desc, locked, lockedReason }]
 *   chosen   [{ key, name, meta, desc, custom }]   (resolved selected entries)
 *   chosenIds Set<id>                              (for highlight/disable)
 */
export default function OptionPickerModal({
  themeKey, count, max, options = [], chosen = [], chosenIds,
  repeatable = false, onAdd, onRemove, customBuilder, emptyHint, onClose,
}) {
  const theme = pickerTheme(themeKey);
  const { Icon } = theme;
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [showBuilder, setShowBuilder] = useState(false);

  const selectedSet = chosenIds || new Set(chosen.map(c => c.id).filter(Boolean));
  const atCap = max != null && count >= max;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o =>
      o.name.toLowerCase().includes(q) || (o.desc || '').toLowerCase().includes(q));
  }, [options, query]);

  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const toggleDesc = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="op-picker__overlay" onClick={onOverlayClick}>
      <div className={`op-picker op-picker--${theme.skin}`} role="dialog" aria-modal="true"
        style={{ '--op-accent': theme.accent }}>
        <button className="op-picker__close" onClick={onClose} aria-label="Close"><X size={18} /></button>

        {/* Themed banner */}
        <div className="op-picker__banner">
          <div className="op-picker__banner-icon"><Icon size={26} /></div>
          <div className="op-picker__banner-text">
            <h3 className="op-picker__title">{theme.title}</h3>
            <p className="op-picker__tagline">{theme.tagline}</p>
          </div>
          {max != null && (
            <div className={`op-picker__counter ${atCap ? 'op-picker__counter--full' : ''}`}>
              <span className="op-picker__counter-num">{count}</span>
              <span className="op-picker__counter-max">/ {max}</span>
            </div>
          )}
        </div>

        {/* Chosen strip */}
        <div className="op-picker__chosen">
          {chosen.length === 0 ? (
            <span className="op-picker__chosen-empty">{emptyHint || 'Nothing chosen yet — pick from the library below.'}</span>
          ) : chosen.map(c => (
            <span key={c.key} className={`op-picker__chip ${c.custom ? 'op-picker__chip--custom' : ''}`}>
              {c.name}
              <button className="op-picker__chip-x" onClick={() => onRemove(c.key)} aria-label={`Remove ${c.name}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="op-picker__controls">
          <div className="op-picker__search">
            <Search size={14} />
            <input className="dnd-field" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${theme.title.toLowerCase()}…`} />
          </div>
          {customBuilder && (
            <button
              className={`op-picker__builder-toggle ${showBuilder ? 'op-picker__builder-toggle--on' : ''}`}
              onClick={() => setShowBuilder(s => !s)}
            >
              <Wand2 size={14} /> {showBuilder ? 'Back to library' : 'Create custom'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="op-picker__body">
          {showBuilder && customBuilder ? (
            <div className="op-picker__builder">{customBuilder}</div>
          ) : (
            <div className="op-picker__list">
              {filtered.length === 0 && <div className="op-picker__no-results">No matches.</div>}
              {filtered.map(o => {
                const isSel = selectedSet.has(o.id);
                const open = !!expanded[o.id];
                const optRepeatable = o.repeatable ?? repeatable;
                const disabled = o.locked || atCap || (isSel && !optRepeatable);
                return (
                  <div key={o.id} className={`op-picker__opt ${isSel ? 'op-picker__opt--selected' : ''} ${o.locked ? 'op-picker__opt--locked' : ''}`}>
                    <button className="op-picker__opt-main" onClick={() => toggleDesc(o.id)} aria-expanded={open}>
                      <span className="op-picker__opt-chev">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
                      <span className="op-picker__opt-name">{o.name}</span>
                      {o.meta && <span className="op-picker__opt-meta">{o.meta}</span>}
                      {o.locked && <span className="op-picker__opt-lock"><Lock size={11} /> {o.lockedReason}</span>}
                    </button>
                    <button
                      className="op-picker__opt-add"
                      onClick={() => onAdd(o)}
                      disabled={disabled}
                      title={o.locked ? o.lockedReason : isSel && !repeatable ? 'Already chosen' : atCap ? 'At your limit' : 'Add'}
                    >
                      {isSel && !optRepeatable ? <Check size={15} /> : <Plus size={15} />}
                    </button>
                    {open && o.desc && <p className="op-picker__opt-desc">{o.desc}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
