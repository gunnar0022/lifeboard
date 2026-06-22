import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Mech from './Mech';

/**
 * Collapsible level-by-level progression. The fine mechanical detail is
 * available but folded away by default, so a class/subclass page leads with
 * flavor and only shows the table when the reader asks for it.
 */
export default function ProgressionList({ progression, label = 'Level progression' }) {
  const [open, setOpen] = useState(false);
  if (!progression?.length) return null;

  const sorted = [...progression].sort((a, b) => (a.level || 1) - (b.level || 1));

  return (
    <section className="wiki-section">
      <button className="wiki-prog__toggle" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span>{label}</span>
        <span className="wiki-prog__count">{sorted.length}</span>
      </button>
      {open && (
        <div className="wiki-prog__list">
          {sorted.map(f => (
            <div key={f.id || `${f.level}-${f.name}`} className="wiki-prog__row">
              <span className="wiki-prog__lvl">{f.level || 1}</span>
              <div className="wiki-prog__body">
                <span className="wiki-prog__name">{f.name}</span>
                {f.desc && <p className="wiki-prog__desc"><Mech text={f.desc} /></p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
