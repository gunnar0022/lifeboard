import { useState } from 'react';
import { X } from 'lucide-react';
import { HELP_CONTENT } from './helpContent';

function Block({ block }) {
  if (block.type === 'p') return <p className="dnd-help__p">{block.text}</p>;
  if (block.type === 'tip') {
    return (
      <div className="dnd-help__tip">
        <span className="dnd-help__tip-label">Tip</span>
        <span>{block.text}</span>
      </div>
    );
  }
  if (block.type === 'list') {
    return (
      <ul className="dnd-help__list">
        {block.items.map((it, i) => (
          <li key={i} className="dnd-help__list-item">
            {it.term && <span className="dnd-help__term">{it.term}</span>}
            <span className="dnd-help__def">{it.text}</span>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

/**
 * Beginner help dialog for a single topic. Multi-section topics render their
 * sections as sub-tabs so the reader gets bite-sized panels.
 */
export default function HelpModal({ topic, onClose }) {
  const content = HELP_CONTENT[topic];
  const [active, setActive] = useState(0);
  if (!content) return null;

  const sections = content.sections || [];
  const multi = sections.length > 1;
  const section = sections[active] || sections[0];

  return (
    <div className="dnd-help__overlay" onClick={onClose}>
      <div className="dnd-help" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dnd-help__header">
          <h3 className="dnd-help__title">{content.title}</h3>
          <button className="dnd-help__close" onClick={onClose} aria-label="Close help"><X size={16} /></button>
        </div>

        {content.intro && <p className="dnd-help__intro">{content.intro}</p>}

        {multi && (
          <div className="dnd-help__subtabs">
            {sections.map((s, i) => (
              <button
                key={s.id}
                className={`dnd-help__subtab ${i === active ? 'dnd-help__subtab--active' : ''}`}
                onClick={() => setActive(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="dnd-help__body">
          {section?.blocks.map((b, i) => <Block key={i} block={b} />)}
        </div>
      </div>
    </div>
  );
}
