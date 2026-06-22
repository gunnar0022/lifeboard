import { useState } from 'react';
import Mech from './Mech';

/**
 * Tabbed browser for an inline build choice with named options (Half-Elf
 * Versatility, Human origin, etc.). Each option is a pill tab; selecting one
 * shows its full text. Distinct from a full lineage drill-in — these are
 * variations within a single race page, so they stay inline and tabbed.
 */
export default function ChoiceTabs({ options }) {
  const [active, setActive] = useState(0);
  if (!options?.length) return null;
  const current = options[active];

  return (
    <div className="wiki-choice">
      <div className="wiki-choice__tabs">
        {options.map((o, i) => (
          <button
            key={o.name || i}
            className={`wiki-choice__tab ${i === active ? 'wiki-choice__tab--active' : ''}`}
            onClick={() => setActive(i)}
          >
            {o.name}
          </button>
        ))}
      </div>
      <p className="wiki-choice__desc"><Mech text={current.desc} /></p>
    </div>
  );
}
