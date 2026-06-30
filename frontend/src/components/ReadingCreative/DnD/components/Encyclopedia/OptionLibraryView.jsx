import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { pickerTheme } from '../OptionPicker/pickerThemes';
import { getOptionLibrary } from '../OptionPicker/optionLibraries';

/**
 * Read-only Encyclopedia view of one class-option library (invocations,
 * maneuvers, …). Reuses the bespoke picker skin (op-picker--{skin}) so browsing
 * here matches the level-up pickers, rendered inline rather than as a modal.
 */
export default function OptionLibraryView({ categoryKey }) {
  const lib = getOptionLibrary(categoryKey);
  const theme = pickerTheme(lib.themeKey);
  const { Icon } = theme;
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lib.options;
    return lib.options.filter(o =>
      o.name.toLowerCase().includes(q) || (o.desc || '').toLowerCase().includes(q));
  }, [lib.options, query]);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className={`op-picker op-picker--${theme.skin} op-picker--inline`} style={{ '--op-accent': theme.accent }}>
      <div className="op-picker__banner">
        <div className="op-picker__banner-icon"><Icon size={26} /></div>
        <div className="op-picker__banner-text">
          <h3 className="op-picker__title">{theme.title}</h3>
          <p className="op-picker__tagline">{theme.tagline}</p>
        </div>
        <div className="op-picker__counter"><span className="op-picker__counter-num">{lib.options.length}</span></div>
      </div>

      <div className="op-picker__controls">
        <div className="op-picker__search">
          <Search size={14} />
          <input className="dnd-field" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${theme.title.toLowerCase()}…`} />
        </div>
      </div>

      <div className="op-picker__body">
        <div className="op-picker__list">
          {filtered.length === 0 && <div className="op-picker__no-results">No matches.</div>}
          {filtered.map(o => {
            const open = !!expanded[o.id];
            return (
              <div key={o.id} className="op-picker__opt op-picker__opt--readonly">
                <button className="op-picker__opt-main" onClick={() => toggle(o.id)} aria-expanded={open}>
                  <span className="op-picker__opt-chev">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
                  <span className="op-picker__opt-name">{o.name}</span>
                  {o.meta && <span className="op-picker__opt-meta">{o.meta}</span>}
                  {o.minLevel > 0 && <span className="op-picker__opt-lock"><Lock size={11} /> Lvl {o.minLevel}+</span>}
                </button>
                {open && o.desc && <p className="op-picker__opt-desc">{o.desc}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
